// src/services/storage.service.ts
import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Upload a member avatar from a local file URI.
   * Returns the storage path (not a signed URL).
   */
  async uploadAvatar(userId: string, localUri: string): Promise<string> {
    // Support blob URLs with fragment extension: blob:...#.jpg
    const hashExt = localUri.includes('#.') ? localUri.split('#.').pop()?.toLowerCase() : null;
    const ext = hashExt || localUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowed.includes(ext)) {
      throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
    }
    // Strip fragment before fetching
    const fetchUri = localUri.split('#')[0];

    const filePath = `public/${userId}/avatar.${ext}`;

    const response = await fetch(fetchUri);
    const blob = await response.blob();

    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Photo must be under 5 MB.');
    }

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        upsert: true,
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      });

    if (error) throw error;
    return filePath;
  },

  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string | null> {
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, expiresInSeconds);
    return data?.signedUrl ?? null;
  },

  async deleteAvatar(filePath: string): Promise<void> {
    const { error } = await supabase.storage.from('avatars').remove([filePath]);
    if (error) throw error;
  },
};
