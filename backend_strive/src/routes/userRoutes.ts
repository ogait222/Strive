import { Router } from "express";
import { getTrainers, selectTrainer, getMe, getStudents, searchUsers, updateAvatar } from "../controllers/userController";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestão de utilizadores e treinadores
 */

/**
 * @swagger
 * /users/trainers:
 *   get:
 *     summary: Listar todos os treinadores disponíveis
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de treinadores
 */
router.get("/trainers", verifyToken, getTrainers);

/**
 * @swagger
 * /users/select-trainer:
 *   put:
 *     summary: Selecionar um treinador (para clientes sem treinador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trainerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Treinador selecionado com sucesso
 */
router.put("/select-trainer", verifyToken, authorizeRoles("client"), selectTrainer);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obter perfil do utilizador autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do utilizador
 */
router.get("/me", verifyToken, getMe);

/**
 * @swagger
 * /users/students:
 *   get:
 *     summary: Listar alunos do treinador autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alunos
 */
router.get("/students", verifyToken, authorizeRoles("trainer"), getStudents);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Pesquisar utilizadores por nome ou username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo de pesquisa
 *     responses:
 *       200:
 *         description: Lista de utilizadores encontrados
 */
router.get("/search", verifyToken, searchUsers);
router.put("/me/avatar", verifyToken, updateAvatar);


export default router;
