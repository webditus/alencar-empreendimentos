import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Camera, Trash2, UploadCloud, AlertCircle,
  CheckCircle, User as UserIcon, Phone, Mail, Shield, Eye, EyeOff,
  Key, Wand2, Copy,
} from 'lucide-react';
import { useAuth, type AdminUserDetail } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { validateImageFile, convertAvatarToWebP, generateWebPFilename } from '../utils/imageUtils';
import { applyPhoneMask } from '../utils/maskUtils';
import { supabase } from '../lib/supabase';
import { SIDEBAR_STORAGE_KEY, type TabId } from '../config/sidebarNav';

type UserRole = 'admin' | 'manager' | 'viewer';

const PRIMARY_ADMIN_EMAIL = 'comercial@alencaremp.com.br';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'viewer', label: 'Visualizador' },
];

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export const AdminUserEdit: React.FC = () => {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout, getUserById, adminUpdateUser } = useAuth();

  const [userData, setUserData] = useState<AdminUserDetail | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPrimary = userData?.email === PRIMARY_ADMIN_EMAIL;

  useEffect(() => {
    if (!userId) return;
    loadUser();
  }, [userId]);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(getStoredCollapsed());
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => setSidebarCollapsed(getStoredCollapsed()), 300);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const loadUser = async () => {
    if (!userId) return;
    setIsLoadingUser(true);
    setLoadError(null);

    const result = await getUserById(userId);
    if (result.success && result.user) {
      setUserData(result.user);
      setDisplayName(result.user.display_name || result.user.name || '');
      setEmail(result.user.email);
      setPhone(result.user.phone || '');
      setRole(result.user.role);
      setAvatarUrl(result.user.avatar_url);
    } else {
      setLoadError(result.error || 'Usuario nao encontrado');
    }
    setIsLoadingUser(false);
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCopyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* noop */
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generateRandomPassword(12);
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowNewPassword(true);
  };

  const handleAvatarFile = useCallback(async (file: File) => {
    if (!userId) return;
    setAvatarError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setAvatarError(validationError.message);
      return;
    }

    setIsUploadingAvatar(true);
    try {
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

      if (error) {
        setAvatarError('Erro ao enviar avatar: ' + error.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      setAvatarUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      setAvatarError(err.message || 'Erro ao enviar avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [userId]);

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    setIsUploadingAvatar(true);
    try {
      const { data: existing } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existing && existing.length > 0) {
        const filesToRemove = existing.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('avatars').remove(filesToRemove);
      }
      setAvatarUrl(null);
    } catch {
      setAvatarError('Erro ao remover avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'O nome e obrigatorio.' });
      clearMessage();
      return;
    }

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'O email e obrigatorio.' });
      clearMessage();
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no minimo 6 caracteres.' });
      clearMessage();
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      clearMessage();
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload: any = {
      userId,
      name: displayName.trim(),
      email: email.trim(),
      phone: phone.trim() || '',
      role,
      avatar_url: avatarUrl,
    };

    if (newPassword) {
      payload.password = newPassword;
    }

    const result = await adminUpdateUser(payload);

    if (result.success) {
      setMessage({ type: 'success', text: 'Usuario atualizado com sucesso!' });
      if (result.user) {
        setUserData(result.user);
      }
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar usuario' });
    }

    setIsSaving(false);
    clearMessage();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (_tab: TabId) => {
    navigate('/admin');
  };

  const sidebarWidth = sidebarCollapsed ? 72 : 260;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'U')}&background=0D8ABC&color=fff&size=128`;

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-alencar-dark flex">
        <Sidebar activeTab="users" onTabChange={handleTabChange} />
        <Header onLogout={handleLogout} />
        <main
          className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-alencar-green mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Carregando usuario...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !userData) {
    return (
      <div className="min-h-screen bg-alencar-dark flex">
        <Sidebar activeTab="users" onTabChange={handleTabChange} />
        <Header onLogout={handleLogout} />
        <main
          className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 text-gray-600 hover:text-alencar-green transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Voltar para usuarios</span>
            </button>
            <div className="bg-white rounded-xl shadow-card p-8 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Usuario nao encontrado</h2>
              <p className="text-gray-500">{loadError || 'O usuario solicitado nao existe.'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alencar-dark flex">
      <Sidebar activeTab="users" onTabChange={handleTabChange} />
      <Header onLogout={handleLogout} />

      <main
        className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-alencar-green transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar para usuarios</span>
          </button>

          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="bg-gradient-to-r from-alencar-dark to-alencar-green px-6 py-8 sm:px-8">
                <h1 className="text-xl font-semibold text-white">Editar Usuario</h1>
                <p className="text-white/60 text-sm mt-1">{userData.email}</p>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-8">
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
                        JPG, PNG ou WEBP (max. 10MB). Sera redimensionada para 256x256.
                      </p>
                      {avatarError && (
                        <div className="flex items-center gap-1.5 text-red-500 text-xs">
                          <AlertCircle size={12} />
                          {avatarError}
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

                <div className="space-y-5">
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
                      <Mail size={14} />
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`input-base ${isPrimary ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      disabled={isPrimary}
                      required
                    />
                    {isPrimary && (
                      <p className="text-xs text-gray-400 mt-1">O email do administrador principal nao pode ser alterado.</p>
                    )}
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
                      <Shield size={14} />
                      Funcao
                    </label>
                    {isPrimary ? (
                      <div>
                        <input
                          type="text"
                          value="Administrador"
                          className="input-base bg-gray-50 text-gray-500 cursor-not-allowed"
                          disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">A funcao do administrador principal nao pode ser alterada.</p>
                      </div>
                    ) : (
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="input-base"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isPrimary && (
              <div className="bg-white rounded-xl shadow-card overflow-hidden mt-6">
                <div className="px-6 py-5 sm:px-8 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-alencar-dark flex items-center gap-2">
                    <Key size={18} />
                    Redefinir Senha
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Defina uma nova senha para este usuario</p>
                </div>

                <div className="px-6 py-6 sm:px-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                    <div className="relative max-w-sm">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-base pr-20"
                        placeholder="Deixe em branco para nao alterar"
                        minLength={6}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {newPassword && (
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(newPassword, 'edit-password')}
                            className="p-1 text-gray-400 hover:text-alencar-green transition-colors"
                            title="Copiar senha"
                          >
                            {copiedField === 'edit-password' ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-base"
                      placeholder="Repita a nova senha"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimo 6 caracteres</p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                    >
                      <Wand2 size={13} />
                      Gerar senha automatica
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
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
      </main>
    </div>
  );
};
