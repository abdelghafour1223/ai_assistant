import mongoose, { Schema, Document } from 'mongoose';
import { Customer as ICustomer } from '../types';

export interface CustomerDocument extends ICustomer, Document {}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    email: { type: String, sparse: true },
    previousOrders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    tags: [{ type: String, index: true }]
  },
  {
    timestamps: true
  }
);

CustomerSchema.index({ phone: 1, city: 1 });
CustomerSchema.index({ tags: 1 });

export default mongoose.model<CustomerDocument>('Customer', CustomerSchema);
