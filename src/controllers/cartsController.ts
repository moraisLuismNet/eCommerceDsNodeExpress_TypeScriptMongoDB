import { Request, Response } from "express";
import cartService, { ICartService } from "../services/cartService";
import User from "../models/User";
import Cart from "../models/Cart";
import mongoose from "mongoose";

const typedCartService: ICartService = cartService;

async function getCart(req: Request, res: Response): Promise<Response> {
  // In a real app, you'd get the user ID from an auth token.
  // For now, we'll simulate it or expect it to be passed.
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const cart = await typedCartService.getCartByUserId(userId);
    if (!cart) {
      // If no cart, create one
      const newCart = await typedCartService.createCart(
        new mongoose.Types.ObjectId(userId)
      );
      return res.status(200).json({ success: true, data: newCart });
    }
    return res.status(200).json({ success: true, data: cart });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get cart";
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

async function addItem(req: Request, res: Response): Promise<Response> {
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const { recordId, amount } = req.body;
  const userEmail = req.params.email;

  if (
    !recordId ||
    !amount ||
    !mongoose.Types.ObjectId.isValid(recordId) ||
    amount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid Record ID and positive amount are required",
    });
  }

  if (!userEmail) {
    return res.status(400).json({
      success: false,
      message: "User email is required in the URL path",
    });
  }

  try {
    // Add item to cart with the provided email
    const updatedCart = await typedCartService.addItemToCart(
      userId,
      recordId,
      amount,
      userEmail
    );

    return res.status(200).json({
      success: true,
      data: updatedCart,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add item to cart";
    console.error("Error in addItem:", error);
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

async function removeItem(req: Request, res: Response): Promise<Response> {
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const { recordId } = req.params;
  if (!recordId || !mongoose.Types.ObjectId.isValid(recordId)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid Record ID is required" });
  }

  try {
    const updatedCart = await typedCartService.removeItemFromCart(
      userId,
      recordId
    );
    return res.status(200).json({ success: true, data: updatedCart });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to remove item from cart";
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

async function clearCart(req: Request, res: Response): Promise<Response> {
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const clearedCart = await typedCartService.clearCart(userId);
    return res.status(200).json({ success: true, data: clearedCart });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to clear cart";
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

async function getCarts(req: Request, res: Response): Promise<Response> {
  try {
    const carts = await typedCartService.getAllCarts();
    return res.status(200).json({ success: true, data: carts });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get carts";
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

async function removeItemFromCartByEmail(
  req: Request,
  res: Response
): Promise<Response> {
  const { email } = req.params;
  const { recordId, amount } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email parameter is required" });
  }

  if (
    !recordId ||
    !amount ||
    !mongoose.Types.ObjectId.isValid(recordId) ||
    amount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid Record ID and positive amount are required",
    });
  }

  try {
    const updatedCart = await typedCartService.removeItemFromCartByEmail(
      email,
      recordId,
      amount
    );
    return res.status(200).json({ success: true, data: updatedCart });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to remove item from cart";
    console.error("Error in removeItemFromCartByEmail:", error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

async function getCartByEmail(req: Request, res: Response): Promise<Response> {
  const { email } = req.params;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email parameter is required" });
  }

  try {
    const cart = await typedCartService.getCartByEmail(email);
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for this email" });
    }
    return res.status(200).json({ success: true, data: cart });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get cart by email";
    console.error("Error in getCartByEmail controller:", error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

// @ts-ignore
export const enableCartByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email parameter is required" });
  }

  try {
    const user = await User.findOne({ userEmail: email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      { $set: { enabled: true } },
      { new: true }
    );

    if (!updatedCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for this user" });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Cart enabled successfully",
      data: updatedCart 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to enable cart";
    console.error("Error in enableCartByEmail controller:", error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

// @ts-ignore
export const disableCartByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email parameter is required" });
  }

  try {
    const user = await User.findOne({ userEmail: email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this email" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      { $set: { enabled: false } },
      { new: true }
    );

    if (!updatedCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for this user" });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Cart disabled successfully",
      data: updatedCart 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to disable cart";
    console.error("Error in disableCartByEmail controller:", error);
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

export default {
  getCart,
  addItem,
  removeItem,
  clearCart,
  getCarts,
  removeItemFromCartByEmail,
  getCartByEmail,
  enableCartByEmail,
  disableCartByEmail,
};
