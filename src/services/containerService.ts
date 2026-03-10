import { supabase } from '../lib/supabase';
import { Container, ContainerStatus } from '../types';

interface DatabaseContainer {
  id: string;
  container_type: string;
  container_size: '4m' | '6m' | '12m';
  status: ContainerStatus;
  location_city: string | null;
  location_state: string | null;
  quote_id: string | null;
  client_name: string | null;
  delivery_date: string | null;
  return_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const dbToContainer = (db: DatabaseContainer): Container => ({
  id: db.id,
  containerType: db.container_type,
  containerSize: db.container_size,
  status: db.status,
  locationCity: db.location_city || undefined,
  locationState: db.location_state || undefined,
  quoteId: db.quote_id || undefined,
  clientName: db.client_name || undefined,
  deliveryDate: db.delivery_date || undefined,
  returnDate: db.return_date || undefined,
  notes: db.notes || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const containerToDb = (c: Partial<Container>): Record<string, unknown> => {
  const db: Record<string, unknown> = {};
  if (c.containerType !== undefined) db.container_type = c.containerType;
  if (c.containerSize !== undefined) db.container_size = c.containerSize;
  if (c.status !== undefined) db.status = c.status;
  if (c.locationCity !== undefined) db.location_city = c.locationCity || null;
  if (c.locationState !== undefined) db.location_state = c.locationState || null;
  if (c.quoteId !== undefined) db.quote_id = c.quoteId || null;
  if (c.clientName !== undefined) db.client_name = c.clientName || null;
  if (c.deliveryDate !== undefined) db.delivery_date = c.deliveryDate || null;
  if (c.returnDate !== undefined) db.return_date = c.returnDate || null;
  if (c.notes !== undefined) db.notes = c.notes || null;
  return db;
};

export const getAllContainers = async (): Promise<Container[]> => {
  const { data, error } = await supabase
    .from('containers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar containers: ${error.message}`);
  return (data as DatabaseContainer[]).map(dbToContainer);
};

export const getContainersByStatus = async (status: ContainerStatus): Promise<Container[]> => {
  const { data, error } = await supabase
    .from('containers')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar containers: ${error.message}`);
  return (data as DatabaseContainer[]).map(dbToContainer);
};

export const getAvailableContainers = async (): Promise<Container[]> => {
  return getContainersByStatus('available');
};

export const createContainer = async (data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>): Promise<Container> => {
  const dbData = containerToDb(data);
  const { data: result, error } = await supabase
    .from('containers')
    .insert(dbData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar container: ${error.message}`);
  return dbToContainer(result as DatabaseContainer);
};

export const updateContainer = async (id: string, updates: Partial<Container>): Promise<Container> => {
  const dbUpdates = containerToDb(updates);
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('containers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar container: ${error.message}`);
  return dbToContainer(data as DatabaseContainer);
};

export const reserveContainer = async (
  containerId: string,
  quoteId: string,
  clientName: string
): Promise<Container> => {
  return updateContainer(containerId, {
    status: 'rented',
    quoteId,
    clientName,
  });
};

export const releaseContainer = async (containerId: string): Promise<Container> => {
  return updateContainer(containerId, {
    status: 'available',
    quoteId: '',
    clientName: '',
    deliveryDate: '',
    returnDate: '',
  });
};

export const deleteContainer = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('containers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar container: ${error.message}`);
};

export interface ContainerStats {
  total: number;
  available: number;
  rented: number;
  in_transport: number;
  maintenance: number;
}

export const getContainerStats = async (): Promise<ContainerStats> => {
  const { data, error } = await supabase
    .from('containers')
    .select('status');

  if (error) throw new Error(`Erro ao buscar estatísticas: ${error.message}`);

  const stats: ContainerStats = {
    total: data.length,
    available: 0,
    rented: 0,
    in_transport: 0,
    maintenance: 0,
  };

  data.forEach((row: { status: string }) => {
    if (row.status in stats) {
      stats[row.status as keyof Omit<ContainerStats, 'total'>]++;
    }
  });

  return stats;
};
