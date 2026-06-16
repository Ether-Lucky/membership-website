// app/(member)/_layout.tsx
import { useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function MemberLayout() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/(auth)/login');
    } else if (profile.role === 'admin') {
      router.replace('/(admin)/dashboard');
    }
  }, [profile, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0F1F3D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

// ─────────────────────────────────────────────────────────────
// app/(member)/pending.tsx
// ─────────────────────────────────────────────────────────────
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { useRouter } from 'expo-router';
// import { authService } from '../../src/services/auth.service';

export function PendingScreen() {
  return null; // placeholder — see pending.tsx below
}
