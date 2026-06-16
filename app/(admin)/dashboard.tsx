// app/(admin)/dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminService } from '../../src/services/admin.service';
import { authService } from '../../src/services/auth.service';

interface Stats {
  pending: number;
  approved: number;
  total: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await authService.logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Portal</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator size="large" color="#0F1F3D" style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard label="Total Members" value={stats.total} icon="👥" color="#0F1F3D" />
          <StatCard label="Approved" value={stats.approved} icon="✅" color="#16A34A" />
          <StatCard label="Pending Review" value={stats.pending} icon="⏳" color="#D97706" urgent={stats.pending > 0} />
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.menuList}>
        <MenuRow
          icon="📋"
          title="Pending Applications"
          desc="Review and approve new member requests"
          badge={stats.pending > 0 ? stats.pending : undefined}
          onPress={() => router.push('/(admin)/pending')}
        />
        <MenuRow
          icon="👤"
          title="Member Directory"
          desc="Search and view all approved members"
          onPress={() => router.push('/(admin)/members/')}
        />
        <MenuRow
          icon="🔍"
          title="Verify a Member"
          desc="Look up membership by ID or QR code"
          onPress={() => router.push('/verify/lookup')}
        />
      </View>

      {/* Version 2 placeholder */}
      <View style={styles.v2Block}>
        <Text style={styles.v2Title}>Coming Soon — Version 2</Text>
        <Text style={styles.v2Desc}>
          Events management, attendance tracking, and QR check-in are being prepared for the next release.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label, value, icon, color, urgent,
}: {
  label: string; value: number; icon: string; color: string; urgent?: boolean;
}) {
  return (
    <View style={[styles.statCard, urgent && styles.statCardUrgent]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon, title, desc, badge, onPress,
}: {
  icon: string; title: string; desc: string; badge?: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.menuIcon}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDesc}>{desc}</Text>
      </View>
      {badge !== undefined && (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 24, paddingTop: 56, gap: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F1F3D' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  logoutText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statCardUrgent: { borderWidth: 1.5, borderColor: '#FDE68A' },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#0F1F3D',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  menuList: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#0F1F3D' },
  menuDesc: { fontSize: 12, color: '#64748B', marginTop: 1 },
  badgePill: {
    backgroundColor: '#FEF3C7', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgePillText: { color: '#D97706', fontSize: 12, fontWeight: '700' },
  chevron: { fontSize: 22, color: '#CBD5E1' },
  v2Block: {
    backgroundColor: '#F0F4FF', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#6366F1',
  },
  v2Title: { fontSize: 13, fontWeight: '700', color: '#4338CA', marginBottom: 4 },
  v2Desc: { fontSize: 13, color: '#6366F1', lineHeight: 20 },
});
