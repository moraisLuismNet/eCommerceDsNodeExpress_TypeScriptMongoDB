import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  userEmail: string;
  password?: string; // Optional because it will be selected only when needed
  role: 'Admin' | 'User';
  cartId?: mongoose.Types.ObjectId;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  __v: { type: Number, select: false },
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Exclude by default
  },
  role: {
    type: String,
    enum: ['Admin', 'User', 'admin', 'user'],
    default: 'User',
    set: (val: string) => {
      if (!val) return 'User';
      return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: false,
    sparse: true, // This allows multiple documents to have cartId: null
  },
});

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;