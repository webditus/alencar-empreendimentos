import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, Trash2, UploadCloud, AlertCircle, CheckCircle, User as UserIcon, Phone, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { validateImageFile } from '../utils/imageUtils';
import { applyPhoneMask } from '../utils/maskUtils';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  viewer: 'Visualizador',
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, updateUserProfile, uploadUserAvatar, removeUserAvatar } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'O nome é obrigatório.' });
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

  const avatarUrl = profile?.avatar_url || null;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user?.name || 'U')}&background=0D8ABC&color=fff&size=128`;

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
    <div className="min-h-screen bg-alencar-bg">
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
            <p className="text-white/60 text-sm mt-1">Gerencie suas informações pessoais</p>
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
                    Arraste uma imagem ou clique para enviar. JPG, PNG ou WEBP (max. 2MB).
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
                  Nome de exibição
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
                <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado.</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                  <Shield size={14} />
                  Função
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
                      Salvar alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
