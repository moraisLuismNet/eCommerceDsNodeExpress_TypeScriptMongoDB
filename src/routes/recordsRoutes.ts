import express from "express";
const router = express.Router();
import recordsController from "../controllers/recordsController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Disk management
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Gets all records
 *     tags: [Records]
 *     responses:
 *       200:
 *         description: List of records
 */
router.get('/', recordsController.getRecords); 

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Gets a record by ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       200:
 *         description: Record details
 */
router.get('/:id', recordsController.getRecordById); 

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Deletes a record by ID
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       204:
 *         description: Record deleted successfully
 */
router.delete('/:id', authMiddleware('Admin'), recordsController.deleteRecord); 

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Creates a new record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *       - application/x-www-form-urlencoded
 *     parameters:
 *       - in: formData
 *         name: title
 *         type: string
 *         required: true
 *         description: Título del disco
 *       - in: formData
 *         name: yearOfPublication
 *         type: integer
 *         required: true
 *         description: Año de publicación
 *       - in: formData
 *         name: price
 *         type: number
 *         required: true
 *         description: Precio del disco
 *       - in: formData
 *         name: stock
 *         type: integer
 *         required: true
 *         description: Cantidad en inventario
 *       - in: formData
 *         name: discontinued
 *         type: boolean
 *         required: false
 *         default: false
 *         description: Indica si el disco está descatalogado
 *       - in: formData
 *         name: Group
 *         type: string
 *         required: true
 *         description: ID del grupo musical al que pertenece
 *       - in: formData
 *         name: imageRecord
 *         type: string
 *         required: false
 *         description: URL de la imagen de la portada (también se acepta imageUrl)
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
import multer from 'multer';
const upload = multer();
router.post('/', 
  authMiddleware('Admin'), 
  upload.none(), // This will handle both multipart/form-data and urlencoded
  recordsController.createRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Updates an existing record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nuevo título del disco (opcional)
 *               yearOfPublication:
 *                 type: integer
 *                 description: Nuevo año de publicación (opcional)
 *               price:
 *                 type: number
 *                 description: Nuevo precio (opcional)
 *               stock:
 *                 type: integer
 *                 description: Nueva cantidad en inventario (opcional)
 *               discontinued:
 *                 type: boolean
 *                 default: false
 *                 description: Actualizar estado de descatalogado (opcional, por defecto false)
 *               GroupId:
 *                 type: string
 *                 description: Nuevo ID del grupo musical (opcional)
 *               imageUrl:
 *                 type: string
 *                 description: Nueva URL de la imagen de la portada en la nube (opcional)
 *     responses:
 *       200:
 *         description: Record updated successfully
 */
router.put('/:id', authMiddleware('Admin'), recordsController.updateRecord);

/**
 * @swagger
 * /api/records/{id}/updateStock/{amount}:
 *   put:
 *     summary: Updates the stock of a record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *       - in: path
 *         name: amount
 *         required: true
 *         description: Amount to add or subtract from the stock
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid amount
 */
router.put('/:id/updateStock/:amount', recordsController.updateStock);

export default router ;