// src/hooks/useMember.ts
import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/member.service';
import type { Member, DigitalIDCard } from '../types/member.types';

interface MemberState {
  member: Member | null;
  cardData: DigitalIDCard | null;
  loading: boolean;
  error: string | null;
}

export function useMember(profileId: string | undefined) {
  const [state, setState] = useState<MemberState>({
    member: null,
    cardData: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!profileId) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const member = await memberService.getOwnProfile(profileId);
      let cardData: DigitalIDCard | null = null;
      if (member?.membership_number) {
        cardData = await memberService.buildDigitalIDCard(member);
      }
      setState({ member, cardData, loading: false, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
