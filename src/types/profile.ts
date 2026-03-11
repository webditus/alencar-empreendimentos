export interface UserProfile {
  id: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdatePayload {
  display_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
}
