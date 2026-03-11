export type OperationType = 'venda' | 'locacao';

// Contract types
export * from './contract';

export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  operationType: OperationType;
  isActive?: boolean;
  image_path?: string | null;
}

export interface Category {
  id: string;
  name: string;
  items: Item[];
  operationType: OperationType;
  isActive?: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  projectDate: string;
  purpose: string[];
  propertyNumber?: string;
  addressComplement?: string;
  installationLocation?: string;
  installationLocationOther?: string;
  projectStartTimeline?: string;
  generalNotes?: string;
  purposeOther?: string;
}

export interface Quote {
  id: string;
  customer: Customer;
  selectedItems: Item[];
  basePrice: number;
  totalPrice: number;
  createdAt: string;
  status: 'new' | 'analyzing' | 'negotiating' | 'awaiting-signature' | 'approved' | 'awaiting-payment' | 'paid' | 'rejected' | 'completed' | 'deleted';
  assignedTo?: string;
  internalNotes?: string;
  finalApprovedAmount?: number;
  contractLink?: string;
  paymentMethod?: string;
  paymentLink?: string;
  operationType: OperationType;
  containerType?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryDeadline?: string;
}

export type ContainerStatus = 'available' | 'rented' | 'in_transport' | 'maintenance';

export interface Container {
  id: string;
  containerType: string;
  containerSize: '4m' | '6m' | '12m';
  status: ContainerStatus;
  locationCity?: string;
  locationState?: string;
  quoteId?: string;
  clientName?: string;
  deliveryDate?: string;
  returnDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 'scheduled' | 'in_transit' | 'delivered' | 'returned';

export interface Delivery {
  id: string;
  quoteId?: string;
  containerId: string;
  clientName: string;
  deliveryDate: string;
  deliveryCity: string;
  deliveryState: string;
  status: DeliveryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  createdAt?: string;
}