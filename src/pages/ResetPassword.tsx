import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validatePassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { strength: string; color: string; percentage: number } => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 2) return { strength: 'Muito fraca', color: 'bg-red-500', percentage: 20 };
    if (score < 3) return { strength: 'Fraca', color: 'bg-orange-500', percentage: 40 };
    if (score < 4) return { strength: 'Razoável', color: 'bg-yellow-500', percentage: 60 };
    if (score < 5) return { strength: 'Forte', color: 'bg-blue-500', percentage: 80 };
    return { strength: 'Muito forte', color: 'bg-green-500', percentage: 100 };
  };

  const passwordStrength = getPasswordStrength(password);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-alencar-gradient flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-card shadow-modal p-8 w-full max-w-md text-center animate-fade-up">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Senha Redefinida!</h1>
          <p className="text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-alencar-green hover:text-alencar-hover font-medium transition-colors"
          >
            Ir para Login agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alencar-gradient flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-card shadow-modal p-8 w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo variant="vertical" darkBackground={false} className="h-28" />
          </div>
          <h1 className="section-title mb-2">Redefinir Senha</h1>
          <p className="text-gray-600">Escolha uma nova senha segura para sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pr-12"
                placeholder="Digite sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Força da senha:</span>
                  <span className={`font-medium ${
                    passwordStrength.strength === 'Muito forte' ? 'text-green-600' :
                    passwordStrength.strength === 'Forte' ? 'text-blue-600' :
                    passwordStrength.strength === 'Razoável' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{width: `${passwordStrength.percentage}%`}}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-base pr-12"
                placeholder="Confirme sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {confirmPassword && (
              <div className={`mt-2 text-xs flex items-center gap-2 ${
                password === confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}>
                {password === confirmPassword ? (
                  <>
                    <CheckCircle size={14} />
                    Senhas coincidem
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    Senhas não coincidem
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-blue-800 font-medium text-sm mb-2 flex items-center gap-2">
              <Lock size={16} />
              Dicas para uma senha segura:
            </h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>Pelo menos 6 caracteres (recomendado: 8+)</li>
              <li>Combine letras maiúsculas e minúsculas</li>
              <li>Inclua números e símbolos</li>
              <li>Evite informações pessoais</li>
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
            disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            className="w-full btn-primary-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Redefinindo...
              </>
            ) : (
              <>
                <Lock size={20} />
                Redefinir Senha
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-alencar-green font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};
