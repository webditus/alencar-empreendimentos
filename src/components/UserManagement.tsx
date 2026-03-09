import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Eye, EyeOff, CheckCircle, XCircle, Trash2, Mail, RotateCcw, AlertTriangle, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

export const UserManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { createUser, getAllUsers, deleteUser, sendPasswordResetEmail } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao carregar usuários' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createUser(email, password, name, role);

      if (result.success) {
        setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });
        setEmail('');
        setPassword('');
        setName('');
        setRole('user');
        setShowCreateForm(false);
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao criar usuário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao criar usuário. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Usuário excluído com sucesso!' });
        loadUsers();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao excluir usuário' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir usuário' });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        setMessage({ type: 'success', text: 'Email de redefinição enviado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao enviar email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar email de redefinição' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="text-alencar-green" size={24} />
          <h2 className="text-xl font-semibold text-alencar-dark">Gerenciar Usuários</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <div className="border rounded-lg p-6 mb-6 bg-gray-50">
          <h3 className="text-lg font-medium text-alencar-dark mb-4">Criar Novo Usuário</h3>

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
                    className="input-base pr-10"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                  className="input-base"
                >
                  <option value="user">Usuário</option>
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
                    Criar Usuário
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
                  setRole('user');
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
              Usuários Cadastrados ({users.length})
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
            <p className="text-gray-500">Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhum usuário encontrado</p>
            <p className="text-sm text-gray-400">Crie o primeiro usuário usando o botão acima</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-alencar-green rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSendPasswordReset(user.email)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-xs"
                          title="Reenviar link de redefinição de senha"
                        >
                          <Mail size={14} />
                          Reset Senha
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-xs"
                          title="Excluir usuário"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Tem certeza que deseja excluir este usuário? Todos os dados relacionados serão perdidos permanentemente.
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
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
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
