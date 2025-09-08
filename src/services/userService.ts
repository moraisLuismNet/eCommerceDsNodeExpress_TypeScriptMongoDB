import mongoose, { Types, Document } from 'mongoose';
import User, { IUser } from '../models/User';
import cartService from './cartService';
import Order from '../models/Order';

export interface UserInsertDTO {
  userEmail: string;
  password: string;
  role?: 'Admin' | 'User';
}

export async function findUserByEmail(userEmail: string): Promise<IUser | null> {
  return User.findOne({ userEmail }).select('+password');
}

export async function createUser(userInsertDTO: UserInsertDTO): Promise<IUser> {
  const { userEmail, password, role } = userInsertDTO;
  let user;

  if (!userEmail || !password) {
    throw new Error('Email and password are required');
  }

  const existingUser = await User.findOne({ userEmail });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create the user without cartId first
  user = new User({
    userEmail,
    password,
    role,
    cartId: undefined // Ensure it doesn't save as null
  });

  try {
    const savedUser = await user.save();
    
    // Create the cart with the user ID
    const userId = savedUser._id.toString();
    const cart = await cartService.createCart(userId);

    // Update the user with the cartId
    if (cart._id) {
      const updatedUser = await User.findByIdAndUpdate(
        savedUser._id,
        { $set: { cartId: new mongoose.Types.ObjectId(cart._id.toString()) } },
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error('Failed to update user with cart ID');
      }
      
      return updatedUser;
    }

    return savedUser;
  } catch (error) {
    console.error("Error creating user:", error);
    // If the user was created but the cart failed, delete the user
    if (user?._id) {
      await User.findByIdAndDelete(user._id);
    }
    throw new Error("Failed to create user: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function getAllUsers(): Promise<Omit<IUser, 'password'>[]> {
  return User.find().select('-password');
}

export async function deleteUser(email: string): Promise<boolean> {
  try {
    // Search by userEmail instead of email
    const user = await User.findOne({ userEmail: email });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return false;
    }

    await Order.deleteMany({ userId: user._id });
    
    if (user.cartId) {
        const Cart = mongoose.model('Cart');
        await Cart.findByIdAndDelete(user.cartId);
    }

    await User.findByIdAndDelete(user._id);

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}

export default {
  findUserByEmail,
  createUser,
  getAllUsers,
  deleteUser,
};