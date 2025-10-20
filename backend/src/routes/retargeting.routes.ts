import { Router, Response } from 'express';
import RetargetingCampaign from '../models/RetargetingCampaign';
import Customer from '../models/Customer';
import { authenticate, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import GoogleSheetsService from '../services/GoogleSheetsService';
import GeminiService from '../services/GeminiService';
import WhatsAppService from '../services/WhatsAppService';

const router = Router();
router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const campaignData = req.body;

    const campaign = await RetargetingCampaign.create(campaignData);

    logger.info(`Created retargeting campaign: ${campaign.name}`);

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    logger.error('Failed to create campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.post('/:id/import-audience', async (req: AuthRequest, res: Response) => {
  try {
    const { spreadsheetUrl, range } = req.body;

    const campaign = await RetargetingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    const phoneNumbers = await GoogleSheetsService.importRetargetingList(spreadsheetId, range);

    const customerIds: string[] = [];

    for (const phone of phoneNumbers) {
      const customer = await Customer.findOne({ phone });
      if (customer) {
        customerIds.push(customer._id!.toString());
      }
    }

    campaign.targetAudience = customerIds;
    await campaign.save();

    logger.info(`Imported ${customerIds.length} customers to campaign ${campaign.name}`);

    res.json({
      success: true,
      campaign,
      audienceCount: customerIds.length
    });
  } catch (error) {
    logger.error('Failed to import audience:', error);
    res.status(500).json({ error: 'Failed to import audience' });
  }
});

router.post('/:id/generate-messages', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await RetargetingCampaign.findById(req.params.id).populate('targetAudience');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.targetAudience || campaign.targetAudience.length === 0) {
      return res.status(400).json({ error: 'No target audience found' });
    }

    // Generate AI message for the first customer as a sample
    const firstCustomer = campaign.targetAudience[0] as any;
    const aiMessage = await GeminiService.generateRetargetingMessage(campaign, firstCustomer);

    campaign.aiGeneratedMessage = aiMessage;
    await campaign.save();

    logger.info(`Generated AI message for campaign ${campaign.name}`);

    res.json({
      success: true,
      message: aiMessage,
      campaign
    });
  } catch (error) {
    logger.error('Failed to generate messages:', error);
    res.status(500).json({ error: 'Failed to generate messages' });
  }
});

router.post('/:id/launch', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await RetargetingCampaign.findById(req.params.id).populate('targetAudience');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.targetAudience || campaign.targetAudience.length === 0) {
      return res.status(400).json({ error: 'No target audience found' });
    }

    campaign.status = 'active';
    await campaign.save();

    // Launch campaign in background
    setImmediate(async () => {
      try {
        const customers = campaign.targetAudience as any[];

        for (const customer of customers) {
          try {
            // Generate personalized message
            let message = campaign.aiGeneratedMessage || campaign.message;

            if (!message) {
              message = await GeminiService.generateRetargetingMessage(campaign, customer);
            }

            // Send WhatsApp message
            await WhatsAppService.sendMessage(
              customer.phone,
              message,
              campaign.productImage,
              undefined,
              campaign._id!.toString()
            );

            campaign.sentCount++;
            await campaign.save();

            // Delay between messages
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            logger.error(`Failed to send message to ${customer.phone}:`, error);
          }
        }

        campaign.status = 'completed';
        await campaign.save();

        logger.info(`Campaign ${campaign.name} completed`);
      } catch (error) {
        logger.error(`Campaign ${campaign._id} failed:`, error);
        campaign.status = 'paused';
        await campaign.save();
      }
    });

    res.json({
      success: true,
      message: 'Campaign launched successfully',
      campaign
    });
  } catch (error) {
    logger.error('Failed to launch campaign:', error);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const campaigns = await RetargetingCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await RetargetingCampaign.countDocuments(query);

    res.json({
      success: true,
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await RetargetingCampaign.findById(req.params.id).populate('targetAudience');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    logger.error('Failed to fetch campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await RetargetingCampaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    logger.error('Failed to update campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await RetargetingCampaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    logger.error('Failed to delete campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
