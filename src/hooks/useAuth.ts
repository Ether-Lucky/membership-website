import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { Profile } from '../types/member.types';

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const data = await authService.getCurrentProfile();

      setProfile(data);
      setError(null);
    } catch (err: any) {
      setProfile(null);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    loadProfile();

    const { data: { subscription } } =
      authService.onAuthStateChange(() => {
        if (mounted) loadProfile();
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      return await authService.login(email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    isAdmin: profile?.role === 'admin',
    isApproved: profile?.status === 'approved',
    isPending: profile?.status === 'pending',
    isRejected: profile?.status === 'rejected',
    login,
    logout,
  };
}