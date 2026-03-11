import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Key, ChevronDown } from 'lucide-react';
import { OperationToggle } from './OperationToggle';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user, sendPasswordResetEmail } = useAuth();
  const { profile } = useProfile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.display_name || user?.name || 'Usuário';
  const firstName = displayName.split(' ')[0];
  const avatarUrl = profile?.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=0D8ABC&color=fff&size=64`;

  const handlePasswordReset = async () => {
    if (!user?.email || resetSending) return;
    setResetSending(true);
    await sendPasswordResetEmail(user.email);
    setResetSending(false);
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/admin/profile');
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-30 h-16 bg-alencar-dark border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-full px-6">
        <div />

        <div className="flex items-center gap-4">
          <OperationToggle />

          {user && (
            <div ref={dropdownRef} className="relative pl-4 border-l border-white/10">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
              >
                <img
                  src={avatarUrl}
                  alt={firstName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                />
                <span className="hidden sm:block text-sm font-medium text-white truncate max-w-[120px]">
                  {firstName}
                </span>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-up">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon size={15} className="text-gray-400" />
                    Perfil
                  </button>

                  <button
                    onClick={handlePasswordReset}
                    disabled={resetSending}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Key size={15} className="text-gray-400" />
                    {resetSending ? 'Enviando...' : 'Alterar senha'}
                  </button>

                  <div className="border-t border-gray-100 mt-1" />

                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
