import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { OperationToggle } from './OperationToggle';
import { useAuth } from '../contexts/AuthContext';
import {
  TabId,
  SidebarNavItem,
  SIDEBAR_STORAGE_KEY,
  sidebarNavItems,
  sidebarSections,
} from '../config/sidebarNav';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}

function getStoredCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'collapsed';
  } catch {
    return false;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(getStoredCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
      } catch { /* noop */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleCollapsed]);

  const userRole = user?.role ?? 'user';

  const visibleItems = sidebarNavItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const renderNavItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        title={collapsed ? item.label : undefined}
        className={`
          group relative flex items-center w-full rounded-lg transition-all duration-200
          ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'}
          ${isActive
            ? 'bg-alencar-green/20 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-alencar-green-light rounded-r-full" />
        )}
        <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-alencar-green-light' : ''}`} />
        {!collapsed && (
          <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
        )}
        {collapsed && (
          <span className="sidebar-tooltip">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`
        sidebar-root fixed top-0 left-0 h-screen z-40 flex flex-col overflow-x-hidden
        bg-alencar-dark border-r border-white/[0.06]
        transition-[width] duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      <div className={`flex items-center h-16 border-b border-white/[0.06] ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        {collapsed ? (
          <img
            src="/logotipo-alencar-empreendimentos-icone-favicon.webp"
            alt="Alencar"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <Logo variant="horizontal" darkBackground={true} className="h-8" />
        )}
      </div>

      <div className={`border-b border-white/[0.06] w-full overflow-hidden ${collapsed ? 'px-3 py-3 flex items-center justify-center' : 'px-4 py-3'}`}>
        <OperationToggle collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 sidebar-scrollbar">
        {sidebarSections.map((section) => {
          const sectionItems = visibleItems.filter((item) => item.section === section.key);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section.key}>
              {!collapsed && (
                <span className="block px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {section.label}
                </span>
              )}
              {collapsed && (
                <div className="mx-auto mb-2 w-6 border-t border-white/10" />
              )}
              <div className="space-y-1">
                {sectionItems.map(renderNavItem)}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={`border-t border-white/[0.06] ${collapsed ? 'px-3 py-3' : 'px-4 py-3'}`}>
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`
            group flex items-center w-full rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200
            ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'}
          `}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="ml-3 text-sm font-medium">Sair</span>}
          {collapsed && <span className="sidebar-tooltip">Sair</span>}
        </button>
      </div>

      <button
        onClick={toggleCollapsed}
        className={`
          absolute top-[72px] -right-3 z-50
          w-6 h-6 rounded-full bg-alencar-dark border border-white/10
          flex items-center justify-center
          text-gray-400 hover:text-white hover:bg-alencar-green/40
          transition-all duration-200 shadow-md
        `}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};
