import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alencar-gradient flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-card shadow-modal p-8 w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo variant="vertical" darkBackground={false} className="h-28" />
          </div>
          <h1 className="section-title mb-2">Area Administrativa</h1>
          <p className="text-gray-500 text-sm">Acesse o painel de controle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Entrando...'
            ) : (
              <>
                <LogIn size={20} />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-alencar-green hover:text-alencar-hover font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Key size={16} />
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
};
