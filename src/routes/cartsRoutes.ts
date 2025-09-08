import express from "express";
const router = express.Router();
import cartsController, { enableCartByEmail, disableCartByEmail } from "../controllers/cartsController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Shopping cart management for the authenticated user
 */

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Get all carts
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all carts
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware(), cartsController.getCarts);

/**
 * @swagger
 * /api/carts/add/{email}:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user who owns the cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recordId
 *               - amount
 *             properties:
 *               recordId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the record to add to the cart
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the record to add
 *     responses:
 *       200:
 *         description: Item added successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.post("/add/:email", authMiddleware(), cartsController.addItem);

/**
 * @swagger
 * /api/carts/remove/{email}:
 *   post:
 *     summary: Remove a specific amount of an item from the cart by user email
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose cart item is to be removed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recordId
 *               - amount
 *             properties:
 *               recordId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the record to remove from the cart
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the record to remove
 *     responses:
 *       200:
 *         description: Item removed successfully from cart
 *       400:
 *         description: Invalid request, missing parameters or invalid amount
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or item not found
 */
router.post(
  "/remove/:email",
  authMiddleware(),
  cartsController.removeItemFromCartByEmail
);

/**
 * @swagger
 * /api/carts/{email}:
 *   get:
 *     summary: Get a user's cart by email
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose cart is to be retrieved
 *     responses:
 *       200:
 *         description: User's cart details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found for the given email
 */
router.get("/:email", authMiddleware(), cartsController.getCartByEmail);

/**
 * @swagger
 * /api/carts/enable/{email}:
 *   post:
 *     summary: Enable a cart by user email
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose cart should be enabled
 *     responses:
 *       200:
 *         description: Cart enabled successfully
 *       400:
 *         description: Email parameter is required
 *       404:
 *         description: Cart not found for this email
 *       500:
 *         description: Server error
 */
router.post("/enable/:email", authMiddleware(), enableCartByEmail);

/**
 * @swagger
 * /api/carts/disable/{email}:
 *   post:
 *     summary: Disable a cart by user email
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email of the user whose cart should be disabled
 *     responses:
 *       200:
 *         description: Cart disabled successfully
 *       400:
 *         description: Email parameter is required
 *       404:
 *         description: Cart not found for this email
 *       500:
 *         description: Server error
 */
router.post("/disable/:email", authMiddleware(), disableCartByEmail);

export default router;
