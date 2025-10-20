import { Router, Response } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import GoogleSheetsService from '../services/GoogleSheetsService';
import DeliveryService from '../services/DeliveryService';
import WhatsAppService from '../services/WhatsAppService';
import { OrderStatus } from '../types';

const router = Router();
router.use(authenticate);

router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const { spreadsheetUrl, range } = req.body;

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    const ordersData = await GoogleSheetsService.importOrders(spreadsheetId, range);

    const createdOrders = [];

    for (const orderData of ordersData) {
      let customer = await Customer.findOne({ phone: orderData.customer!.phone });

      if (!customer) {
        customer = await Customer.create(orderData.customer);
      }

      const order = await Order.create({
        ...orderData,
        customerId: customer._id
      });

      customer.previousOrders!.push(order._id!.toString());
      await customer.save();

      createdOrders.push(order);
    }

    logger.info(`Imported ${createdOrders.length} orders`);

    res.json({
      success: true,
      count: createdOrders.length,
      orders: createdOrders
    });
  } catch (error) {
    logger.error('Failed to import orders:', error);
    res.status(500).json({ error: 'Failed to import orders' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    logger.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/:id/ship', async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const trackingNumber = await DeliveryService.createShipment(order);

    order.trackingNumber = trackingNumber;
    order.status = OrderStatus.SHIPPED;
    await order.save();

    // Send WhatsApp notification
    const customer = await Customer.findById(order.customerId);
    if (customer) {
      const message = `مرحبا ${customer.name}! 🎉\n\nطلبك "${order.productName}" تم شحنه بنجاح!\n\nرقم التتبع: ${trackingNumber}\n\nيمكنك تتبع طلبك في أي وقت.\n\nشكراً لثقتك! 💚`;

      await WhatsAppService.sendMessage(customer.phone, message, undefined, order._id!.toString());
    }

    logger.info(`Order ${order._id} shipped with tracking ${trackingNumber}`);

    res.json({ success: true, order });
  } catch (error) {
    logger.error('Failed to ship order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, message, location } = req.body;

    const order = await Order.findById(req.params.id).populate('customerId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      message: message || `Order status updated to ${status}`,
      location
    });
    await order.save();

    // Send WhatsApp notification for important status changes
    const customer = await Customer.findById(order.customerId);
    if (customer && [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(status)) {
      let whatsappMessage = '';

      if (status === OrderStatus.OUT_FOR_DELIVERY) {
        whatsappMessage = `مرحبا ${customer.name}! 🚚\n\nطلبك "${order.productName}" في الطريق إليك!\n\nالتوصيل سيكون اليوم إن شاء الله.\n\nكن جاهزاً لاستلام طلبك! 📦`;
      } else if (status === OrderStatus.DELIVERED) {
        whatsappMessage = `مرحبا ${customer.name}! ✅\n\nطلبك "${order.productName}" تم توصيله بنجاح!\n\nنتمنى أن يعجبك المنتج 💚\n\nننتظر طلبك القادم!`;
      }

      if (whatsappMessage) {
        await WhatsAppService.sendMessage(customer.phone, whatsappMessage, undefined, order._id!.toString());
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    logger.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.get('/:id/track', async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || !order.trackingNumber) {
      return res.status(404).json({ error: 'Order or tracking number not found' });
    }

    const tracking = await DeliveryService.trackShipment(order.trackingNumber);

    res.json({ success: true, tracking });
  } catch (error) {
    logger.error('Failed to track order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

export default router;
