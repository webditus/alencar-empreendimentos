import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

type UserRole = 'admin' | 'manager' | 'viewer';

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  display_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  createdAt: string;
}

interface AdminUpdatePayload {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatar_url?: string | null;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  createUser: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<{ success: boolean; users?: User[]; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getUserById: (userId: string) => Promise<{ success: boolean; user?: AdminUserDetail; error?: string }>;
  adminUpdateUser: (payload: AdminUpdatePayload) => Promise<{ success: boolean; user?: AdminUserDetail; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  };
}

const ADMIN_USERS_URL = '/api/admin-users';

function mapAdminUserDetail(u: any): AdminUserDetail {
  return {
    id: u.id,
    email: u.email || '',
    name: u.name || 'Usuario',
    display_name: u.display_name || u.name || 'Usuario',
    role: (u.role as UserRole) || 'viewer',
    phone: u.phone || null,
    avatar_url: u.avatar_url || null,
    createdAt: u.createdAt || '',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapSessionUser = (supabaseUser: any): User | null => {
    if (!supabaseUser || !supabaseUser.email) return null;

    const role = supabaseUser.app_metadata?.role
      || supabaseUser.user_metadata?.role
      || 'viewer';

    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || 'Usuario',
      email: supabaseUser.email,
      role: role as UserRole,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(mapSessionUser(data.user));
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao fazer login' };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const createUser = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'viewer'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao criar usuario' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const getAllUsers = async (): Promise<{ success: boolean; users?: User[]; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, { method: 'GET', headers });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao buscar usuarios' };
      }

      const users: User[] = data.users.map((u: any) => ({
        id: u.id,
        name: u.name || 'Usuario',
        email: u.email || '',
        role: (u.role as UserRole) || 'viewer',
        createdAt: u.createdAt,
      }));

      return { success: true, users };
    } catch {
      return { success: false, error: 'Erro ao buscar usuarios' };
    }
  };

  const getUserById = async (userId: string): Promise<{ success: boolean; user?: AdminUserDetail; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${ADMIN_USERS_URL}?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao buscar usuario' };
      }

      return { success: true, user: mapAdminUserDetail(data.user) };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const adminUpdateUser = async (payload: AdminUpdatePayload): Promise<{ success: boolean; user?: AdminUserDetail; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao atualizar usuario' };
      }

      return { success: true, user: mapAdminUserDetail(data.user) };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao desativar usuario' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao desativar usuario' };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao atualizar funcao' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao enviar email de redefinicao' };
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(ADMIN_USERS_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ userId, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erro ao alterar senha' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      createUser,
      getAllUsers,
      deleteUser,
      updateUserRole,
      sendPasswordResetEmail,
      resetUserPassword,
      getUserById,
      adminUpdateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
