import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Camera, Trash2, UploadCloud, AlertCircle,
  CheckCircle, User as UserIcon, Phone, Mail, Shield, Eye, EyeOff, Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { validateImageFile } from '../utils/imageUtils';
import { applyPhoneMask } from '../utils/maskUtils';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { SIDEBAR_STORAGE_KEY, type TabId } from '../config/sidebarNav';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador',
};

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, isLoading: profileLoading, updateUserProfile, uploadUserAvatar, removeUserAvatar } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(getStoredCollapsed());
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => setSidebarCollapsed(getStoredCollapsed()), 300);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'O nome e obrigatorio.' });
      clearMessage();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const result = await updateUserProfile({
      display_name: displayName.trim(),
      phone: phone.trim() || null,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil.' });
    }
    setIsSaving(false);
    clearMessage();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter no minimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setPasswordMessage({ type: 'error', text: 'Senha atual incorreta.' });
        setIsChangingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
      } else {
        setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarFile = useCallback(async (file: File) => {
    setLocalError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setLocalError(validationError.message);
      return;
    }

    setIsUploadingAvatar(true);
    const result = await uploadUserAvatar(file);
    if (!result.success) {
      setLocalError(result.error || 'Erro ao enviar avatar.');
    }
    setIsUploadingAvatar(false);
  }, [uploadUserAvatar]);

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    const result = await removeUserAvatar();
    if (!result.success) {
      setLocalError(result.error || 'Erro ao remover avatar.');
    }
    setIsUploadingAvatar(false);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarFile(file);
  }, [handleAvatarFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarFile(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab: TabId) => {
    navigate('/admin');
  };

  const avatarUrl = profile?.avatar_url || null;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user?.name || 'U')}&background=0D8ABC&color=fff&size=128`;
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-alencar-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-alencar-green mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alencar-dark flex">
      <Sidebar activeTab="dashboard" onTabChange={handleTabChange} />
      <Header onLogout={handleLogout} />

      <main
        className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-alencar-green transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar ao painel</span>
          </button>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-alencar-dark to-alencar-green px-6 py-8 sm:px-8">
              <h1 className="text-xl font-semibold text-white">Meu Perfil</h1>
              <p className="text-white/60 text-sm mt-1">Gerencie suas informacoes pessoais</p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-8">
              {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Foto do perfil</label>
                <div className="flex items-start gap-6">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative w-24 h-24 rounded-full overflow-hidden cursor-pointer flex-shrink-0
                      border-2 border-dashed transition-all duration-200
                      ${isDragOver ? 'border-alencar-green bg-green-50 scale-105' : 'border-gray-300 hover:border-alencar-green-light'}
                      ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}
                    `}
                  >
                    {isUploadingAvatar ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="w-6 h-6 border-2 border-alencar-green border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img src={fallbackAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                      <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <UploadCloud size={14} />
                        Enviar foto
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Arraste uma imagem ou clique para enviar. JPG, PNG ou WEBP (max. 10MB). Sera redimensionada para 256x256.
                    </p>
                    {localError && (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs">
                        <AlertCircle size={12} />
                        {localError}
                      </div>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <UserIcon size={14} />
                    Nome de exibicao
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-base"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={14} />
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Mail size={14} />
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-base bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">O e-mail nao pode ser alterado.</p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Shield size={14} />
                    Funcao
                  </label>
                  <input
                    type="text"
                    value={ROLE_LABELS[user?.role || 'viewer'] || user?.role || ''}
                    className="input-base bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Salvar alteracoes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden mt-6">
            <div className="px-6 py-5 sm:px-8 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-alencar-dark flex items-center gap-2">
                <Lock size={18} />
                Alterar Senha
              </h2>
              <p className="text-sm text-gray-500 mt-1">Mantenha sua conta segura atualizando sua senha</p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {passwordMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm mb-4 ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha atual</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-base pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-base pr-10"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimo 6 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-base"
                    minLength={6}
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Alterar senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
