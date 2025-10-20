import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import logger from '../utils/logger';
import WhatsAppMessage from '../models/WhatsAppMessage';
import { EventEmitter } from 'events';

class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private isReady: boolean = false;
  private qrCode: string | null = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', async (qr: string) => {
        logger.info('WhatsApp QR Code received');
        this.qrCode = await QRCode.toDataURL(qr);
        this.emit('qr', this.qrCode);
      });

      this.client.on('ready', () => {
        logger.info('WhatsApp client is ready');
        this.isReady = true;
        this.qrCode = null;
        this.emit('ready');
      });

      this.client.on('authenticated', () => {
        logger.info('WhatsApp authenticated');
        this.emit('authenticated');
      });

      this.client.on('auth_failure', (msg) => {
        logger.error('WhatsApp authentication failed:', msg);
        this.emit('auth_failure', msg);
      });

      this.client.on('disconnected', (reason) => {
        logger.warn('WhatsApp disconnected:', reason);
        this.isReady = false;
        this.emit('disconnected', reason);
      });

      this.client.on('message_create', async (msg) => {
        logger.debug('Message received:', msg.body);
      });

      await this.client.initialize();
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  async sendMessage(to: string, message: string, mediaUrl?: string, orderId?: string, campaignId?: string): Promise<void> {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      const messageDoc = await WhatsAppMessage.create({
        to: formattedNumber,
        message,
        mediaUrl,
        timestamp: new Date(),
        status: 'queued',
        orderId,
        campaignId
      });

      let media: MessageMedia | undefined;
      if (mediaUrl) {
        media = await MessageMedia.fromUrl(mediaUrl);
      }

      if (media) {
        await this.client.sendMessage(formattedNumber, media, { caption: message });
      } else {
        await this.client.sendMessage(formattedNumber, message);
      }

      messageDoc.status = 'sent';
      await messageDoc.save();

      logger.info(`Message sent to ${formattedNumber}`);
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  async sendBulkMessages(messages: Array<{ to: string; message: string; mediaUrl?: string; campaignId?: string }>): Promise<void> {
    for (const msg of messages) {
      try {
        await this.sendMessage(msg.to, msg.message, msg.mediaUrl, undefined, msg.campaignId);
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to send message to ${msg.to}:`, error);
      }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming Morocco +212)
    if (!cleaned.startsWith('212')) {
      if (cleaned.startsWith('0')) {
        cleaned = '212' + cleaned.substring(1);
      } else {
        cleaned = '212' + cleaned;
      }
    }

    return cleaned + '@c.us';
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      logger.info('WhatsApp client disconnected');
    }
  }
}

export default new WhatsAppService();
