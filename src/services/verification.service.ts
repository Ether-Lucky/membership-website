// src/services/verification.service.ts
import { supabase } from '../lib/supabase';
import { memberRepository } from '../repositories/member.repository';
import type { VerificationResult } from '../types/member.types';

export const verificationService = {
  async verifyByMembershipNumber(
    membershipNumber: string,
    ipAddress?: string
  ): Promise<VerificationResult> {
    const now = new Date().toISOString();
    const member = await memberRepository.getByMembershipNumber(membershipNumber);

    // Log attempt regardless of outcome
    await supabase.from('verification_logs').insert({
      member_id:           member?.id ?? null,
      membership_number:   membershipNumber,
      verification_method: 'manual_id',
      result:              !!member,
      ip_address:          ipAddress ?? null,
    });

    if (!member) {
      return { found: false, active: false, verifiedAt: now };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', member.profile_id)
      .single();

    const active = profile?.status === 'approved';
    const fullName = [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(' ');

    return {
      found: true,
      active,
      member: {
        fullName,
        membershipNumber: member.membership_number!,
        memberSince:      member.member_since!,
        status:           profile?.status,
      },
      verifiedAt: now,
    };
  },
};
