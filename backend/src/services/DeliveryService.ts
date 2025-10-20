import axios from 'axios';
import logger from '../utils/logger';
import { DeliveryTrackingResponse, Order, OrderStatus } from '../types';

class DeliveryService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.DELIVERY_API_KEY || '';
    this.apiUrl = process.env.DELIVERY_API_URL || '';
  }

  async createShipment(order: Order): Promise<string> {
    try {
      // This is a generic implementation - adapt to your delivery provider's API
      const response = await axios.post(
        `${this.apiUrl}/shipments`,
        {
          recipient: {
            name: order.customer.name,
            phone: order.customer.phone,
            address: order.customer.address,
            city: order.customer.city,
            email: order.customer.email
          },
          items: [
            {
              description: order.productName,
              quantity: order.quantity,
              value: order.totalAmount
            }
          ],
          reference: order._id,
          notes: order.deliveryNotes
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const trackingNumber = response.data.tracking_number || response.data.trackingNumber;
      logger.info(`Shipment created with tracking number: ${trackingNumber}`);
      return trackingNumber;
    } catch (error) {
      logger.error('Failed to create shipment:', error);
      throw error;
    }
  }

  async trackShipment(trackingNumber: string): Promise<DeliveryTrackingResponse> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/tracking/${trackingNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = response.data;

      const trackingInfo: DeliveryTrackingResponse = {
        trackingNumber,
        status: this.mapDeliveryStatus(data.status),
        location: data.current_location || data.location || '',
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
        events: (data.events || []).map((event: any) => ({
          timestamp: new Date(event.timestamp),
          status: event.status,
          location: event.location || '',
          description: event.description || ''
        }))
      };

      return trackingInfo;
    } catch (error) {
      logger.error(`Failed to track shipment ${trackingNumber}:`, error);
      throw error;
    }
  }

  private mapDeliveryStatus(providerStatus: string): string {
    // Map delivery provider status to our internal status
    const statusMap: { [key: string]: OrderStatus } = {
      'pending': OrderStatus.PENDING,
      'confirmed': OrderStatus.CONFIRMED,
      'picked_up': OrderStatus.SHIPPED,
      'in_transit': OrderStatus.IN_TRANSIT,
      'out_for_delivery': OrderStatus.OUT_FOR_DELIVERY,
      'delivered': OrderStatus.DELIVERED,
      'cancelled': OrderStatus.CANCELLED,
      'returned': OrderStatus.RETURNED
    };

    return statusMap[providerStatus.toLowerCase()] || providerStatus;
  }

  async cancelShipment(trackingNumber: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.apiUrl}/shipments/${trackingNumber}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      logger.info(`Shipment ${trackingNumber} cancelled`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel shipment ${trackingNumber}:`, error);
      return false;
    }
  }

  async getBulkTracking(trackingNumbers: string[]): Promise<Map<string, DeliveryTrackingResponse>> {
    const trackingMap = new Map<string, DeliveryTrackingResponse>();

    for (const trackingNumber of trackingNumbers) {
      try {
        const tracking = await this.trackShipment(trackingNumber);
        trackingMap.set(trackingNumber, tracking);

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`Failed to get tracking for ${trackingNumber}:`, error);
      }
    }

    return trackingMap;
  }
}

export default new DeliveryService();
