import express from 'express';
const router = express.Router();
import ordersController from '../controllers/ordersController';
import authMiddleware from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders/create/{email}:
 *   post:
 *     summary: Creates an order for a specific user's cart
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose cart will be used to create the order
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 default: 'Credit Card'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart is empty or user not found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/create/:email', authMiddleware(), ordersController.createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Gets all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all orders
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authMiddleware('Admin'), ordersController.getAllOrders);

/**
 * @swagger
 * /api/orders/{email}:
 *   get:
 *     summary: Gets all orders for a specific user by email
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose orders to retrieve
 *     responses:
 *       200:
 *         description: List of orders for the specified user
 *       400:
 *         description: Email parameter is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No orders found for this user
 */
router.get('/:email', authMiddleware(), ordersController.getOrderByEmail);


export default router;