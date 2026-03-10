import React, { useState, useMemo } from 'react';
import { CalendarDays, Filter, Loader2, RefreshCw, Truck, AlertTriangle } from 'lucide-react';
import { DeliveryStatus } from '../types';
import { useDeliveries } from '../contexts/DeliveryContext';
import { useContainers } from '../contexts/ContainerContext';

const STATUS_OPTIONS: { label: string; value: DeliveryStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Em Transito', value: 'in_transit' },
  { label: 'Entregue', value: 'delivered' },
  { label: 'Devolvido', value: 'returned' },
];

const STATUS_BADGE: Record<DeliveryStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  scheduled: 'Agendado',
  in_transit: 'Em Transito',
  delivered: 'Entregue',
  returned: 'Devolvido',
};

const formatDateBR = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
};

const formatDateFull = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const DeliverySchedule: React.FC = () => {
  const { deliveries, loading, error, refreshDeliveries, changeDeliveryStatus } = useDeliveries();
  const { containers } = useContainers();
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const containerMap = useMemo(() => {
    const map = new Map<string, string>();
    containers.forEach((c) => {
      map.set(c.id, `${c.containerType} ${c.containerSize}`);
    });
    return map;
  }, [containers]);

  const filtered = useMemo(() => {
    let result = deliveries;
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (startDate) {
      result = result.filter((d) => d.deliveryDate >= startDate);
    }
    if (endDate) {
      result = result.filter((d) => d.deliveryDate <= endDate);
    }
    return result;
  }, [deliveries, statusFilter, startDate, endDate]);

  const handleStatusChange = async (id: string, newStatus: DeliveryStatus) => {
    try {
      await changeDeliveryStatus(id, newStatus);
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
        <h2 className="text-2xl font-bold text-gray-900">Agenda de Entregas</h2>
        <button
          onClick={refreshDeliveries}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none"
              placeholder="Data inicio"
            />
            <span className="text-gray-400 text-sm">ate</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-alencar-green/20 focus:border-alencar-green outline-none"
              placeholder="Data fim"
            />
          </div>
          {(startDate || endDate || statusFilter !== 'all') && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter('all'); }}
              className="text-sm text-alencar-green hover:text-alencar-hover font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma entrega encontrada</p>
          <p className="text-gray-400 text-sm mt-1">
            Entregas sao criadas quando um container e reservado no Kanban.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Container</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatDateBR(delivery.deliveryDate)}
                      <span className="block text-[10px] text-gray-400">{formatDateFull(delivery.deliveryDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{delivery.clientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {containerMap.get(delivery.containerId) || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {delivery.deliveryCity}/{delivery.deliveryState}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === delivery.id ? null : delivery.id)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_BADGE[delivery.status]}`}
                        >
                          {STATUS_LABEL[delivery.status]}
                        </button>
                        {statusDropdown === delivery.id && (
                          <div className="absolute z-20 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                            {(Object.keys(STATUS_LABEL) as DeliveryStatus[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(delivery.id, s)}
                                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                                  delivery.status === s ? 'font-medium text-alencar-green' : 'text-gray-700'
                                }`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-400">
                        {delivery.notes || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
