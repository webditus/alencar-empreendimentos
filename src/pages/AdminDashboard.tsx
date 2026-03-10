import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
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

    const observer = new MutationObserver(() => {
      setSidebarCollapsed(getStoredCollapsed());
    });

    window.addEventListener('storage', onStorage);

    const interval = setInterval(() => {
      setSidebarCollapsed(getStoredCollapsed());
    }, 300);

    return () => {
      window.removeEventListener('storage', onStorage);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-alencar-bg flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main
        className="flex-1 transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'quotes' && <QuoteManagement />}
          {activeTab === 'kanban' && <KanbanBoard />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'contracts' && <ContractManagementRefactor />}
        </div>
      </main>
    </div>
  );
};
