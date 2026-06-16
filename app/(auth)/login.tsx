// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { role, status } = await authService.login(email.trim(), password);
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (status === 'approved') {
        router.replace('/(member)/dashboard');
      } else if (status === 'rejected') {
        Alert.alert(
          'Application Rejected',
          'Your membership application was not approved. Please contact the administrator.'
        );
      } else {
        router.replace('/(member)/pending');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.brandName}>MemberPortal</Text>
          <Text style={styles.brandSub}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.footerText}>
            Not a member yet?{' '}
            <Text style={styles.footerLink}>Apply for membership</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: {
    flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 32,
  },
  brand: { alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#0F1F3D', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText: { color: '#C9A84C', fontSize: 28, fontWeight: '800' },
  brandName: { fontSize: 22, fontWeight: '700', color: '#0F1F3D' },
  brandSub: { fontSize: 14, color: '#64748B' },
  form: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#fff', color: '#0F172A', marginTop: 4,
  },
  button: {
    backgroundColor: '#0F1F3D', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerText: { textAlign: 'center', color: '#64748B', fontSize: 14 },
  footerLink: { color: '#C9A84C', fontWeight: '600' },
});
