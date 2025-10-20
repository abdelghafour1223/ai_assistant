import mongoose, { Schema, Document } from 'mongoose';
import { WhatsAppMessage as IMessage } from '../types';

export interface MessageDocument extends IMessage, Document {}

const WhatsAppMessageSchema = new Schema<MessageDocument>(
  {
    to: { type: String, required: true, index: true },
    message: { type: String, required: true },
    mediaUrl: { type: String },
    timestamp: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
      index: true
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'RetargetingCampaign', index: true }
  },
  {
    timestamps: true
  }
);

WhatsAppMessageSchema.index({ to: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ status: 1, timestamp: 1 });

export default mongoose.model<MessageDocument>('WhatsAppMessage', WhatsAppMessageSchema);
