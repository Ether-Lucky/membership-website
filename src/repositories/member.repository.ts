// src/repositories/member.repository.ts
import { supabase } from '../lib/supabase';
import type {
  Member,
  MemberWithProfile,
  RegistrationFormData,
} from '../types/member.types';

export const memberRepository = {
  /**
   * Create a new member record after auth registration
   */
  async create(profileId: string, data: RegistrationFormData, photoUrl?: string): Promise<Member> {
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        profile_id: profileId,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        birthdate: data.birthdate,
        email: data.email,
        mobile_number: data.mobileNumber,
        address: data.address,
        photo_url: photoUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return member;
  },

  /**
   * Get member by their profile ID (logged-in user)
   */
  async getByProfileId(profileId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get member by membership number (for verification)
   */
  async getByMembershipNumber(membershipNumber: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('membership_number', membershipNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get member with profile (admin use)
   */
  async getByIdWithProfile(memberId: string): Promise<MemberWithProfile | null> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('id', memberId)
      .maybeSingle();

    if (error) throw error;
    return data as MemberWithProfile | null;
  },

  /**
   * List all pending applications (admin)
   */
  async listPending(): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        profile:profiles!inner(*)
      `)
      .eq('profiles.status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MemberWithProfile[];
  },

  /**
   * List approved members with optional search (admin)
   */
  async listApproved(search?: string): Promise<Member[]> {
    let query = supabase
      .from('members')
      .select(`
        *,
        profile:profiles!inner(*)
      `)
      .eq('profiles.status', 'approved')
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

  /**
   * Update own profile fields (limited)
   */
  async updateOwnProfile(memberId: string, updates: Partial<Pick<Member, 'mobile_number' | 'address' | 'photo_url'>>): Promise<Member> {
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
