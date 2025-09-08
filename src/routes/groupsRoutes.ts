import express from "express";
const router = express.Router();
import groupsController from "../controllers/groupsController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Management of musical groups
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Gets all musical groups
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get("/", groupsController.getGroups);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Gets a group by ID with its records
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       200:
 *         description: Group with records
 */
router.get("/:id", groupsController.getGroupWithRecords);

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Crea un nuevo grupo
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - nameGroup
 *               - musicGenre
 *             properties:
 *               nameGroup:
 *                 type: string
 *                 description: Nombre del grupo musical
 *               musicGenre:
 *                 type: string
 *                 description: ID del género musical al que pertenece
 *               imageUrl:
 *                 type: string
 *                 description: URL de la imagen del grupo (opcional)
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post(
  "/",
  authMiddleware("Admin"),
  groupsController.createGroup
);

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Actualiza un grupo existente
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID del grupo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               nameGroup:
 *                 type: string
 *                 description: Nuevo nombre del grupo (opcional)
 *               musicGenre:
 *                 type: string
 *                 description: Nuevo ID del género musical (opcional)
 *               imageUrl:
 *                 type: string
 *                 description: Nueva URL de la imagen del grupo (opcional)
 *     responses:
 *       200:
 *         description: Group updated successfully
 */
router.put(
  "/:id",
  authMiddleware("Admin"),
  groupsController.updateGroup
);

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Deletes a group
 *     tags: [Groups]
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
 *         description: Group deleted successfully
 */
router.delete("/:id", authMiddleware("Admin"), groupsController.deleteGroup);

export default router;
