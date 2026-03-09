import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateEmail(email)) {
      setError('Por favor, insira um endereço de email válido');
      setIsLoading(false);
      return;
    }

    try {
      const result = await sendPasswordResetEmail(email);

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Erro ao enviar email de redefinição');
      }
    } catch (err) {
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-alencar-dark flex items-center justify-center px-4">
        <div className="bg-white rounded-card shadow-modal p-8 w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Enviamos um link de redefinição de senha para <strong>{email}</strong>.
            Verifique sua caixa de entrada e spam.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-blue-800 font-medium text-sm mb-2 flex items-center gap-2">
              <Mail size={16} />
              Próximos passos:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>1. Verifique seu email (incluindo spam)</li>
              <li>2. Clique no link recebido</li>
              <li>3. Defina sua nova senha</li>
              <li>4. Faça login com a nova senha</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary-lg flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar ao Login
            </button>

            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setError('');
              }}
              className="w-full text-alencar-green hover:text-alencar-hover font-medium py-2 transition-colors"
            >
              Enviar para outro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alencar-dark flex items-center justify-center px-4">
      <div className="bg-white rounded-card shadow-modal p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-alencar-green rounded-full flex items-center justify-center">
              <Mail className="text-white" size={24} />
            </div>
          </div>
          <h1 className="section-title mb-2">Esqueci minha Senha</h1>
          <p className="text-gray-600">
            Digite seu email para receber um link de redefinição de senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço de Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-12"
                placeholder="seu@email.com"
                required
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-amber-800 font-medium text-sm mb-2 flex items-center gap-2">
              <Building2 size={16} />
              Como funciona:
            </h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>Você receberá um email com link seguro</li>
              <li>O link expira em 1 hora por segurança</li>
              <li>Clique no link para criar nova senha</li>
              <li>Use a nova senha para fazer login</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full btn-primary-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Mail size={20} />
                Enviar Link de Redefinição
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-alencar-green font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Login
          </button>

          <div className="text-xs text-gray-500">
            Lembrou da sua senha?
            <button
              onClick={() => navigate('/login')}
              className="text-alencar-green hover:text-alencar-hover font-medium ml-1 transition-colors"
            >
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
