// src/repositories/member.repository.ts
import { supabase } from '../lib/supabase';
import type {
  Member,
  MemberWithProfile,
  RegistrationFormData,
} from '../types/member.types';

export const memberRepository = {
  async create(profileId: string, data: RegistrationFormData, photoUrl?: string): Promise<Member> {
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        profile_id:    profileId,
        first_name:    data.firstName,
        middle_name:   data.middleName || null,
        last_name:     data.lastName,
        birthdate:     data.birthdate,
        email:         data.email,
        mobile_number: data.mobileNumber,
        address:       data.address,
        photo_url:     photoUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return member;
  },

  async getByProfileId(profileId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByMembershipNumber(membershipNumber: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('membership_number', membershipNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Explicit FK name used because members has 3 foreign keys to profiles
  async getByIdWithProfile(memberId: string): Promise<MemberWithProfile | null> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles!members_profile_id_fkey(*)
      `)
      .eq('id', memberId)
      .maybeSingle();

    if (error) throw error;
    return data as MemberWithProfile | null;
  },

  async listPending(): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles!members_profile_id_fkey(*)
      `)
      .eq('profile.status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MemberWithProfile[];
  },

  async listApproved(search?: string): Promise<Member[]> {
    let query = supabase
      .from('members')
      .select(`
        *,
        profile:profiles!members_profile_id_fkey(*)
      `)
      .eq('profile.status', 'approved')
      .order('last_name', { ascending: true });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,membership_number.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Member[];
  },

  async updateOwnProfile(
    memberId: string,
    updates: Partial<Pick<Member, 'mobile_number' | 'address' | 'photo_url'>>
  ): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};