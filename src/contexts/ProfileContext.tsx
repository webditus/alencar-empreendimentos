import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { UserProfile, ProfileUpdatePayload } from '../types/profile';
import { ensureProfile, updateProfile, uploadAvatar, removeAvatar } from '../services/profileService';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateUserProfile: (payload: ProfileUpdatePayload) => Promise<{ success: boolean; error?: string }>;
  uploadUserAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  removeUserAvatar: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const p = await ensureProfile(user.id, user.name || 'Usuário');
      setProfile(p);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateUserProfile = async (payload: ProfileUpdatePayload): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const updated = await updateProfile(user.id, payload);
      setProfile(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar perfil' };
    }
  };

  const uploadUserAvatar = async (file: File): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const avatarUrl = await uploadAvatar(user.id, file);
      const updated = await updateProfile(user.id, { avatar_url: avatarUrl });
      setProfile(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao enviar avatar' };
    }
  };

  const removeUserAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      await removeAvatar(user.id);
      const updated = await updateProfile(user.id, { avatar_url: null });
      setProfile(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao remover avatar' };
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      isLoading,
      error,
      updateUserProfile,
      uploadUserAvatar,
      removeUserAvatar,
      refreshProfile: loadProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};
