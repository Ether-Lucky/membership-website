// supabase/functions/verify-member/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets on cold start)
// For production, use Upstash Redis or Supabase KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const WINDOW_MS  = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const membershipNumber = url.pathname.split('/').pop()?.toUpperCase();

    if (!membershipNumber || membershipNumber === 'verify-member') {
      return new Response(JSON.stringify({ error: 'Membership number is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up member
    const { data: member } = await supabase
      .from('members')
      .select('id, profile_id, first_name, middle_name, last_name, membership_number, member_since')
      .eq('membership_number', membershipNumber)
      .maybeSingle();

    const now = new Date().toISOString();

    if (!member) {
      // Log failed attempt
      await supabase.from('verification_logs').insert({
        membership_number:   membershipNumber,
        verification_method: 'manual_id',
        result:              false,
        ip_address:          ip,
      });

      return new Response(
        JSON.stringify({ found: false, active: false, verifiedAt: now }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile status
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', member.profile_id)
      .single();

    const active = profile?.status === 'approved';

    // Log verification
    await supabase.from('verification_logs').insert({
      member_id:           member.id,
      membership_number:   membershipNumber,
      verification_method: 'manual_id',
      result:              active,
      ip_address:          ip,
    });

    const fullName = [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(' ');

    return new Response(
      JSON.stringify({
        found:  true,
        active,
        member: {
          fullName,
          membershipNumber: member.membership_number,
          memberSince:      member.member_since,
          status:           profile?.status,
        },
        verifiedAt: now,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
