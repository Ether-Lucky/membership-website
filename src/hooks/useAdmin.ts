// src/hooks/useAdmin.ts
import { useState, useCallback } from 'react';
import { adminService } from '../services/admin.service';
import type { MemberWithProfile } from '../types/member.types';

export function useAdminPending() {
  const [applications, setApplications] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingApplications();
      setApplications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { applications, loading, load };
}
