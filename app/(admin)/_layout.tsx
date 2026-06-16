// app/(admin)/_layout.tsx
import { useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/(auth)/login');
    } else if (profile.role !== 'admin') {
      router.replace('/(member)/dashboard');
    }
  }, [profile, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0F1F3D" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
