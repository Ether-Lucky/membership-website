// app/verify/[membershipNumber].tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verificationService } from '../../src/services/verification.service';
import type { VerificationResult } from '../../src/types/member.types';

export default function VerifyMembershipScreen() {
  const { membershipNumber } = useLocalSearchParams<{ membershipNumber: string }>();
  const router = useRouter();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!membershipNumber || membershipNumber === 'lookup') return;
    verificationService.verifyByMembershipNumber(membershipNumber)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [membershipNumber]);

  // "lookup" is used as a route when navigating to the manual lookup form
  if (membershipNumber === 'lookup') {
    return <LookupForm />;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F1F3D" />
        <Text style={styles.loadingText}>Verifying membership…</Text>
      </View>
    );
  }

  const verified = result?.found && result?.active;
  const notActive = result?.found && !result?.active;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.orgHeader}>
        <View style={styles.orgLogo}>
          <Text style={styles.orgLogoText}>M</Text>
        </View>
        <Text style={styles.orgName}>Membership Verification</Text>
      </View>

      {/* Result card */}
      {verified && result?.member && (
        <View style={[styles.resultCard, styles.resultCardSuccess]}>
          <View style={styles.resultIcon}>
            <Text style={styles.resultIconText}>✅</Text>
          </View>
          <Text style={styles.resultTitle}>Membership Verified</Text>
          <Text style={styles.resultSubtitle}>This is a valid, active member.</Text>

          <View style={styles.divider} />

          <DataRow label="Full Name"        value={result.member.fullName} />
          <DataRow label="Membership ID"    value={result.member.membershipNumber} highlight />
          <DataRow label="Member Since"     value={formatDate(result.member.memberSince)} />
          <DataRow label="Status"           value="Active ✓" green />
          <DataRow label="Verified At"      value={formatDateTime(result.verifiedAt)} last />
        </View>
      )}

      {notActive && result?.member && (
        <View style={[styles.resultCard, styles.resultCardWarning]}>
          <View style={[styles.resultIcon, styles.resultIconWarning]}>
            <Text style={styles.resultIconText}>⚠️</Text>
          </View>
          <Text style={styles.resultTitle}>Membership Not Active</Text>
          <Text style={styles.resultSubtitle}>
            This member was found but their membership is currently inactive.
          </Text>
          <View style={styles.divider} />
          <DataRow label="Full Name"    value={result.member.fullName} />
          <DataRow label="Membership ID" value={result.member.membershipNumber} />
          <DataRow label="Status"       value={result.member.status.toUpperCase()} red last />
        </View>
      )}

      {!result?.found && (
        <View style={[styles.resultCard, styles.resultCardError]}>
          <View style={[styles.resultIcon, styles.resultIconError]}>
            <Text style={styles.resultIconText}>❌</Text>
          </View>
          <Text style={styles.resultTitle}>Member Not Found</Text>
          <Text style={styles.resultSubtitle}>
            No member with ID <Text style={styles.mono}>{membershipNumber}</Text> exists in our system.
            Please double-check the membership number and try again.
          </Text>
          <View style={styles.divider} />
          <DataRow label="Queried ID"   value={membershipNumber || '—'} last />
          <DataRow label="Checked At"   value={formatDateTime(result?.verifiedAt || new Date().toISOString())} last />
        </View>
      )}

      {/* Timestamp footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Verification powered by MemberPortal • {new Date().getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => router.push('/verify/lookup')} style={{ marginTop: 8 }}>
          <Text style={styles.footerLink}>Verify another member →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Manual Lookup Form ────────────────────────────────────────────────────────
import { TextInput } from 'react-native';

function LookupForm() {
  const router = useRouter();
  const [input, setInput] = useState('');

  function handleSearch() {
    const clean = input.trim().toUpperCase();
    if (!clean) return;
    router.push(`/verify/${clean}`);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.orgHeader}>
        <View style={styles.orgLogo}>
          <Text style={styles.orgLogoText}>M</Text>
        </View>
        <Text style={styles.orgName}>Membership Verification</Text>
        <Text style={styles.orgSub}>Enter a membership ID below to verify</Text>
      </View>

      <View style={styles.lookupCard}>
        <Text style={styles.lookupLabel}>Membership Number</Text>
        <TextInput
          style={styles.lookupInput}
          value={input}
          onChangeText={setInput}
          placeholder="e.g. MEM-2026-000001"
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.lookupBtn, !input.trim() && styles.lookupBtnDisabled]}
          onPress={handleSearch}
          disabled={!input.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.lookupBtnText}>Verify Membership</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lookupNote}>
        <Text style={styles.lookupNoteText}>
          💡 You can also scan a member's QR code with your phone camera — it will open this page automatically.
        </Text>
      </View>
    </ScrollView>
  );
}

function DataRow({
  label, value, highlight, green, red, last,
}: {
  label: string; value: string; highlight?: boolean; green?: boolean; red?: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.dataRow, last && styles.dataRowLast]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={[
        styles.dataValue,
        highlight && styles.dataValueHighlight,
        green && styles.dataValueGreen,
        red && styles.dataValueRed,
      ]}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 24, paddingTop: 60, gap: 24, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#64748B', fontSize: 14 },
  orgHeader: { alignItems: 'center', gap: 8 },
  orgLogo: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#0F1F3D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  orgLogoText: { fontSize: 28, fontWeight: '800', color: '#C9A84C' },
  orgName: { fontSize: 18, fontWeight: '800', color: '#0F1F3D' },
  orgSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  resultCard: {
    borderRadius: 20, padding: 24, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  resultCardSuccess: { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: '#16A34A' },
  resultCardWarning: { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: '#D97706' },
  resultCardError:   { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: '#DC2626' },
  resultIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8,
  },
  resultIconWarning: { backgroundColor: '#FEF3C7' },
  resultIconError:   { backgroundColor: '#FEE2E2' },
  resultIconText: { fontSize: 26 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#0F1F3D', textAlign: 'center' },
  resultSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  dataRowLast: { borderBottomWidth: 0 },
  dataLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  dataValue: { fontSize: 13, color: '#0F172A', fontWeight: '600', textAlign: 'right', flex: 1 },
  dataValueHighlight: { color: '#C9A84C', fontSize: 14, fontWeight: '800' },
  dataValueGreen: { color: '#16A34A' },
  dataValueRed: { color: '#DC2626' },
  mono: { fontFamily: 'monospace', fontWeight: '700' },
  footer: { alignItems: 'center', paddingTop: 8 },
  footerText: { fontSize: 12, color: '#94A3B8' },
  footerLink: { color: '#C9A84C', fontWeight: '600', fontSize: 13 },
  // Lookup form
  lookupCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  lookupLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  lookupInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16,
    color: '#0F172A', fontWeight: '600', letterSpacing: 1,
  },
  lookupBtn: {
    backgroundColor: '#0F1F3D', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  lookupBtnDisabled: { opacity: 0.4 },
  lookupBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lookupNote: {
    backgroundColor: '#F0F4FF', borderRadius: 10, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#6366F1',
  },
  lookupNoteText: { color: '#4338CA', fontSize: 13, lineHeight: 20 },
});
