import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import WhatsAppService from '../services/WhatsAppService';
import logger from '../utils/logger';

const router = Router();
router.use(authenticate);

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const isReady = WhatsAppService.isClientReady();
    const qrCode = WhatsAppService.getQRCode();

    res.json({
      success: true,
      status: isReady ? 'ready' : 'pending',
      qrCode
    });
  } catch (error) {
    logger.error('Failed to get WhatsApp status:', error);
    res.status(500).json({ error: 'Failed to get WhatsApp status' });
  }
});

router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const { to, message, mediaUrl } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    await WhatsAppService.sendMessage(to, message, mediaUrl);

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/disconnect', async (req: AuthRequest, res: Response) => {
  try {
    await WhatsAppService.disconnect();

    res.json({
      success: true,
      message: 'WhatsApp disconnected'
    });
  } catch (error) {
    logger.error('Failed to disconnect WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
