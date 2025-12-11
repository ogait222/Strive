import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification,
} from "../controllers/notificationController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestão de notificações entre cliente e personal trainer
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         sender:
 *           type: string
 *           example: 65f4c0bd1a2b4e5d99a4e123
 *         receiver:
 *           type: string
 *           example: 65f4c0bd1a2b4e5d99a4e456
 *         message:
 *           type: string
 *           example: O cliente falhou o treino de hoje.
 *         type:
 *           type: string
 *           enum: [alert, message, system]
 *           example: alert
 *         read:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obter todas as notificações do utilizador autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get("/", verifyToken, getNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     summary: Marcar uma notificação como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *       404:
 *         description: Notificação não encontrada
 */
router.post(
  "/:id/read",
  verifyToken,
  authorizeRoles("admin", "user", "trainer"),
  markNotificationAsRead
);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Criar uma nova notificação (admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  createNotification
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Apagar uma notificação (admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação eliminada com sucesso
 *       404:
 *         description: Notificação não encontrada
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteNotification
);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Marcar todas as notificações como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 */
router.post(
  "/read-all",
  verifyToken,
  markAllNotificationsAsRead
);

export default router;
