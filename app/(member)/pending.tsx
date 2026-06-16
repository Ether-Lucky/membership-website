// app/(member)/pending.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';

const STEPS = [
  { icon: '📝', label: 'Application Submitted', done: true },
  { icon: '🔍', label: 'Under Review',          done: false, active: true },
  { icon: '✅', label: 'Approved',               done: false },
  { icon: '🪪', label: 'ID Card Issued',          done: false },
];

export default function PendingScreen() {
  const router = useRouter();

  async function handleLogout() {
    await authService.logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Illustration area */}
      <View style={styles.illustration}>
        <View style={styles.clockCircle}>
          <Text style={styles.clockIcon}>⏳</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Application Under Review</Text>
        <Text style={styles.subtitle}>
          Thank you for applying! Our administrators are reviewing your application.
          You will be notified once a decision has been made.
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Application Progress</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[
              styles.stepIconWrap,
              step.done && styles.stepDone,
              step.active && styles.stepActive,
            ]}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={styles.stepLine}>
              <Text style={[
                styles.stepLabel,
                step.done && styles.stepLabelDone,
                step.active && styles.stepLabelActive,
              ]}>
                {step.label}
              </Text>
              {step.active && (
                <Text style={styles.stepSub}>In progress…</Text>
              )}
            </View>
            {step.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What happens next?</Text>
        <Text style={styles.infoText}>
          Once approved, you'll receive access to your digital membership ID card,
          which you can show at events or scan for instant verification.
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 28, paddingTop: 60, gap: 24, alignItems: 'center' },
  illustration: { marginBottom: 8 },
  clockCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  clockIcon: { fontSize: 44 },
  titleBlock: { gap: 10, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F1F3D', textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22,
  },
  stepsCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  stepsTitle: {
    fontSize: 13, fontWeight: '700', color: '#0F1F3D',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  stepDone: { backgroundColor: '#DCFCE7' },
  stepActive: { backgroundColor: '#FEF3C7' },
  stepIcon: { fontSize: 18 },
  stepLine: { flex: 1 },
  stepLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  stepLabelDone: { color: '#16A34A', fontWeight: '600' },
  stepLabelActive: { color: '#0F1F3D', fontWeight: '700' },
  stepSub: { fontSize: 11, color: '#F59E0B', marginTop: 1 },
  checkmark: { color: '#16A34A', fontWeight: '800', fontSize: 16 },
  infoBox: {
    width: '100%', backgroundColor: '#EFF6FF', borderRadius: 12,
    padding: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6', gap: 6,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  infoText: { fontSize: 13, color: '#3B82F6', lineHeight: 20 },
  logoutBtn: {
    paddingVertical: 12, paddingHorizontal: 32,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
  },
  logoutText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
});
