import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CategoryManagement } from '../components/CategoryManagement';
import { KanbanBoard } from '../components/KanbanBoard';
import { UserManagement } from '../components/UserManagement';
import { QuoteManagement } from '../components/QuoteManagement';
import ContractManagementRefactor from '../components/ContractManagementRefactor';
import { CRMDashboard } from '../components/CRMDashboard';
import { ContainerInventory } from '../components/ContainerInventory';
import { DeliverySchedule } from '../components/DeliverySchedule';
import { ActivityLog } from '../components/ActivityLog';
import { useAuth } from '../contexts/AuthContext';
import { TabId, SIDEBAR_STORAGE_KEY } from '../config/sidebarNav';

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

interface AdminDashboardProps {
  initialTab?: TabId;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'dashboard' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);

  const isAdmin = user?.role === 'admin';

  const handleTabChange = (tab: TabId) => {
    if ((tab === 'users' || tab === 'activity-log') && !isAdmin) {
      return;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    if ((activeTab === 'users' || activeTab === 'activity-log') && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin]);

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
        onTabChange={handleTabChange}
      />

      <Header
        onLogout={handleLogout}
      />

      <main
        className="flex-1 min-w-0 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        {activeTab === 'kanban' ? (
          <div className="px-4 py-3">
            <KanbanBoard />
          </div>
        ) : (
          <div className="w-full max-w-none px-6 xl:px-8 py-8">
            {activeTab === 'dashboard' && <CRMDashboard />}
            {activeTab === 'quotes' && <QuoteManagement />}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'users' && isAdmin && <UserManagement />}
            {activeTab === 'contracts' && <ContractManagementRefactor />}
            {activeTab === 'containers' && <ContainerInventory />}
            {activeTab === 'deliveries' && <DeliverySchedule />}
            {activeTab === 'activity-log' && isAdmin && <ActivityLog />}
          </div>
        )}
      </main>
    </div>
  );
};
