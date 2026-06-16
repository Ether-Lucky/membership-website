// app/_layout.tsx
// Root layout — required by Expo Router. Wraps the entire app.
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    // Refresh session on mount
    supabase.auth.getSession();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
