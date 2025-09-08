import Order, { IOrder, IOrderItem } from "../models/Order";
import Cart, { ICart } from "../models/Cart";
import mongoose from "mongoose";

async function createOrder(
  userId: string,
  userEmail: string,
  cart: ICart,
  paymentMethod: string
): Promise<IOrder> {
  if (!cart || cart.items.length === 0) {
    throw new Error("Cannot create an order from an empty cart.");
  }

  // Map cart items to order items with proper typing
  const orderItems: Array<{
    recordId: mongoose.Types.ObjectId;
    amount: number;
    price: number;
    recordDetails?: { title: string; image?: string };
  }> = cart.items.map((item) => ({
    recordId: new mongoose.Types.ObjectId(item.recordId),
    amount: item.amount,
    price: item.price,
    ...(item.recordDetails && {
      recordDetails: {
        title: item.recordDetails.title,
        ...(item.recordDetails.image && { image: item.recordDetails.image })
      }
    })
  }));

  const total = cart.totalPrice;

  try {
    // Create a new order document
    const order = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail,
      items: orderItems,
      total,
      paymentMethod,
    });
    
    // Save the new order
    const savedOrder = await order.save();

    // Update the cart
    await Cart.findByIdAndUpdate(
      cart._id,
      {
        $set: {
          items: [],
          totalPrice: 0,
          enabled: false,
        },
      },
      { new: true }
    );

    return savedOrder;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw new Error("Failed to create order");
  }
}

async function getOrdersByUserId(userId: string): Promise<IOrder[]> {
  return await Order.find({ userId })
    .populate("userId", "email")
    .populate({
      path: "items.recordId",
      select: "TitleRecord title ImageRecord imageRecord",
      transform: (doc) => {
        if (!doc) return null;
        // Use the title and image fields that exist in the document
        return {
          _id: doc._id,
          title: doc.title || doc.TitleRecord || 'Unknown Title',
          image: doc.image || doc.imageRecord || doc.ImageRecord || null
        };
      }
    })
    .sort({ orderDate: -1 });
}

async function getAllOrders(): Promise<IOrder[]> {
  return await Order.find()
    .populate("userId", "email")
    .populate({
      path: "items.recordId",
      select: "TitleRecord title", // Include both possible title fields
      transform: (doc) => {
        if (!doc) return null;
        // Use the title field that exists in the document
        return {
          _id: doc._id,
          title: doc.title || doc.TitleRecord || 'Unknown Title'
        };
      }
    })
    .sort({ orderDate: -1 });
}

async function getOrderById(orderId: string): Promise<IOrder | null> {
  return await Order.findById(orderId)
    .populate("userId", "email")
    .populate({
      path: "items.recordId",
      select: "TitleRecord title ImageRecord imageRecord",
      transform: (doc) => {
        if (!doc) return null;
        return {
          _id: doc._id,
          title: doc.title || doc.TitleRecord || 'Unknown Title',
          image: doc.image || doc.imageRecord || doc.ImageRecord || null
        };
      }
    });
}

export default {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  getOrderById,
};
