// src/services/member.service.ts
import { memberRepository } from '../repositories/member.repository';
import { supabase } from '../lib/supabase';
import type { DigitalIDCard, Member } from '../types/member.types';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://yourapp.com';
const ORG_NAME = process.env.EXPO_PUBLIC_ORG_NAME ?? 'Your Organization';

export const memberService = {
  async getOwnProfile(profileId: string): Promise<Member | null> {
    return memberRepository.getByProfileId(profileId);
  },

  async buildDigitalIDCard(member: Member): Promise<DigitalIDCard> {
    if (!member.membership_number || !member.member_since) {
      throw new Error('Member is not yet approved.');
    }

    let photoUrl: string | null = null;
    if (member.photo_url) {
      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(member.photo_url, 3600);
      photoUrl = data?.signedUrl ?? null;
    }

    const fullName = [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(' ');

    return {
      membershipNumber: member.membership_number,
      fullName,
      photoUrl,
      memberSince: new Date(member.member_since).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      status: 'Active',
      qrCodeData: `${APP_URL}/verify/${member.membership_number}`,
      organizationName: ORG_NAME,
    };
  },
};
