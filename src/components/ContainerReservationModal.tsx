import React, { useState } from 'react';
import { X, Box, CalendarDays, MapPin, Loader2 } from 'lucide-react';
import { Quote, Container } from '../types';
import { useContainers } from '../contexts/ContainerContext';
import { useDeliveries } from '../contexts/DeliveryContext';

interface ContainerReservationModalProps {
  quote: Quote;
  onClose: () => void;
  onComplete: () => void;
}

export const ContainerReservationModal: React.FC<ContainerReservationModalProps> = ({
  quote,
  onClose,
  onComplete,
}) => {
  const { getAvailableContainers, reserveContainer } = useContainers();
  const { addDelivery } = useDeliveries();
  const [selectedContainerId, setSelectedContainerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(quote.deliveryDeadline || '');
  const [deliveryCity, setDeliveryCity] = useState(quote.deliveryCity || quote.customer.city || '');
  const [deliveryState, setDeliveryState] = useState(quote.deliveryState || quote.customer.state || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableContainers = getAvailableContainers();

  const handleReserve = async () => {
    if (!selectedContainerId) {
      setError('Selecione um container');
      return;
    }
    if (!deliveryDate) {
      setError('Informe a data de entrega');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await reserveContainer(selectedContainerId, quote.id, quote.customer.name);

      await addDelivery({
        quoteId: quote.id,
        containerId: selectedContainerId,
        clientName: quote.customer.name,
        deliveryDate,
        deliveryCity,
        deliveryState,
        status: 'scheduled',
      });

      onComplete();
    } catch (err) {
      console.error('Erro ao reservar container:', err);
      setError('Erro ao reservar container. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatContainerLabel = (c: Container) => {
    return `${c.containerType} ${c.containerSize}${c.locationCity ? ` - ${c.locationCity}/${c.locationState}` : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-alencar-green/10 flex items-center justify-center">
              <Box className="w-5 h-5 text-alencar-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reservar Container</h3>
              <p className="text-sm text-gray-500">{quote.customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Container Disponivel
            </label>
            {availableContainers.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                Nenhum container disponivel no momento.
              </p>
            ) : (
              <select
                value={selectedContainerId}
                onChange={(e) => setSelectedContainerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
              >
                <option value="">Selecione um container...</option>
                {availableContainers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatContainerLabel(c)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <CalendarDays className="w-4 h-4 inline mr-1" />
              Data de Entrega
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1" />
                Cidade
              </label>
              <input
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
              <input
                type="text"
                value={deliveryState}
                onChange={(e) => setDeliveryState(e.target.value)}
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none transition-all uppercase"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Pular
          </button>
          <button
            onClick={handleReserve}
            disabled={saving || availableContainers.length === 0}
            className="px-5 py-2.5 text-sm font-medium text-white bg-alencar-green hover:bg-alencar-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reservando...
              </>
            ) : (
              'Reservar e Agendar Entrega'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
