export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  email?: string;
  previousOrders?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export interface Order {
  _id: string;
  customerId: string | Customer;
  productName: string;
  productPrice: number;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusUpdate[];
}

export interface StatusUpdate {
  status: OrderStatus;
  timestamp: string;
  message: string;
  location?: string;
}

export interface RetargetingCampaign {
  _id: string;
  name: string;
  targetAudience: string[];
  productName: string;
  productDescription: string;
  productPrice: number;
  productImage?: string;
  message?: string;
  aiGeneratedMessage?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  convertedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryTracking {
  trackingNumber: string;
  status: string;
  location: string;
  estimatedDelivery?: string;
  events: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface WhatsAppStatus {
  status: 'ready' | 'pending' | 'disconnected';
  qrCode?: string;
}
