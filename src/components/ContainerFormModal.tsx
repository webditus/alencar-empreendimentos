import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Container, ContainerStatus } from '../types';
import { useContainers } from '../contexts/ContainerContext';

interface ContainerFormModalProps {
  container: Container | null;
  onClose: () => void;
}

const CONTAINER_SIZES = ['4m', '6m', '12m'] as const;
const STATUSES: { value: ContainerStatus; label: string }[] = [
  { value: 'available', label: 'Disponivel' },
  { value: 'rented', label: 'Alugado' },
  { value: 'in_transport', label: 'Em Transporte' },
  { value: 'maintenance', label: 'Manutencao' },
];

export const ContainerFormModal: React.FC<ContainerFormModalProps> = ({ container, onClose }) => {
  const { addContainer, editContainer } = useContainers();
  const isEditing = !!container;

  const [containerType, setContainerType] = useState(container?.containerType || '');
  const [containerSize, setContainerSize] = useState<'4m' | '6m' | '12m'>(container?.containerSize || '6m');
  const [status, setStatus] = useState<ContainerStatus>(container?.status || 'available');
  const [locationCity, setLocationCity] = useState(container?.locationCity || '');
  const [locationState, setLocationState] = useState(container?.locationState || '');
  const [notes, setNotes] = useState(container?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerType.trim()) {
      setError('Informe o tipo do container');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isEditing) {
        await editContainer(container.id, {
          containerType,
          containerSize,
          status,
          locationCity: locationCity || undefined,
          locationState: locationState || undefined,
          notes: notes || undefined,
        });
      } else {
        await addContainer({
          containerType,
          containerSize,
          status,
          locationCity: locationCity || undefined,
          locationState: locationState || undefined,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar container:', err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Editar Container' : 'Novo Container'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-alencar-green hover:bg-alencar-hover rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? 'Salvar Alteracoes' : 'Criar Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
