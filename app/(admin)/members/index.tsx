// app/(admin)/members/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminService } from '../../../src/services/admin.service';
import type { Member } from '../../../src/types/member.types';
import { useDebouncedValue } from '../../../src/hooks/useDebounce';

export default function MemberDirectoryScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async (query?: string) => {
    try {
      const data = await adminService.getApprovedMembers(query || undefined);
      setMembers(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(debouncedSearch); }, [debouncedSearch]);

  function onRefresh() {
    setRefreshing(true);
    load(debouncedSearch);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Member Directory</Text>
          <Text style={styles.count}>{members.length} approved members</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or membership ID…"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F1F3D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{search ? '🔍' : '👥'}</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'No results found' : 'No approved members yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {search ? `No members match "${search}"` : 'Approved members will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              onPress={() => router.push(`/(admin)/members/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function MemberRow({ member, onPress }: { member: Member; onPress: () => void }) {
  const fullName = [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean).join(' ');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>
          {member.first_name.charAt(0)}{member.last_name.charAt(0)}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{fullName}</Text>
        <Text style={styles.rowEmail}>{member.email}</Text>
        <Text style={styles.rowNum}>{member.membership_number}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: '#0F1F3D' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F1F3D' },
  count: { fontSize: 13, color: '#64748B' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  clearBtn: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F1F3D' },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 72 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, backgroundColor: '#fff',
  },
  rowAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rowAvatarText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#0F1F3D' },
  rowEmail: { fontSize: 12, color: '#64748B' },
  rowNum: { fontSize: 12, color: '#C9A84C', fontWeight: '600', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  activeBadge: {
    backgroundColor: '#DCFCE7', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  chevron: { fontSize: 22, color: '#CBD5E1' },
});
