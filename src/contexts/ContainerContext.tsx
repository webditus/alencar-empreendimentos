import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Container, ContainerStatus } from '../types';
import {
  getAllContainers,
  createContainer as createContainerService,
  updateContainer as updateContainerService,
  reserveContainer as reserveContainerService,
  releaseContainer as releaseContainerService,
  deleteContainer as deleteContainerService,
  ContainerStats,
} from '../services/containerService';

interface ContainerContextType {
  containers: Container[];
  loading: boolean;
  error: string | null;
  stats: ContainerStats;
  refreshContainers: () => Promise<void>;
  addContainer: (data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Container>;
  editContainer: (id: string, updates: Partial<Container>) => Promise<void>;
  reserveContainer: (containerId: string, quoteId: string, clientName: string) => Promise<void>;
  releaseContainer: (containerId: string) => Promise<void>;
  removeContainer: (id: string) => Promise<void>;
  getAvailableContainers: () => Container[];
  getContainersByStatus: (status: ContainerStatus) => Container[];
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

export const useContainers = () => {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainers must be used within a ContainerProvider');
  }
  return context;
};

const computeStats = (containers: Container[]): ContainerStats => {
  const stats: ContainerStats = { total: containers.length, available: 0, rented: 0, in_transport: 0, maintenance: 0 };
  containers.forEach((c) => {
    if (c.status === 'available') stats.available++;
    else if (c.status === 'rented') stats.rented++;
    else if (c.status === 'in_transport') stats.in_transport++;
    else if (c.status === 'maintenance') stats.maintenance++;
  });
  return stats;
};

export const ContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ContainerStats>({ total: 0, available: 0, rented: 0, in_transport: 0, maintenance: 0 });

  const refreshContainers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllContainers();
      setContainers(data);
      setStats(computeStats(data));
    } catch (err) {
      console.error('Erro ao buscar containers:', err);
      setError('Erro ao carregar containers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContainers();
  }, [refreshContainers]);

  const addContainer = async (data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>): Promise<Container> => {
    const created = await createContainerService(data);
    const updated = [...containers, created];
    setContainers(updated);
    setStats(computeStats(updated));
    return created;
  };

  const editContainer = async (id: string, updates: Partial<Container>): Promise<void> => {
    const result = await updateContainerService(id, updates);
    const updated = containers.map((c) => (c.id === id ? result : c));
    setContainers(updated);
    setStats(computeStats(updated));
  };

  const reserveContainer = async (containerId: string, quoteId: string, clientName: string): Promise<void> => {
    const result = await reserveContainerService(containerId, quoteId, clientName);
    const updated = containers.map((c) => (c.id === containerId ? result : c));
    setContainers(updated);
    setStats(computeStats(updated));
  };

  const releaseContainer = async (containerId: string): Promise<void> => {
    const result = await releaseContainerService(containerId);
    const updated = containers.map((c) => (c.id === containerId ? result : c));
    setContainers(updated);
    setStats(computeStats(updated));
  };

  const removeContainer = async (id: string): Promise<void> => {
    await deleteContainerService(id);
    const updated = containers.filter((c) => c.id !== id);
    setContainers(updated);
    setStats(computeStats(updated));
  };

  const getAvailableContainers = (): Container[] => {
    return containers.filter((c) => c.status === 'available');
  };

  const getContainersByStatus = (status: ContainerStatus): Container[] => {
    return containers.filter((c) => c.status === status);
  };

  return (
    <ContainerContext.Provider
      value={{
        containers,
        loading,
        error,
        stats,
        refreshContainers,
        addContainer,
        editContainer,
        reserveContainer,
        releaseContainer,
        removeContainer,
        getAvailableContainers,
        getContainersByStatus,
      }}
    >
      {children}
    </ContainerContext.Provider>
  );
};
