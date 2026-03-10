import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Delivery, DeliveryStatus } from '../types';
import {
  getAllDeliveries,
  createDelivery as createDeliveryService,
  updateDelivery as updateDeliveryService,
  updateDeliveryStatus as updateDeliveryStatusService,
  deleteDelivery as deleteDeliveryService,
} from '../services/deliveryService';

interface DeliveryContextType {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
  refreshDeliveries: () => Promise<void>;
  addDelivery: (data: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Delivery>;
  editDelivery: (id: string, updates: Partial<Delivery>) => Promise<void>;
  changeDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<void>;
  removeDelivery: (id: string) => Promise<void>;
  getUpcomingDeliveries: (limit?: number) => Delivery[];
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const useDeliveries = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDeliveries must be used within a DeliveryProvider');
  }
  return context;
};

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDeliveries();
      setDeliveries(data);
    } catch (err) {
      console.error('Erro ao buscar entregas:', err);
      setError('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDeliveries();
  }, [refreshDeliveries]);

  const addDelivery = async (data: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery> => {
    const created = await createDeliveryService(data);
    setDeliveries((prev) => [...prev, created].sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)));
    return created;
  };

  const editDelivery = async (id: string, updates: Partial<Delivery>): Promise<void> => {
    const result = await updateDeliveryService(id, updates);
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? result : d)).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    );
  };

  const changeDeliveryStatus = async (id: string, status: DeliveryStatus): Promise<void> => {
    const result = await updateDeliveryStatusService(id, status);
    setDeliveries((prev) => prev.map((d) => (d.id === id ? result : d)));
  };

  const removeDelivery = async (id: string): Promise<void> => {
    await deleteDeliveryService(id);
    setDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  const getUpcomingDeliveries = (limit = 5): Delivery[] => {
    const today = new Date().toISOString().split('T')[0];
    return deliveries
      .filter((d) => (d.status === 'scheduled' || d.status === 'in_transit') && d.deliveryDate >= today)
      .slice(0, limit);
  };

  return (
    <DeliveryContext.Provider
      value={{
        deliveries,
        loading,
        error,
        refreshDeliveries,
        addDelivery,
        editDelivery,
        changeDeliveryStatus,
        removeDelivery,
        getUpcomingDeliveries,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};
