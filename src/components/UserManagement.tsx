import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Users, Eye, EyeOff, CheckCircle, XCircle,
  Trash2, Mail, RotateCcw, AlertTriangle, Shield,
  User as UserIcon, Clock, Copy, Wand2, Key, Pencil, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { formatDate } from '../utils/formatters';

type UserRole = 'admin' | 'manager' | 'viewer';

const PRIMARY_ADMIN_EMAIL = 'comercial@alencaremp.com.br';

const ROLE_CONFIG: Record<UserRole, { label: string; badgeClass: string }> = {
  admin: { label: 'Administrador', badgeClass: 'bg-emerald-100 text-emerald-800' },
  manager: { label: 'Gerente', badgeClass: 'bg-amber-100 text-amber-800' },
  viewer: { label: 'Visualizador', badgeClass: 'bg-slate-100 text-slate-700' },
};

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

export const UserManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [openActionsDropdown, setOpenActionsDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { createUser, getAllUsers, deleteUser, updateUserRole, sendPasswordResetEmail, resetUserPassword } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenActionsDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao carregar usuarios' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao carregar usuarios' });
    } finally {
      setIsLoadingUsers(false);
    }
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
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleGenerateAdminPassword = () => {
    const pwd = generateRandomPassword(12);
    setNewAdminPassword(pwd);
    setShowNewAdminPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createUser(email, password, name, role);

      if (result.success) {
        setMessage({ type: 'success', text: 'Usuario criado com sucesso!' });
        setEmail('');
        setPassword('');
        setName('');
        setRole('viewer');
        setShowCreateForm(false);
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao criar usuario' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao criar usuario. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Usuario desativado com sucesso!' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao desativar usuario' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao desativar usuario' });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRoleId(userId);
    setMessage(null);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setMessage({ type: 'success', text: 'Funcao atualizada com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar funcao' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar funcao' });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleSendPasswordReset = async (userEmail: string) => {
    setIsLoading(true);
    try {
      const result = await sendPasswordResetEmail(userEmail);
      if (result.success) {
        setMessage({ type: 'success', text: 'Email de redefinicao enviado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao enviar email' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao enviar email de redefinicao' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPasswordReset = async (userId: string) => {
    if (!newAdminPassword || newAdminPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no minimo 6 caracteres' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetUserPassword(userId, newAdminPassword);
      if (result.success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setResetPasswordUserId(null);
        setNewAdminPassword('');
        setShowNewAdminPassword(false);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao alterar senha' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao alterar senha' });
    } finally {
      setIsLoading(false);
    }
  };

  const isPrimaryAdmin = (userEmail: string) => userEmail === PRIMARY_ADMIN_EMAIL;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="text-alencar-green" size={24} />
          <h2 className="text-xl font-semibold text-alencar-dark">Gerenciar Usuarios</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Novo Usuario
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <div className="border rounded-lg p-6 mb-6 bg-gray-50">
          <h3 className="text-lg font-medium text-alencar-dark mb-4">Criar Novo Usuario</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-20"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {password && (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(password, 'create-password')}
                        className="p-1 text-gray-400 hover:text-alencar-green transition-colors"
                        title="Copiar senha"
                      >
                        {copiedField === 'create-password' ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-md hover:bg-teal-100 transition-colors border border-teal-200"
                  >
                    <Wand2 size={13} />
                    Gerar senha automatica
                  </button>
                  <span className="text-xs text-gray-500">Minimo 6 caracteres</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcao
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="input-base"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Criar Usuario
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setMessage(null);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setRole('viewer');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-alencar-dark flex items-center gap-2">
              <Users size={20} />
              Usuarios Cadastrados ({users.length})
            </h3>
            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              className="flex items-center gap-2 text-alencar-green hover:text-alencar-hover transition-colors disabled:opacity-50"
            >
              <RotateCcw size={16} className={isLoadingUsers ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-alencar-green mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhum usuario encontrado</p>
            <p className="text-sm text-gray-400">Crie o primeiro usuario usando o botao acima</p>
          </div>
        ) : (
          <div ref={dropdownRef}>
            <table className="table-auto w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Funcao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden xl:table-cell">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <React.Fragment key={u.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-alencar-green rounded-full flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                            <div className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={u.email}>{u.email}</div>
                      </td>
                      <td className="px-4 py-4 w-36">
                        {isPrimaryAdmin(u.email) ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_CONFIG.admin.badgeClass}`}>
                            <Shield size={12} />
                            {ROLE_CONFIG.admin.label}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            disabled={updatingRoleId === u.id}
                            className={`text-xs font-medium rounded-lg border px-2.5 py-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait w-full ${ROLE_CONFIG[u.role]?.badgeClass || ROLE_CONFIG.viewer.badgeClass} border-transparent hover:border-gray-300 focus:border-alencar-green focus:ring-1 focus:ring-alencar-green focus:outline-none`}
                          >
                            <option value="admin">Administrador</option>
                            <option value="manager">Gerente</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-4 w-32 hidden xl:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock size={13} />
                          {u.createdAt ? formatDate(u.createdAt) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 w-28 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-xs"
                            title="Editar usuario"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionsDropdown(openActionsDropdown === u.id ? null : u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs"
                            >
                              <ChevronDown size={13} />
                            </button>
                            {openActionsDropdown === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                <button
                                  onClick={() => { handleSendPasswordReset(u.email); setOpenActionsDropdown(null); }}
                                  disabled={isLoading}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                >
                                  <Mail size={13} />
                                  Enviar Reset Senha
                                </button>
                                {!isPrimaryAdmin(u.email) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setResetPasswordUserId(resetPasswordUserId === u.id ? null : u.id);
                                        setNewAdminPassword('');
                                        setShowNewAdminPassword(false);
                                        setOpenActionsDropdown(null);
                                      }}
                                      disabled={isLoading}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                                    >
                                      <Key size={13} />
                                      Definir Senha
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                      onClick={() => { setShowDeleteConfirm(u.id); setOpenActionsDropdown(null); }}
                                      disabled={isLoading}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 size={13} />
                                      Desativar
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {resetPasswordUserId === u.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 bg-amber-50 border-b border-amber-100">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div className="flex-1 min-w-[200px] max-w-sm">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Nova senha para {u.name}
                              </label>
                              <div className="relative">
                                <input
                                  type={showNewAdminPassword ? 'text' : 'password'}
                                  value={newAdminPassword}
                                  onChange={(e) => setNewAdminPassword(e.target.value)}
                                  className="input-base pr-20 text-sm"
                                  placeholder="Nova senha..."
                                  minLength={6}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                  {newAdminPassword && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(newAdminPassword, `reset-${u.id}`)}
                                      className="p-1 text-gray-400 hover:text-alencar-green transition-colors"
                                      title="Copiar senha"
                                    >
                                      {copiedField === `reset-${u.id}` ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                  >
                                    {showNewAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleGenerateAdminPassword}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                            >
                              <Wand2 size={13} />
                              Gerar senha automatica
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminPasswordReset(u.id)}
                              disabled={isLoading || !newAdminPassword}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-alencar-green text-white rounded-lg hover:bg-alencar-hover transition-colors disabled:opacity-50"
                            >
                              {isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <Key size={13} />
                              )}
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetPasswordUserId(null);
                                setNewAdminPassword('');
                                setShowNewAdminPassword(false);
                              }}
                              className="px-4 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Desativacao</h3>
                <p className="text-sm text-gray-500">O usuario sera desativado</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Tem certeza que deseja desativar este usuario? O usuario nao podera mais acessar o sistema, mas seus dados serao mantidos.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Desativando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Desativar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
