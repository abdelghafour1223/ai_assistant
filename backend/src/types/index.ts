export interface Customer {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  email?: string;
  previousOrders?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  _id?: string;
  customerId: string;
  customer: Customer;
  productName: string;
  productPrice: number;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  trackingNumber?: string;
  shippingProvider?: string;
  deliveryNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  statusHistory: StatusUpdate[];
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

export interface StatusUpdate {
  status: OrderStatus;
  timestamp: Date;
  message: string;
  location?: string;
}

export interface RetargetingCampaign {
  _id?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
  timestamp: Date;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  orderId?: string;
  campaignId?: string;
}

export interface GoogleSheetsImport {
  spreadsheetId: string;
  range: string;
  type: 'orders' | 'customers' | 'retargeting';
}

export interface DeliveryTrackingResponse {
  trackingNumber: string;
  status: string;
  location: string;
  estimatedDelivery?: Date;
  events: Array<{
    timestamp: Date;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'operator';
  createdAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}
