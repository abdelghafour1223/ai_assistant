import { Router, Response } from 'express';
import Customer from '../models/Customer';
import Order from '../models/Order';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import GoogleSheetsService from '../services/GoogleSheetsService';

const router = Router();
router.use(authenticate);

router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const { spreadsheetUrl, range } = req.body;

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    const customersData = await GoogleSheetsService.importCustomers(spreadsheetId, range);

    const results = {
      created: 0,
      updated: 0,
      errors: 0
    };

    for (const customerData of customersData) {
      try {
        const existing = await Customer.findOne({ phone: customerData.phone });

        if (existing) {
          await Customer.updateOne({ _id: existing._id }, customerData);
          results.updated++;
        } else {
          await Customer.create(customerData);
          results.created++;
        }
      } catch (error) {
        logger.error(`Failed to import customer ${customerData.phone}:`, error);
        results.errors++;
      }
    }

    logger.info(`Customer import completed: ${JSON.stringify(results)}`);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Failed to import customers:', error);
    res.status(500).json({ error: 'Failed to import customers' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, city, page = 1, limit = 50 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = city;
    }

    const customers = await Customer.find(query)
      .populate('previousOrders')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('previousOrders');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const orders = await Order.find({ customerId: customer._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      customer: {
        ...customer.toObject(),
        orderHistory: orders
      }
    });
  } catch (error) {
    logger.error('Failed to fetch customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.get('/:id/orders', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ customerId: req.params.id })
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    logger.error('Failed to fetch customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

export default router;
