// app/(auth)/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';
import type { RegistrationFormData } from '../../src/types/member.types';

const FIELDS: Array<{
  key: keyof RegistrationFormData;
  label: string;
  required?: boolean;
  keyboard?: any;
  secure?: boolean;
  placeholder?: string;
}> = [
  { key: 'firstName',      label: 'First Name',      required: true,  placeholder: 'Juan' },
  { key: 'middleName',     label: 'Middle Name',      required: false, placeholder: 'Santos (optional)' },
  { key: 'lastName',       label: 'Last Name',        required: true,  placeholder: 'Dela Cruz' },
  { key: 'birthdate',      label: 'Birthdate',        required: true,  placeholder: 'YYYY-MM-DD' },
  { key: 'email',          label: 'Email Address',    required: true,  keyboard: 'email-address', placeholder: 'juan@email.com' },
  { key: 'mobileNumber',   label: 'Mobile Number',    required: true,  keyboard: 'phone-pad', placeholder: '09XXXXXXXXX' },
  { key: 'address',        label: 'Home Address',     required: true,  placeholder: 'Barangay, City, Province' },
  { key: 'password',       label: 'Password',         required: true,  secure: true, placeholder: 'At least 8 characters' },
  { key: 'confirmPassword',label: 'Confirm Password', required: true,  secure: true, placeholder: 'Repeat your password' },
];

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<RegistrationFormData>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof RegistrationFormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function showPhotoOptions() {
    Alert.alert('Profile Photo', 'Choose a photo source', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await authService.register({
        ...(form as RegistrationFormData),
        photoUri: photoUri || undefined,
      });
      Alert.alert(
        'Application Submitted!',
        'Your membership application is under review. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.replace('/(member)/pending') }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Membership Application</Text>
          <Text style={styles.subtitle}>
            Fill in all required fields. Your application will be reviewed by an administrator.
          </Text>
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoUpload} onPress={showPhotoOptions} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoEmpty}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoHint}>Tap to add photo</Text>
                <Text style={styles.photoSub}>JPG or PNG, max 5MB</Text>
              </View>
            )}
          </TouchableOpacity>
          {photoUri && (
            <TouchableOpacity onPress={showPhotoOptions}>
              <Text style={styles.changePhoto}>Change photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {FIELDS.map(field => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.label}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
              <TextInput
                style={styles.input}
                value={(form[field.key] as string) || ''}
                onChangeText={val => update(field.key, val)}
                secureTextEntry={field.secure}
                keyboardType={field.keyboard || 'default'}
                autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                placeholder={field.placeholder}
                placeholderTextColor="#94A3B8"
              />
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Application</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>Already a member? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, gap: 24 },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F1F3D' },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#0F1F3D',
    textTransform: 'uppercase', letterSpacing: 1,
    borderLeftWidth: 3, borderLeftColor: '#C9A84C', paddingLeft: 10,
  },
  fieldGroup: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#fff', color: '#0F172A',
  },
  photoUpload: {
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
    borderRadius: 12, overflow: 'hidden', alignSelf: 'center',
    width: 140, height: 180,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoIcon: { fontSize: 32 },
  photoHint: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  photoSub: { fontSize: 11, color: '#94A3B8', textAlign: 'center' },
  changePhoto: {
    textAlign: 'center', color: '#C9A84C', fontSize: 13,
    fontWeight: '600', marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#0F1F3D', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center' },
  backText: { color: '#64748B', fontSize: 14 },
});
