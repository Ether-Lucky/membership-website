// app/(member)/dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { memberService } from '../../src/services/member.service';
import { authService } from '../../src/services/auth.service';
import type { Member } from '../../src/types/member.types';

export default function MemberDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    memberService.getOwnProfile(profile.id)
      .then(setMember)
      .catch(() => Alert.alert('Error', 'Could not load your profile.'))
      .finally(() => setLoading(false));
  }, [profile]);

  async function handleLogout() {
    await authService.logout();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F1F3D" />
      </View>
    );
  }

  const fullName = member
    ? [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')
    : '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{member?.first_name || 'Member'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
          <Text style={styles.logoutIconText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* Membership status card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Membership Status</Text>
          <View style={[
            styles.badge,
            profile?.status === 'approved' ? styles.badgeApproved : styles.badgePending,
          ]}>
            <Text style={[
              styles.badgeText,
              profile?.status === 'approved' ? styles.badgeTextApproved : styles.badgeTextPending,
            ]}>
              {profile?.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        {member?.membership_number && (
          <Text style={styles.membershipNum}>{member.membership_number}</Text>
        )}
        {member?.member_since && (
          <Text style={styles.memberSince}>
            Member since {new Date(member.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <ActionCard
          icon="🪪"
          title="My ID Card"
          desc="View your digital membership card"
          onPress={() => router.push('/(member)/id-card')}
          disabled={profile?.status !== 'approved'}
        />
        <ActionCard
          icon="🔍"
          title="Verify Membership"
          desc="Check any membership status"
          onPress={() => router.push('/verify/lookup')}
        />
      </View>

      {/* Personal Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Your Information</Text>
        <InfoRow label="Full Name" value={fullName} />
        <InfoRow label="Email" value={member?.email || '—'} />
        <InfoRow label="Mobile" value={member?.mobile_number || '—'} />
        <InfoRow label="Address" value={member?.address || '—'} />
      </View>
    </ScrollView>
  );
}

function ActionCard({
  icon, title, desc, onPress, disabled,
}: {
  icon: string; title: string; desc: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, disabled && styles.actionCardDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
      {disabled && <Text style={styles.disabledNote}>Pending approval</Text>}
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 24, paddingTop: 56, gap: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 26, fontWeight: '800', color: '#0F1F3D' },
  logoutIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  logoutIconText: { fontSize: 18 },
  statusCard: {
    backgroundColor: '#0F1F3D', borderRadius: 16, padding: 20, gap: 6,
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeApproved: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  badgeTextApproved: { color: '#16A34A' },
  badgeTextPending: { color: '#D97706' },
  membershipNum: { color: '#C9A84C', fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  memberSince: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0F1F3D', textTransform: 'uppercase', letterSpacing: 1 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  actionCardDisabled: { opacity: 0.5 },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#0F1F3D' },
  actionDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  disabledNote: { fontSize: 10, color: '#F59E0B', fontWeight: '600', marginTop: 4 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#0F1F3D', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  infoLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', flex: 1 },
  infoValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', flex: 2, textAlign: 'right' },
});
