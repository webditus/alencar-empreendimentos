import { supabase } from '../lib/supabase';
import type { UserProfile, ProfileUpdatePayload } from '../types/profile';
import { convertAvatarToWebP, generateWebPFilename } from '../utils/imageUtils';

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureProfile(userId: string, fallbackName: string): Promise<UserProfile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ id: userId, display_name: fallbackName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, payload: ProfileUpdatePayload): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const webpBlob = await convertAvatarToWebP(file, 256);
  const filename = generateWebPFilename('avatar');
  const path = `${userId}/${filename}`;

  const { data: existing } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (existing && existing.length > 0) {
    const filesToRemove = existing.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filesToRemove);
  }

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, webpBlob, { contentType: 'image/webp', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  const { data: existing } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (existing && existing.length > 0) {
    const filesToRemove = existing.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filesToRemove);
  }
}
