// app/(admin)/pending.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminService } from '../../src/services/admin.service';
import type { MemberWithProfile } from '../../src/types/member.types';

export default function PendingApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminService.getPendingApplications();
      setApplications(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F1F3D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Pending Applications</Text>
          <Text style={styles.count}>{applications.length} awaiting review</Text>
        </View>
      </View>

      <FlatList
        data={applications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>No pending applications to review.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicationCard
            member={item}
            onPress={() => router.push(`/(admin)/members/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

function ApplicationCard({
  member, onPress,
}: {
  member: MemberWithProfile; onPress: () => void;
}) {
  const fullName = [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean).join(' ');
  const submittedDate = new Date(member.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardLeft}>
        {member.photo_url ? (
          <Image source={{ uri: member.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {member.first_name.charAt(0)}{member.last_name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{fullName}</Text>
        <Text style={styles.cardEmail}>{member.email}</Text>
        <Text style={styles.cardMeta}>📅 Applied {submittedDate}</Text>
        <Text style={styles.cardMeta}>📱 {member.mobile_number}</Text>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
        <Text style={styles.reviewText}>Tap to review →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: '#0F1F3D' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F1F3D' },
  count: { fontSize: 13, color: '#64748B' },
  list: { padding: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F1F3D' },
  emptyDesc: { fontSize: 14, color: '#64748B' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLeft: {},
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0F1F3D' },
  cardEmail: { fontSize: 12, color: '#64748B' },
  cardMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  pendingBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  reviewText: { fontSize: 11, color: '#94A3B8' },
});
