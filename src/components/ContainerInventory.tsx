import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Pencil, Trash2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Container, ContainerStatus } from '../types';
import { useContainers } from '../contexts/ContainerContext';
import { formatDate } from '../utils/formatters';
import { ContainerFormModal } from './ContainerFormModal';

const STATUS_TABS: { label: string; value: ContainerStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Disponivel', value: 'available' },
  { label: 'Locado', value: 'rented' },
  { label: 'Em Transporte', value: 'in_transport' },
  { label: 'Manutencao', value: 'maintenance' },
];

const STATUS_BADGE: Record<ContainerStatus, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  rented: 'bg-blue-100 text-blue-700',
  in_transport: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<ContainerStatus, string> = {
  available: 'Disponivel',
  rented: 'Locado',
  in_transport: 'Em Transporte',
  maintenance: 'Manutencao',
};

export const ContainerInventory: React.FC = () => {
  const navigate = useNavigate();
  const { containers, loading, error, refreshContainers, removeContainer, editContainer } = useContainers();
  const [filter, setFilter] = useState<ContainerStatus | 'all'>('all');
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const filtered = filter === 'all' ? containers : containers.filter((c) => c.status === filter);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await removeContainer(id);
    } catch {
      // error handled by context
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContainerStatus) => {
    try {
      await editContainer(id, { status: newStatus });
    } catch {
      // error handled by context
    }
    setStatusDropdown(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-alencar-green animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Containers</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshContainers}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin/containers/new')}
            className="btn-primary px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Adicionar Container
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum container encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione containers ao inventario para comecar.</p>
          <button
            onClick={() => navigate('/admin/containers/new')}
            className="btn-primary px-4 py-2 rounded-lg text-sm mt-4 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Container
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamanho</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Localizacao</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dt. Entrega</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dt. Retorno</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((container) => (
                  <tr key={container.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{container.containerType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{container.containerSize}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === container.id ? null : container.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[container.status]} cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          {STATUS_LABEL[container.status]}
                        </button>
                        {statusDropdown === container.id && (
                          <div className="absolute z-20 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                            {(Object.keys(STATUS_LABEL) as ContainerStatus[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(container.id, s)}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                                  container.status === s ? 'font-medium text-alencar-green' : 'text-gray-700'
                                }`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {container.locationCity ? `${container.locationCity}/${container.locationState}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{container.clientName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {container.deliveryDate ? formatDate(container.deliveryDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {container.returnDate ? formatDate(container.returnDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingContainer(container); setEditFormOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-alencar-green hover:bg-alencar-green/5 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(container.id)}
                          disabled={deletingId === container.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          {deletingId === container.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editFormOpen && editingContainer && (
        <ContainerFormModal
          container={editingContainer}
          onClose={() => { setEditFormOpen(false); setEditingContainer(null); }}
        />
      )}
    </div>
  );
};
