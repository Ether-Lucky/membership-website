// app/(member)/id-card.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { memberService } from '../../src/services/member.service';
import { DigitalIDCard } from '../../src/components/member/DigitalIDCard';
import type { DigitalIDCard as IDCardData, Member } from '../../src/types/member.types';

export default function IDCardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [cardData, setCardData] = useState<IDCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const member = await memberService.getOwnProfile(profile.id);
        if (!member) throw new Error('Profile not found');
        const card = await memberService.buildDigitalIDCard(member);
        setCardData(card);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  async function handleShare() {
    if (!cardData) return;
    try {
      await Share.share({
        message: `Verify my membership at: ${cardData.qrCodeData}`,
        title: 'My Membership ID',
      });
    } catch {
      // user cancelled
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F1F3D" />
        <Text style={styles.loadingText}>Loading your ID card…</Text>
      </View>
    );
  }

  if (error || !cardData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Card Unavailable</Text>
        <Text style={styles.errorText}>{error || 'Your membership ID card is not available yet.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Membership ID</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Subheading */}
      <Text style={styles.subtitle}>
        Present this card at events or share the QR code for instant verification.
      </Text>

      {/* The card itself */}
      <View style={styles.cardWrapper}>
        <DigitalIDCard data={cardData} />
      </View>

      {/* Membership number copy-friendly display */}
      <View style={styles.numberBlock}>
        <Text style={styles.numberLabel}>Membership Number</Text>
        <Text style={styles.numberValue}>{cardData.membershipNumber}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share Verification Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={() => router.push(`/verify/${cardData.membershipNumber}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={[styles.actionText, styles.actionTextOutline]}>Preview Verification Page</Text>
        </TouchableOpacity>
      </View>

      {/* Note about PDF */}
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          📄 PDF export coming in a future update. You can currently share your verification link or take a screenshot of your ID card.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 24, paddingTop: 52, gap: 24, paddingBottom: 48 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 32, backgroundColor: '#F8FAFC',
  },
  loadingText: { color: '#64748B', fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0F1F3D' },
  errorText: { color: '#64748B', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  backBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#0F1F3D', borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  backArrow: { fontSize: 20, color: '#0F1F3D' },
  screenTitle: { fontSize: 17, fontWeight: '700', color: '#0F1F3D' },
  subtitle: { fontSize: 13, color: '#64748B', lineHeight: 20, textAlign: 'center' },
  cardWrapper: { alignItems: 'center' },
  numberBlock: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  numberLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  numberValue: { fontSize: 20, fontWeight: '800', color: '#0F1F3D', letterSpacing: 1.5 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0F1F3D', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18,
  },
  actionBtnOutline: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  actionIcon: { fontSize: 18 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  actionTextOutline: { color: '#0F1F3D' },
  noteBox: { backgroundColor: '#F0F4FF', borderRadius: 10, padding: 14 },
  noteText: { color: '#4B5563', fontSize: 12, lineHeight: 18 },
});
