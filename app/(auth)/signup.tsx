// app/(auth)/signup.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';
import { validateRegistration } from '../../src/utils/validation';
import type { RegistrationFormData } from '../../src/types/member.types';

// ─── Password strength logic ──────────────────────────────────────────────────
interface PasswordStrength {
  score: number;          // 0–4
  label: string;
  color: string;
  barColor: string;
}

interface PasswordRules {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

function getPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasUpper:  /[A-Z]/.test(password),
    hasLower:  /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: '#E2E8F0', barColor: '#E2E8F0' };
  const rules = getPasswordRules(password);
  const passed = Object.values(rules).filter(Boolean).length;

  if (passed <= 1) return { score: 1, label: 'Very Weak',  color: '#EF4444', barColor: '#EF4444' };
  if (passed === 2) return { score: 2, label: 'Weak',       color: '#F97316', barColor: '#F97316' };
  if (passed === 3) return { score: 3, label: 'Fair',       color: '#EAB308', barColor: '#EAB308' };
  if (passed === 4) return { score: 4, label: 'Strong',     color: '#22C55E', barColor: '#22C55E' };
  return              { score: 5, label: 'Very Strong', color: '#16A34A', barColor: '#16A34A' };
}

// ─── Strength bar + requirements checklist ────────────────────────────────────
function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const rules    = getPasswordRules(password);

  const requirements = [
    { key: 'minLength', label: 'At least 8 characters',          met: rules.minLength },
    { key: 'hasUpper',  label: 'One uppercase letter (A–Z)',      met: rules.hasUpper  },
    { key: 'hasLower',  label: 'One lowercase letter (a–z)',      met: rules.hasLower  },
    { key: 'hasNumber', label: 'One number (0–9)',                met: rules.hasNumber },
    { key: 'hasSymbol', label: 'One symbol (!@#$%^&*…)',          met: rules.hasSymbol },
  ];

  return (
    <View style={meterStyles.wrap}>
      {/* Strength bar */}
      <View style={meterStyles.barRow}>
        <View style={meterStyles.barTrack}>
          <View
            style={[
              meterStyles.barFill,
              {
                width: `${(strength.score / 5) * 100}%` as any,
                backgroundColor: strength.barColor,
              },
            ]}
          />
        </View>
        <Text style={[meterStyles.strengthLabel, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      {/* Requirements checklist */}
      <View style={meterStyles.reqList}>
        {requirements.map(req => (
          <View key={req.key} style={meterStyles.reqRow}>
            <View style={[meterStyles.reqDot, req.met && meterStyles.reqDotMet]}>
              <Text style={meterStyles.reqDotText}>{req.met ? '✓' : '·'}</Text>
            </View>
            <Text style={[meterStyles.reqLabel, req.met && meterStyles.reqLabelMet]}>
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  wrap:          { gap: 8, marginTop: 6 },
  barRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack:      { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 99 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 72, textAlign: 'right' },
  reqList:       { gap: 5 },
  reqRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#CBD5E1',
  },
  reqDotMet:     { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  reqDotText:    { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  reqLabel:      { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  reqLabelMet:   { color: '#16A34A', fontWeight: '600' },
});

// ─── Validation popup ─────────────────────────────────────────────────────────
function ValidationModal({ errors, visible, onClose }: {
  errors: string[]; visible: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconRow}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>⚠️</Text>
            </View>
          </View>
          <Text style={styles.modalTitle}>Please fix the following</Text>
          <View style={styles.errorList}>
            {errors.map((e, i) => (
              <View key={i} style={styles.errorItem}>
                <Text style={styles.errorBullet}>•</Text>
                <Text style={styles.errorItemText}>{e}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.modalBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalBtnText}>Fix These</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Birthdate picker ─────────────────────────────────────────────────────────
// Web: fully styled native date input — no tricks needed.
//      We inject a <style> tag to override the browser's default date input
//      appearance so it looks like our custom inputs.
// Mobile: plain numeric text input.
const DATE_PICKER_STYLE_ID = 'date-picker-style';

function BirthdatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date().toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    // Inject style tag once into document head instead of on every render
    useEffect(() => {
      if (document.getElementById(DATE_PICKER_STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = DATE_PICKER_STYLE_ID;
      style.textContent = `
        .date-picker-input {
          width: 100%;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 15px;
          color: #0F172A;
          background-color: #ffffff;
          outline: none;
          font-family: inherit;
          cursor: pointer;
          box-sizing: border-box;
          appearance: none;
          -webkit-appearance: none;
          display: block;
        }
        .date-picker-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          font-size: 18px;
          opacity: 0.6;
          margin-left: auto;
        }
        .date-picker-input:focus {
          border-color: #C9A84C;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
        }
        .date-picker-input:hover {
          border-color: #CBD5E1;
        }
      `;
      document.head.appendChild(style);
    }, []);

    return (
      <View style={styles.dateWebWrap}>
        {/* @ts-ignore */}
        <input
          className="date-picker-input"
          type="date"
          value={value}
          max={today}
          placeholder="Select your birthdate"
          onChange={(e: any) => onChange(e.target.value)}
        />
      </View>
    );
  }

  // Mobile fallback
  return (
    <TextInput
      style={styles.input} value={value} onChangeText={onChange}
      placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8"
      keyboardType="numeric" maxLength={10}
    />
  );
}

// ─── Password input with show/hide ────────────────────────────────────────────
function PasswordInput({
  value, onChange, placeholder, showStrength = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          value={value} onChangeText={onChange}
          secureTextEntry={!visible} autoCapitalize="none" autoComplete="off"
          placeholder={placeholder} placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity
          style={styles.eyeBtn} onPress={() => setVisible(v => !v)}
          activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.eyeIcon}>{visible ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      </View>
      {showStrength && <PasswordStrengthMeter password={value} />}
    </View>
  );
}

// ─── Photo uploader ───────────────────────────────────────────────────────────
function PhotoUploader({ photoUri, onPhoto }: { photoUri: string | null; onPhoto: (uri: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<any>(null);

  if (Platform.OS === 'web') {
    function getExtFromFile(file: File): string {
      const mimeMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
      return mimeMap[file.type] || 'jpg';
    }
    function handleDragOver(e: any) { e.preventDefault(); setDragging(true); }
    function handleDragLeave() { setDragging(false); }
    function handleDrop(e: any) {
      e.preventDefault(); setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const ext = getExtFromFile(file);
        const blobUrl = URL.createObjectURL(file);
        // Append extension so uploadAvatar can detect file type
        onPhoto(`${blobUrl}#.${ext}`);
      }
    }
    function handleFileChange(e: any) {
      const file = e.target?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const ext = getExtFromFile(file);
        const blobUrl = URL.createObjectURL(file);
        onPhoto(`${blobUrl}#.${ext}`);
      }
    }

    return (
      <View style={styles.photoSection}>
        {/* @ts-ignore */}
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 160, height: 200,
            border: `2px dashed ${dragging ? '#C9A84C' : '#CBD5E1'}`,
            borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
            backgroundColor: dragging ? '#FFFBEB' : '#F8FAFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
        >
          {photoUri ? (
            <img src={photoUri} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{dragging ? '📂' : '📷'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: dragging ? '#C9A84C' : '#64748B', marginBottom: 4 }}>
                {dragging ? 'Drop photo here' : 'Click or drag photo here'}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>JPG, PNG or WebP · Max 5MB</div>
            </div>
          )}
        </div>
        {/* @ts-ignore */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }} onChange={handleFileChange} />
        {photoUri && (
          <TouchableOpacity onPress={() => fileInputRef.current?.click()}>
            <Text style={styles.changePhoto}>Change photo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.85,
    });
    if (!result.canceled) onPhoto(result.assets[0].uri);
  }
  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.85 });
    if (!result.canceled) onPhoto(result.assets[0].uri);
  }

  return (
    <View style={styles.photoSection}>
      <View style={styles.mobilePhotoRow}>
        <TouchableOpacity style={styles.mobilePhotoBtn} onPress={pickPhoto} activeOpacity={0.8}>
          <Text style={styles.mobileBtnIcon}>🖼️</Text>
          <Text style={styles.mobileBtnLabel}>Library</Text>
        </TouchableOpacity>
        <View style={styles.mobilePreviewWrap}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={styles.mobilePreview} />
            : <View style={styles.photoEmpty}><Text style={styles.photoIcon}>📷</Text><Text style={styles.photoHint}>No photo{'\n'}selected</Text></View>
          }
        </View>
        <TouchableOpacity style={styles.mobilePhotoBtn} onPress={takePhoto} activeOpacity={0.8}>
          <Text style={styles.mobileBtnIcon}>📸</Text>
          <Text style={styles.mobileBtnLabel}>Camera</Text>
        </TouchableOpacity>
      </View>
      {photoUri && <TouchableOpacity onPress={pickPhoto}><Text style={styles.changePhoto}>Change photo</Text></TouchableOpacity>}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<RegistrationFormData>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  function update(key: keyof RegistrationFormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const errors = validateRegistration({ ...(form as RegistrationFormData), photoUri: photoUri || undefined });
    if (errors.length > 0) { setValidationErrors(errors); setShowErrors(true); return; }
    setLoading(true);
    try {
      await authService.register({ ...(form as RegistrationFormData), photoUri: photoUri || undefined });
      router.replace('/(member)/pending');
    } catch (err: any) {
      setValidationErrors([err.message || 'Registration failed. Please try again.']);
      setShowErrors(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ValidationModal errors={validationErrors} visible={showErrors} onClose={() => setShowErrors(false)} />
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8FAFC' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Membership Application</Text>
            <Text style={styles.subtitle}>Fill in all required fields. Your application will be reviewed by an administrator.</Text>
          </View>

          {/* Photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <PhotoUploader photoUri={photoUri} onPhoto={setPhotoUri} />
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={form.firstName || ''} onChangeText={v => update('firstName', v)} placeholder="Juan" placeholderTextColor="#94A3B8" autoCapitalize="words" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput style={styles.input} value={form.middleName || ''} onChangeText={v => update('middleName', v)} placeholder="Santos (optional)" placeholderTextColor="#94A3B8" autoCapitalize="words" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={form.lastName || ''} onChangeText={v => update('lastName', v)} placeholder="Dela Cruz" placeholderTextColor="#94A3B8" autoCapitalize="words" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Birthdate <Text style={styles.required}>*</Text></Text>
              <BirthdatePicker value={form.birthdate || ''} onChange={v => update('birthdate', v)} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={form.email || ''} onChangeText={v => update('email', v)} placeholder="juan@email.com" placeholderTextColor="#94A3B8" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={form.mobileNumber || ''} onChangeText={v => update('mobileNumber', v)} placeholder="09XXXXXXXXX" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Home Address <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.input, styles.textArea]} value={form.address || ''} onChangeText={v => update('address', v)} placeholder="Barangay, City, Province" placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
            </View>
          </View>

          {/* Account Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Security</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              {/* showStrength=true enables the bar + checklist */}
              <PasswordInput
                value={form.password || ''}
                onChange={v => update('password', v)}
                placeholder="Create a strong password"
                showStrength
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <PasswordInput
                value={form.confirmPassword || ''}
                onChange={v => update('confirmPassword', v)}
                placeholder="Repeat your password"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Application</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backText}>Already a member? <Text style={styles.backLinkText}>Sign in</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 56, gap: 24 },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F1F3D' },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#0F1F3D',
    textTransform: 'uppercase', letterSpacing: 1.2,
    borderLeftWidth: 3, borderLeftColor: '#C9A84C', paddingLeft: 10,
  },
  fieldGroup: { gap: 5 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444' },
  input: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#fff', color: '#0F172A',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  dateWebWrap: { width: '100%' },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  eyeIcon: { fontSize: 18 },
  photoSection: { alignItems: 'center', gap: 10 },
  changePhoto: { color: '#C9A84C', fontSize: 13, fontWeight: '600' },
  mobilePhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mobilePhotoBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14 },
  mobileBtnIcon: { fontSize: 26 },
  mobileBtnLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  mobilePreviewWrap: { width: 90, height: 120, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  mobilePreview: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoIcon: { fontSize: 24 },
  photoHint: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },
  submitButton: {
    backgroundColor: '#0F1F3D', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#0F1F3D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center' },
  backText: { color: '#64748B', fontSize: 14 },
  backLinkText: { color: '#C9A84C', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalIconRow: { alignItems: 'center' },
  modalIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  modalIconText: { fontSize: 28 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F1F3D', textAlign: 'center' },
  errorList: { gap: 8 },
  errorItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  errorBullet: { color: '#EF4444', fontWeight: '800', fontSize: 16, lineHeight: 20 },
  errorItemText: { color: '#374151', fontSize: 14, lineHeight: 20, flex: 1 },
  modalBtn: { backgroundColor: '#0F1F3D', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});