import React, { useMemo } from 'react';
import { TrendingUp, CheckCircle, Box, Package, Truck, CalendarDays, Loader2 } from 'lucide-react';
import { useQuotes } from '../contexts/QuoteContext';
import { useContainers } from '../contexts/ContainerContext';
import { useDeliveries } from '../contexts/DeliveryContext';
import { formatCurrency } from '../utils/formatters';

const EXCLUDED_STATUSES = ['rejected', 'completed', 'deleted'];

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, accent }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const formatDateBR = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
};

export const CRMDashboard: React.FC = () => {
  const { allQuotes, loading: quotesLoading } = useQuotes();
  const { stats, loading: containersLoading } = useContainers();
  const { loading: deliveriesLoading, getUpcomingDeliveries } = useDeliveries();
  const { containers } = useContainers();

  const loading = quotesLoading || containersLoading || deliveriesLoading;

  const pipelineTotal = useMemo(() => {
    return allQuotes
      .filter((q) => !EXCLUDED_STATUSES.includes(q.status))
      .reduce((sum, q) => sum + q.totalPrice, 0);
  }, [allQuotes]);

  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return allQuotes
      .filter((q) => q.status === 'approved' && q.createdAt >= startOfMonth)
      .reduce((sum, q) => sum + q.totalPrice, 0);
  }, [allQuotes]);

  const upcomingDeliveries = getUpcomingDeliveries(5);

  const containerMap = useMemo(() => {
    const map = new Map<string, string>();
    containers.forEach((c) => {
      map.set(c.id, `${c.containerType} ${c.containerSize}`);
    });
    return map;
  }, [containers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-alencar-green animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Pipeline Total"
          value={formatCurrency(pipelineTotal)}
          icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
          accent="bg-teal-50"
        />
        <MetricCard
          title="Aprovados este Mes"
          value={formatCurrency(approvedThisMonth)}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          accent="bg-green-50"
        />
        <MetricCard
          title="Containers Alugados"
          value={String(stats.rented)}
          icon={<Box className="w-5 h-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <MetricCard
          title="Containers Disponiveis"
          value={String(stats.available)}
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Proximas Entregas</h3>
        </div>

        {upcomingDeliveries.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma entrega agendada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {upcomingDeliveries.map((delivery) => {
              const statusBadge =
                delivery.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700';
              const statusLabel =
                delivery.status === 'scheduled' ? 'Agendado' : 'Em Transito';

              return (
                <div key={delivery.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600">
                        {formatDateBR(delivery.deliveryDate)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{delivery.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {containerMap.get(delivery.containerId) || 'Container'} - {delivery.deliveryCity}/{delivery.deliveryState}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
