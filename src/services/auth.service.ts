// src/services/auth.service.ts
import { supabase } from '../lib/supabase';
import { memberRepository } from '../repositories/member.repository';
import { storageService } from './storage.service';
import { validateRegistration } from '../utils/validation';
import type { Profile, RegistrationFormData } from '../types/member.types';

export const authService = {
  /**
   * Full registration flow:
   * 1. Validate input
   * 2. Upload photo (if provided)
   * 3. Create Supabase auth user → triggers profile creation
   * 4. Create member record
   */
  async register(formData: RegistrationFormData): Promise<void> {
    const errors = validateRegistration(formData);
    if (errors.length > 0) throw new Error(errors[0]);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed — no user returned');

    // Step 2: Upload photo (optional)
    let photoUrl: string | undefined;
    if (formData.photoUri) {
      photoUrl = await storageService.uploadAvatar(
        authData.user.id,
        formData.photoUri
      );
    }

    // Step 3: Get the auto-created profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Step 4: Create member record
    await memberRepository.create(profile.id, formData, photoUrl);
  },

  /**
   * Login and return the user's role + status for routing
   */
  async login(email: string, password: string): Promise<{ role: string; status: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    const profile = await authService.getCurrentProfile();
    if (!profile) throw new Error('Profile not found');

    return { role: profile.role, status: profile.status };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) return null;
    return data as Profile;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
