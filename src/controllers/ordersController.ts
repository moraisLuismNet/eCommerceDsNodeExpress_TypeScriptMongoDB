import { Request, Response } from 'express';
import orderService from "../services/orderService";
import cartService from "../services/cartService";
import User from "../models/User";



async function createOrder(req: Request, res: Response) {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email parameter is required' });
    }

    const { paymentMethod = 'Credit Card' } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ userEmail: email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cart = await cartService.getCartByUserId(user._id.toString());
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot create an order from an empty cart.' 
            });
        }

        const order = await orderService.createOrder(user._id.toString(), user.userEmail, cart, paymentMethod);
        
        // Clear the cart after successful order creation
        await cartService.clearCart(user._id.toString());

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
        console.error('Error in createOrder:', error);
        return res.status(500).json({ success: false, message: errorMessage });
    }
}

async function getMyOrders(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
        const orders = await orderService.getOrdersByUserId(userId);
        return res.status(200).json({ success: true, data: orders });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve orders';
        return res.status(500).json({ success: false, message: errorMessage });
    }
}

async function getAllOrders(req: Request, res: Response) {
    // Admin-only route
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    try {
        const orders = await orderService.getAllOrders();
        return res.status(200).json({ success: true, data: orders });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve all orders';
        return res.status(500).json({ success: false, message: errorMessage });
    }
}

async function getOrderByEmail(req: Request, res: Response) {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email parameter is required' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ userEmail: email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get all orders for this user
        const orders = await orderService.getOrdersByUserId(user._id.toString());

        // Security check: regular users can only see their own orders
        if (req.user?.role !== 'Admin' && user._id.toString() !== req.user?.id) {
            return res.status(404).json({ success: false, message: 'No orders found' });
        }

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: 'No orders found for this user' });
        }

        return res.status(200).json({ success: true, data: orders });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve orders';
        console.error('Error in getOrderByEmail:', error);
        return res.status(500).json({ success: false, message: errorMessage });
    }
}


export default {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderByEmail,
};