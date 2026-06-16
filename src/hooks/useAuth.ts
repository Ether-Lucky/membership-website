// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { Profile } from '../types/member.types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    profile: null,
    loading: true,
    error: null,
  });

  // Load profile on mount and on auth state changes
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const profile = await authService.getCurrentProfile();
        if (mounted) setState({ profile, loading: false, error: null });
      } catch {
        if (mounted) setState({ profile: null, loading: false, error: null });
      }
    };

    loadProfile();

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') loadProfile();
        if (event === 'SIGNED_OUT') {
          if (mounted) setState({ profile: null, loading: false, error: null });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      return await authService.login(email, password);
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
      throw err;
    } finally {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    isAdmin: state.profile?.role === 'admin',
    isApproved: state.profile?.status === 'approved',
    isPending: state.profile?.status === 'pending',
    isRejected: state.profile?.status === 'rejected',
    login,
    logout,
  };
}
