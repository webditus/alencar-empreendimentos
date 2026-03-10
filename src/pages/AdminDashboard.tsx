import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  FileText,
  Package,
  Kanban,
  Users,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OperationToggle } from '../components/OperationToggle';
import { CategoryManagement } from '../components/CategoryManagement';
import { KanbanBoard } from '../components/KanbanBoard';
import { UserManagement } from '../components/UserManagement';
import { QuoteManagement } from '../components/QuoteManagement';
import ContractManagementRefactor from '../components/ContractManagementRefactor';
import { Logo } from '../components/Logo';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'quotes' | 'kanban' | 'categories' | 'users' | 'contracts'>('quotes');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'quotes' as const, label: 'Orçamentos', icon: FileText },
    { id: 'kanban' as const, label: 'Kanban', icon: Kanban },
    { id: 'categories' as const, label: 'Categorias', icon: Package },
    { id: 'users' as const, label: 'Usuários', icon: Users },
    { id: 'contracts' as const, label: 'Contratos', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-alencar-bg">
      <header className="header-glass">
        <div className="page-container !py-0">
          <div className="flex justify-between items-center py-4">
            <Logo variant="horizontal" darkBackground={true} className="h-9" />

            <div className="flex items-center space-x-4">
              <OperationToggle />
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <LogOut className="mr-2" size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-alencar-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="page-container !py-0">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-alencar-green-light text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  <Icon className="mr-2" size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="page-container">
        {activeTab === 'quotes' && <QuoteManagement />}
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'contracts' && <ContractManagementRefactor />}
      </main>
    </div>
  );
};
