import express from "express";
import {
  createWorkoutLog,
  getWorkoutLogs,
  getWorkoutLogById,
  updateWorkoutLog,
  deleteWorkoutLog,
} from "../controllers/workoutLogController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Logs
 *   description: Registo de treinos realizados pelos utilizadores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkoutLog:
 *       type: object
 *       required:
 *         - user
 *         - workout
 *         - date
 *       properties:
 *         user:
 *           type: string
 *           example: 65f4d8e92f3b0b0012ba1234
 *         workout:
 *           type: string
 *           example: 65f4d93c2f3b0b0012ba5678
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-02-20"
 *         completedExercises:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               exercise:
 *                 type: string
 *                 example: "Push-ups"
 *               reps:
 *                 type: number
 *                 example: 15
 *               sets:
 *                 type: number
 *                 example: 3
 *               weight:
 *                 type: number
 *                 example: 0
 *               notes:
 *                 type: string
 *                 example: "Última série muito difícil"
 *         notes:
 *           type: string
 *           example: "Treino correu bem mas senti fadiga"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /workout-logs:
 *   post:
 *     summary: Criar um novo registo de treino
 *     tags: [Workout Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutLog'
 *     responses:
 *       201:
 *         description: Registo criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", createWorkoutLog);

/**
 * @swagger
 * /workout-logs:
 *   get:
 *     summary: Obter todos os registos de treino
 *     tags: [Workout Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registos
 */
router.get("/", getWorkoutLogs);

/**
 * @swagger
 * /workout-logs/{id}:
 *   get:
 *     summary: Obter um registo de treino por ID
 *     tags: [Workout Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do registo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registo encontrado
 *       404:
 *         description: Registo não encontrado
 */
router.get("/:id", getWorkoutLogById);

/**
 * @swagger
 * /workout-logs/{id}:
 *   put:
 *     summary: Atualizar um registo de treino
 *     tags: [Workout Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do registo
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutLog'
 *     responses:
 *       200:
 *         description: Registo atualizado
 *       404:
 *         description: Registo não encontrado
 */
router.put("/:id", updateWorkoutLog);

/**
 * @swagger
 * /workout-logs/{id}:
 *   delete:
 *     summary: Apagar um registo de treino
 *     tags: [Workout Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do registo
 *     responses:
 *       200:
 *         description: Registo eliminado
 *       404:
 *         description: Registo não encontrado
 */
router.delete("/:id", deleteWorkoutLog);

export default router;
