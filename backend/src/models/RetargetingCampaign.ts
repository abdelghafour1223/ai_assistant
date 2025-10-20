import mongoose, { Schema, Document } from 'mongoose';
import { RetargetingCampaign as ICampaign } from '../types';

export interface CampaignDocument extends ICampaign, Document {}

const RetargetingCampaignSchema = new Schema<CampaignDocument>(
  {
    name: { type: String, required: true },
    targetAudience: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    productName: { type: String, required: true },
    productDescription: { type: String, required: true },
    productPrice: { type: Number, required: true, min: 0 },
    productImage: { type: String },
    message: { type: String },
    aiGeneratedMessage: { type: String },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
      index: true
    },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    convertedCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

RetargetingCampaignSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<CampaignDocument>('RetargetingCampaign', RetargetingCampaignSchema);
