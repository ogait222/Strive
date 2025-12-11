import { Router } from "express";
import {
  createOrGetChat,
  sendMessage,
  getMessages,
  getMessages,
  getUserChats,
  markMessagesAsRead,
} from "../controllers/chatController";

const router = Router();


/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API para gestão de chats e mensagens
 */

/**
 * @swagger
 * /chats/create:
 *   post:
 *     summary: Criar ou obter chat entre dois utilizadores
 *     tags: [Chat]
 *     requestBody:
 *       description: IDs dos utilizadores para criar/obter chat
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId1:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcde"
 *               userId2:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcdf"
 *     responses:
 *       200:
 *         description: Chat criado ou existente retornado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       500:
 *         description: Erro ao criar/obter chat
 */

router.post("/create", createOrGetChat);

/**
 * @swagger
 * /chats/message:
 *   post:
 *     summary: Enviar mensagem num chat
 *     tags: [Chat]
 *     requestBody:
 *       description: Dados da mensagem a enviar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcd0"
 *               sender:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcde"
 *               receiver:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcdf"
 *               content:
 *                 type: string
 *                 example: "Olá, como estás?"
 *     responses:
 *       201:
 *         description: Mensagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: Erro ao enviar mensagem
 */
router.post("/message", sendMessage);

/**
 * @swagger
 * /chats/{chatId}/messages:
 *   get:
 *     summary: Obter todas as mensagens de um chat
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do chat
 *     responses:
 *       200:
 *         description: Lista de mensagens do chat
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Erro ao obter mensagens
 */

router.get("/:chatId/messages", getMessages);

/**
 * @swagger
 * /chats/user/{userId}:
 *   get:
 *     summary: Obter todos os chats de um utilizador
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do utilizador
 *     responses:
 *       200:
 *         description: Lista de chats do utilizador
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       500:
 *         description: Erro ao obter chats
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID do chat
 *           example: "64f9a3c5a1234567890abcde"
 *         participants:
 *           type: array
 *           description: Lista de utilizadores participantes no chat
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "64f9a3c5a1234567890abcde"
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               role:
 *                 type: string
 *                 example: "user"
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-02T12:00:00Z"
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID da mensagem
 *           example: "64f9a3c5a1234567890abcd0"
 *         chatId:
 *           type: string
 *           example: "64f9a3c5a1234567890abcde"
 *         sender:
 *           type: string
 *           example: "64f9a3c5a1234567890abcde"
 *         receiver:
 *           type: string
 *           example: "64f9a3c5a1234567890abcdf"
 *         content:
 *           type: string
 *           example: "Olá, tudo bem?"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T12:01:00Z" */

router.get("/user/:userId", getUserChats);

/**
 * @swagger
 * /chats/{chatId}/read:
 *   put:
 *     summary: Marcar mensagens de um chat como lidas
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mensagens marcadas como lidas
 */
// Using verifyToken middleware implicitly assumed or should be added if not global. 
// However, the controller uses (req as any).user.id which suggests verifyToken IS needed.
// IMPORTANT: I must import verifyToken in this file if I use it. 
// Looking at the file content from previous view_file (Step 19), I don't see verifyToken imported.
// But looking at other route files (e.g. userRoutes), it is imported.
// Let me check if verifyToken is imported in chatRoutes (Step 19 output showed imports).
// Step 19 output: import { Router } from "express"; ... no verifyToken.
// I need to import verifyToken.

router.put("/:chatId/read", require("../middlewares/authMiddleware").verifyToken, markMessagesAsRead);

export default router;


