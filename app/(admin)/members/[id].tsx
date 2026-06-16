// app/(admin)/members/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, TextInput, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { adminService } from '../../../src/services/admin.service';
import { useAuth } from '../../../src/hooks/useAuth';
import type { MemberWithProfile } from '../../../src/types/member.types';

export default function MemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: adminProfile } = useAuth();

  const [member, setMember] = useState<MemberWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!id) return;
    adminService.getMemberDetail(id)
      .then(setMember)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    if (!member || !adminProfile) return;
    Alert.alert(
      'Approve Application',
      `Approve membership for ${member.first_name} ${member.last_name}? A unique Membership ID will be generated automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            try {
              const membershipNumber = await adminService.approveMember({
                memberId: member.id,
                adminId: adminProfile.id,
              });
              Alert.alert(
                'Approved! ✅',
                `${member.first_name} ${member.last_name} has been approved.\n\nMembership ID: ${membershipNumber}`,
                [{ text: 'Done', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not approve member.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleReject() {
    if (!member || !adminProfile) return;
    setActionLoading(true);
    try {
      await adminService.rejectMember({
        memberId: member.id,
        adminId: adminProfile.id,
        reason: rejectReason.trim() || undefined,
      });
      setShowRejectModal(false);
      Alert.alert(
        'Application Rejected',
        `${member.first_name} ${member.last_name}'s application has been rejected.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reject application.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F1F3D" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Member not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean).join(' ');
  const isPending = member.profile?.status === 'pending';
  const isApproved = member.profile?.status === 'approved';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Member Application</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile hero */}
        <View style={styles.hero}>
          {member.photo_url ? (
            <Image source={{ uri: member.photo_url }} style={styles.heroPhoto} />
          ) : (
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroInitials}>
                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.heroName}>{fullName}</Text>
          <StatusPill status={member.profile?.status} />
          {isApproved && member.membership_number && (
            <Text style={styles.heroMemberNum}>{member.membership_number}</Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <DetailRow label="First Name" value={member.first_name} />
          {member.middle_name && <DetailRow label="Middle Name" value={member.middle_name} />}
          <DetailRow label="Last Name" value={member.last_name} />
          <DetailRow label="Birthdate" value={new Date(member.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          <DetailRow label="Email" value={member.email} />
          <DetailRow label="Mobile" value={member.mobile_number} />
          <DetailRow label="Address" value={member.address} last />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Application Timeline</Text>
          <DetailRow label="Applied" value={formatDate(member.created_at)} />
          {member.approved_at && <DetailRow label="Approved" value={formatDate(member.approved_at)} />}
          {member.rejected_at && <DetailRow label="Rejected" value={formatDate(member.rejected_at)} />}
          {member.rejection_reason && (
            <DetailRow label="Rejection Reason" value={member.rejection_reason} last />
          )}
        </View>

        {/* Action buttons — only for pending */}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.approveBtn, actionLoading && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.approveBtnIcon}>✅</Text>
                  <Text style={styles.approveBtnText}>Approve Application</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectBtn, actionLoading && styles.btnDisabled]}
              onPress={() => setShowRejectModal(true)}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectBtnIcon}>❌</Text>
              <Text style={styles.rejectBtnText}>Reject Application</Text>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && (
          <View style={styles.approvedNote}>
            <Text style={styles.approvedNoteText}>
              ✅ This member has been approved and has access to their digital ID card.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Application</Text>
            <Text style={styles.modalSubtitle}>
              Optionally provide a reason. This will be stored internally.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, actionLoading && styles.btnDisabled]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
    approved: { bg: '#DCFCE7', text: '#16A34A', label: 'Approved' },
    rejected: { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' },
    suspended:{ bg: '#F1F5F9', text: '#64748B', label: 'Suspended' },
  };
  const s = map[status || 'pending'] || map.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusPillText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorText: { fontSize: 16, color: '#64748B' },
  linkText: { color: '#C9A84C', fontWeight: '600' },
  container: { padding: 24, paddingTop: 56, gap: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  backArrow: { fontSize: 20, color: '#0F1F3D' },
  screenTitle: { fontSize: 17, fontWeight: '700', color: '#0F1F3D' },
  hero: {
    backgroundColor: '#0F1F3D', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 10,
  },
  heroPhoto: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#C9A84C' },
  heroPhotoPlaceholder: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#C9A84C33',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#C9A84C',
  },
  heroInitials: { fontSize: 30, fontWeight: '800', color: '#C9A84C' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroMemberNum: { fontSize: 14, color: '#C9A84C', fontWeight: '700', letterSpacing: 1 },
  statusPill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  detailsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTitle: {
    fontSize: 12, fontWeight: '700', color: '#0F1F3D',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', flex: 1.5, textAlign: 'right' },
  actions: { gap: 12 },
  approveBtn: {
    backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  approveBtnIcon: { fontSize: 18 },
  approveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rejectBtn: {
    borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff',
  },
  rejectBtnIcon: { fontSize: 18 },
  rejectBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  approvedNote: {
    backgroundColor: '#DCFCE7', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#16A34A',
  },
  approvedNoteText: { color: '#16A34A', fontSize: 13, fontWeight: '600', lineHeight: 20 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F1F3D' },
  modalSubtitle: { fontSize: 13, color: '#64748B' },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    padding: 14, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalConfirm: {
    flex: 2, backgroundColor: '#DC2626', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
