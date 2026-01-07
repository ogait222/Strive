import { Router } from "express";
import {
  getTrainers,
  selectTrainer,
  getMe,
  getStudents,
  createStudent,
  createTrainer,
  searchUsers,
  updateAvatar,
  updatePassword,
  getUsers,
  updateTrainerApplicationStatus,
  updateUserRole,
  deleteUser,
} from "../controllers/userController";
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
router.post("/trainers", verifyToken, authorizeRoles("admin"), createTrainer);

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
 * /users/students:
 *   post:
 *     summary: Criar aluno associado ao treinador autenticado
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
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Aluno criado
 */
router.post("/students", verifyToken, authorizeRoles("trainer"), createStudent);

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
/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Atualizar password do utilizador autenticado
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
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password atualizada com sucesso
 *       400:
 *         description: Password atual incorreta ou inválida
 */
router.put("/me/password", verifyToken, updatePassword);
router.get("/", verifyToken, authorizeRoles("admin"), getUsers);
router.put("/:id/trainer-application", verifyToken, authorizeRoles("admin"), updateTrainerApplicationStatus);
router.put("/:id/role", verifyToken, authorizeRoles("admin"), updateUserRole);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteUser);


export default router;
