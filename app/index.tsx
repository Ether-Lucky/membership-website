// app/index.tsx — Root redirect based on auth state
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';

export default function RootIndex() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
  
    if (!profile) {
      router.replace('/(auth)/login');
      return;
    }
  
    if (profile.role === 'admin') {
      router.replace('/(admin)/dashboard');
    } else if (profile.status === 'approved') {
      router.replace('/(member)/dashboard');
    } else {
      router.replace('/(member)/pending');
    }
  }, [profile, loading]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color="#0F1F3D" />
    </View>
  );
}
