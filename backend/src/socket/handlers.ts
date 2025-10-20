import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import WhatsAppService from '../services/WhatsAppService';
import DeliveryService from '../services/DeliveryService';
import Order from '../models/Order';
import { JWTPayload } from '../types';

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Client connected: ${user.email}`);

    socket.emit('connected', {
      message: 'Connected to server',
      user: {
        email: user.email,
        role: user.role
      }
    });

    // WhatsApp events
    socket.on('whatsapp:getStatus', () => {
      const isReady = WhatsAppService.isClientReady();
      const qrCode = WhatsAppService.getQRCode();

      socket.emit('whatsapp:status', {
        status: isReady ? 'ready' : 'pending',
        qrCode
      });
    });

    // Real-time order tracking
    socket.on('order:subscribe', async (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.debug(`Client subscribed to order ${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      logger.debug(`Client unsubscribed from order ${orderId}`);
    });

    socket.on('order:track', async (orderId: string) => {
      try {
        const order = await Order.findById(orderId);

        if (!order || !order.trackingNumber) {
          socket.emit('order:trackingError', { error: 'Order or tracking number not found' });
          return;
        }

        const tracking = await DeliveryService.trackShipment(order.trackingNumber);

        socket.emit('order:trackingUpdate', {
          orderId,
          tracking
        });
      } catch (error) {
        logger.error('Failed to track order:', error);
        socket.emit('order:trackingError', { error: 'Failed to track order' });
      }
    });

    // Campaign progress updates
    socket.on('campaign:subscribe', (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      logger.debug(`Client subscribed to campaign ${campaignId}`);
    });

    socket.on('campaign:unsubscribe', (campaignId: string) => {
      socket.leave(`campaign:${campaignId}`);
      logger.debug(`Client unsubscribed from campaign ${campaignId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${user.email}`);
    });
  });

  // WhatsApp service event handlers
  WhatsAppService.on('qr', (qrCode: string) => {
    io.emit('whatsapp:qr', { qrCode });
  });

  WhatsAppService.on('ready', () => {
    io.emit('whatsapp:ready');
  });

  WhatsAppService.on('authenticated', () => {
    io.emit('whatsapp:authenticated');
  });

  WhatsAppService.on('disconnected', (reason: string) => {
    io.emit('whatsapp:disconnected', { reason });
  });

  return io;
};

// Emit order update to all subscribers
export const emitOrderUpdate = (io: Server, orderId: string, order: any) => {
  io.to(`order:${orderId}`).emit('order:update', { order });
};

// Emit campaign progress update
export const emitCampaignProgress = (io: Server, campaignId: string, progress: any) => {
  io.to(`campaign:${campaignId}`).emit('campaign:progress', progress);
};
