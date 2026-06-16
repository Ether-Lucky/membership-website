// src/services/admin.service.ts
import { supabase } from '../lib/supabase';
import { memberRepository } from '../repositories/member.repository';
import type { MemberWithProfile, ApprovalAction, RejectionAction } from '../types/member.types';

export const adminService = {
  async getPendingApplications(): Promise<MemberWithProfile[]> {
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

  async getApprovedMembers(search?: string) {
    return memberRepository.listApproved(search);
  },

  async getMemberDetail(memberId: string): Promise<MemberWithProfile | null> {
    return memberRepository.getByIdWithProfile(memberId);
  },

  async approveMember({ memberId, adminId }: ApprovalAction): Promise<string> {
    const { data, error } = await supabase.rpc('approve_member', {
      p_member_id: memberId,
      p_admin_id: adminId,
    });
    if (error) throw error;
    return data as string;
  },

  async rejectMember({ memberId, adminId, reason }: RejectionAction): Promise<void> {
    const { error } = await supabase.rpc('reject_member', {
      p_member_id: memberId,
      p_admin_id: adminId,
      p_reason: reason || null,
    });
    if (error) throw error;
  },

  async getDashboardStats() {
    const [pending, approved, total] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('role', 'member'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('role', 'member'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'member'),
    ]);

    return {
      pending:  pending.count  ?? 0,
      approved: approved.count ?? 0,
      total:    total.count    ?? 0,
    };
  },
};
