import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  { value: 'rented', label: 'Alugado' },
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

const ContainerEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { containers, editContainer } = useContainers();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredCollapsed);

  const [containerType, setContainerType] = useState('');
  const [containerSize, setContainerSize] = useState<'4m' | '6m' | '12m'>('6m');
  const [status, setStatus] = useState<ContainerStatus>('available');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(getStoredCollapsed());
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => setSidebarCollapsed(getStoredCollapsed()), 300);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const container = containers.find((c) => c.id === id);
    if (!container) {
      setNotFound(true);
      return;
    }
    setContainerType(container.containerType);
    setContainerSize(container.containerSize as '4m' | '6m' | '12m');
    setStatus(container.status);
    setLocationCity(container.locationCity || '');
    setLocationState(container.locationState || '');
    setNotes(container.notes || '');
  }, [id, containers]);

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
    if (!id) return;

    try {
      setSaving(true);
      setError('');
      await editContainer(id, {
        containerType,
        containerSize,
        status,
        locationCity: locationCity || undefined,
        locationState: locationState || undefined,
        notes: notes || undefined,
      });
      navigate('/admin/containers');
    } catch (err) {
      console.error('Erro ao atualizar container:', err);
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
        <div className="w-full max-w-none px-6 xl:px-8 py-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/containers')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Container</h1>
          </div>

          {notFound ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 max-w-2xl">
              Container não encontrado.
            </div>
          ) : (
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
                    ) : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContainerEdit;
