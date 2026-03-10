import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CategoryManagement } from '../components/CategoryManagement';
import { KanbanBoard } from '../components/KanbanBoard';
import { UserManagement } from '../components/UserManagement';
import { QuoteManagement } from '../components/QuoteManagement';
import ContractManagementRefactor from '../components/ContractManagementRefactor';
import { useAuth } from '../contexts/AuthContext';
import { TabId, SIDEBAR_STORAGE_KEY } from '../config/sidebarNav';

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('quotes');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(getStoredCollapsed());

    window.addEventListener('storage', onStorage);

    const interval = setInterval(() => {
      setSidebarCollapsed(getStoredCollapsed());
    }, 300);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-alencar-dark flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Header
        onLogout={handleLogout}
      />

      <main
        className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        {activeTab === 'kanban' ? (
          <div className="px-4 py-3">
            <KanbanBoard />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8">
            {activeTab === 'quotes' && <QuoteManagement />}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'contracts' && <ContractManagementRefactor />}
          </div>
        )}
      </main>
    </div>
  );
};
