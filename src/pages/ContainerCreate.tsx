import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ContainerStatus } from '../types';
import { useContainers } from '../contexts/ContainerContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { TabId, SIDEBAR_STORAGE_KEY } from '../config/sidebarNav';

const CONTAINER_SIZES = ['4m', '6m', '12m'] as const;
const STATUSES: { value: ContainerStatus; label: string }[] = [
  { value: 'available', label: 'Disponivel' },
  { value: 'rented', label: 'Locado' },
  { value: 'in_transport', label: 'Em Transporte' },
  { value: 'maintenance', label: 'Manutencao' },
];

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

const ContainerCreate: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addContainer } = useContainers();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);

  const [containerType, setContainerType] = useState('');
  const [containerSize, setContainerSize] = useState<'4m' | '6m' | '12m'>('6m');
  const [status, setStatus] = useState<ContainerStatus>('available');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(getStoredCollapsed());
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => setSidebarCollapsed(getStoredCollapsed()), 300);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerType.trim()) {
      setError('Informe o tipo do container');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await addContainer({
        containerType,
        containerSize,
        status,
        locationCity: locationCity || undefined,
        locationState: locationState || undefined,
        notes: notes || undefined,
      });
      navigate('/admin/containers');
    } catch (err) {
      console.error('Erro ao criar container:', err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-alencar-dark flex">
      <Sidebar
        activeTab={'containers' as TabId}
        onTabChange={(tab) => navigate(`/admin?tab=${tab}`)}
      />

      <Header onLogout={handleLogout} />

      <main
        className="flex-1 min-h-screen bg-alencar-bg transition-[margin-left] duration-300 ease-in-out pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/containers')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Novo Container</h1>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo do Container</label>
                <input
                  type="text"
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  placeholder="Ex: Dry, Reefer, Open Top"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tamanho</label>
                <select
                  value={containerSize}
                  onChange={(e) => setContainerSize(e.target.value as '4m' | '6m' | '12m')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
                >
                  {CONTAINER_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContainerStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
                  <input
                    type="text"
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    maxLength={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observacoes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/admin/containers')}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : 'Criar Container'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContainerCreate;
