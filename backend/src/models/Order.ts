import mongoose, { Schema, Document } from 'mongoose';
import { Order as IOrder, OrderStatus } from '../types';

export interface OrderDocument extends IOrder, Document {}

const StatusUpdateSchema = new Schema({
  status: { type: String, enum: Object.values(OrderStatus), required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  message: { type: String, required: true },
  location: { type: String }
}, { _id: false });

const OrderSchema = new Schema<OrderDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true
    },
    trackingNumber: { type: String, unique: true, sparse: true, index: true },
    shippingProvider: { type: String },
    deliveryNotes: { type: String },
    statusHistory: [StatusUpdateSchema]
  },
  {
    timestamps: true
  }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ trackingNumber: 1 });

OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      message: `Order status changed to ${this.status}`
    });
  }
  next();
});

export default mongoose.model<OrderDocument>('Order', OrderSchema);
