import { supabase } from '../lib/supabase';
import { Delivery, DeliveryStatus } from '../types';

interface DatabaseDelivery {
  id: string;
  quote_id: string | null;
  container_id: string;
  client_name: string;
  delivery_date: string;
  delivery_city: string;
  delivery_state: string;
  status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const dbToDelivery = (db: DatabaseDelivery): Delivery => ({
  id: db.id,
  quoteId: db.quote_id || undefined,
  containerId: db.container_id,
  clientName: db.client_name,
  deliveryDate: db.delivery_date,
  deliveryCity: db.delivery_city,
  deliveryState: db.delivery_state,
  status: db.status,
  notes: db.notes || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const deliveryToDb = (d: Partial<Delivery>): Record<string, unknown> => {
  const db: Record<string, unknown> = {};
  if (d.quoteId !== undefined) db.quote_id = d.quoteId || null;
  if (d.containerId !== undefined) db.container_id = d.containerId;
  if (d.clientName !== undefined) db.client_name = d.clientName;
  if (d.deliveryDate !== undefined) db.delivery_date = d.deliveryDate;
  if (d.deliveryCity !== undefined) db.delivery_city = d.deliveryCity;
  if (d.deliveryState !== undefined) db.delivery_state = d.deliveryState;
  if (d.status !== undefined) db.status = d.status;
  if (d.notes !== undefined) db.notes = d.notes || null;
  return db;
};

export const getAllDeliveries = async (): Promise<Delivery[]> => {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .order('delivery_date', { ascending: true });

  if (error) throw new Error(`Erro ao buscar entregas: ${error.message}`);
  return (data as DatabaseDelivery[]).map(dbToDelivery);
};

export const getDeliveriesByDateRange = async (start: string, end: string): Promise<Delivery[]> => {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .gte('delivery_date', start)
    .lte('delivery_date', end)
    .order('delivery_date', { ascending: true });

  if (error) throw new Error(`Erro ao buscar entregas: ${error.message}`);
  return (data as DatabaseDelivery[]).map(dbToDelivery);
};

export const getDeliveriesByStatus = async (status: DeliveryStatus): Promise<Delivery[]> => {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('status', status)
    .order('delivery_date', { ascending: true });

  if (error) throw new Error(`Erro ao buscar entregas: ${error.message}`);
  return (data as DatabaseDelivery[]).map(dbToDelivery);
};

export const createDelivery = async (data: Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Delivery> => {
  const dbData = deliveryToDb(data);
  const { data: result, error } = await supabase
    .from('deliveries')
    .insert(dbData)
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar entrega: ${error.message}`);
  return dbToDelivery(result as DatabaseDelivery);
};

export const updateDelivery = async (id: string, updates: Partial<Delivery>): Promise<Delivery> => {
  const dbUpdates = deliveryToDb(updates);
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deliveries')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Erro ao atualizar entrega: ${error.message}`);
  return dbToDelivery(data as DatabaseDelivery);
};

export const updateDeliveryStatus = async (id: string, status: DeliveryStatus): Promise<Delivery> => {
  return updateDelivery(id, { status });
};

export const deleteDelivery = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao deletar entrega: ${error.message}`);
};
