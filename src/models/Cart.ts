import mongoose, { Document, Schema } from 'mongoose';

export interface IRecordDetails {
  title: string;
  image?: string;
}

export interface ICartItem extends Document {
  recordId: mongoose.Types.ObjectId;
  amount: number;
  price: number; 
  recordDetails?: IRecordDetails;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  userEmail?: string;  
  items: ICartItem[];
  totalPrice: number;
  enabled: boolean;
  recalculateTotal: () => void;
}

const CartItemSchema: Schema = new Schema({
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
  recordDetails: {
    title: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: false
    }
  }
}, { _id: false });

const CartSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  userEmail: {
    type: String,
    required: false
  }
}, {
  timestamps: false, // Disable automatic timestamps
  versionKey: false, // This will prevent the __v field from being added
});

// Method to recalculate total price
CartSchema.methods.recalculateTotal = function() {
  if (!this.items || !Array.isArray(this.items)) {
    this.totalPrice = 0;
    return;
  }
  
  this.totalPrice = this.items.reduce((acc: number, item: ICartItem) => {
    // Ensure amount and price are numbers
    const amount = typeof item.amount === 'number' ? item.amount : 0;
    const price = typeof item.price === 'number' ? item.price : 0;
    return acc + (amount * price);
  }, 0);
  
  // Ensure totalPrice is a valid number
  if (isNaN(this.totalPrice)) {
    this.totalPrice = 0;
  }
};

const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
