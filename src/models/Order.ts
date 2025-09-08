import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem extends Document {
  recordId: mongoose.Schema.Types.ObjectId;
  amount: number;
  price: number; 
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userEmail: string;
  items: IOrderItem[];
  total: number;
  orderDate: Date;
  paymentMethod: string;
}

const OrderItemSchema: Schema = new Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const OrderSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
    index: true // Keep the index for querying, but don't make it unique
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Credit Card',
  },
}, {
  timestamps: true,
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;