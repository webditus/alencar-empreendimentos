import React from 'react';
import { LogOut } from 'lucide-react';
import { OperationToggle } from './OperationToggle';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogout: () => void;
  sidebarWidth: number;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, sidebarWidth }) => {
  const { user } = useAuth();

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 bg-alencar-dark border-b border-white/[0.06] transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div />

        <div className="flex items-center gap-4">
          <OperationToggle />

          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-medium text-white truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                title="Sair"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          <button
            onClick={onLogout}
            title="Sair"
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
