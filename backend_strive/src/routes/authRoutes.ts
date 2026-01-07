import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  generateQrLogin,
  loginWithQr,
} from "../controllers/authController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação e recuperação de password
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           example: Joao Silva
 *         email:
 *           type: string
 *           example: joao@example.com
 *         password:
 *           type: string
 *           example: 123456
 *         role:
 *           type: string
 *           enum: [client, trainer, admin]
 *           example: client
 *
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: tiago@example.com
 *         password:
 *           type: string
 *           example: 123456
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           example: tiago@example.com
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - newPassword
 *       properties:
 *         newPassword:
 *           type: string
 *           example: novapassword123
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registar um novo utilizador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: Utilizador registado com sucesso
 *       400:
 *         description: Erro no registo
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de utilizador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperação de password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Email de recuperação enviado
 *       404:
 *         description: Utilizador não encontrado
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Redefinir password com token de recuperação
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token de recuperação enviado ao email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post("/reset-password/:token", resetPassword);
router.post("/qr", verifyToken, generateQrLogin);
router.post("/qr/login", loginWithQr);

export default router;
