import express from "express";
import {
  createWorkoutPlan,
  getAllWorkoutPlans,
  getWorkoutPlansByClient,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  updateDayStatus,
  clearClientHistory,
  archiveWorkoutPlan,
} from "../controllers/workoutController";
import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Plans
 *   description: Gestão dos planos de treino personalizados
 *
 * components:
 *   schemas:
 *     WorkoutPlan:
 *       type: object
 *       required:
 *         - clientId
 *         - trainerId
 *         - weekSchedule
 *       properties:
 *         clientId:
 *           type: string
 *           example: 65f4d8e92f3b0b0012ba1234
 *         trainerId:
 *           type: string
 *           example: 65f4d93c2f3b0b0012ba5678
 *         weekSchedule:
 *           type: object
 *           description: Plano semanal com exercícios por dia
 *           example:
 *             Monday:
 *               - exercise: "Push-ups"
 *                 sets: 3
 *                 reps: 15
 *                 instructions: "Mantenha as costas retas"
 *                 videoUrl: "https://youtu.be/xyz"
 *             Tuesday: []
 *             Wednesday: []
 *             Thursday: []
 *             Friday: []
 *             Saturday: []
 *             Sunday: []
 *         sessionsPerWeek:
 *           type: integer
 *           minimum: 3
 *           maximum: 5
 *           example: 4
 *         notes:
 *           type: string
 *           example: "Focar no fortalecimento do core"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /workouts:
 *   post:
 *     summary: Criar um plano de treino
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutPlan'
 *     responses:
 *       201:
 *         description: Plano criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", verifyToken, authorizeRoles("admin", "trainer"), createWorkoutPlan);

/**
 * @swagger
 * /workouts:
 *   get:
 *     summary: Obter todos os planos de treino
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planos de treino
 */
router.get("/", verifyToken, authorizeRoles("admin", "trainer"), getAllWorkoutPlans);

/**
 * @swagger
 * /workouts/client/{clientId}:
 *   get:
 *     summary: Obter planos de treino por cliente
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Lista de planos do cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.get("/client/:clientId", verifyToken, authorizeRoles("admin", "trainer", "client"), getWorkoutPlansByClient);

/**
 * @swagger
 * /workouts/{id}:
 *   put:
 *     summary: Atualizar um plano de treino
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano a atualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutPlan'
 *     responses:
 *       200:
 *         description: Plano atualizado com sucesso
 *       404:
 *         description: Plano não encontrado
 */
router.put("/:id", verifyToken, authorizeRoles("admin", "trainer"), updateWorkoutPlan);

/**
 * @swagger
 * /workouts/{id}:
 *   delete:
 *     summary: Apagar um plano de treino
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano a apagar
 *     responses:
 *       200:
 *         description: Plano eliminado com sucesso
 *       404:
 *         description: Plano não encontrado
 */
router.delete("/:id", verifyToken, authorizeRoles("admin", "trainer"), deleteWorkoutPlan);

router.delete(
  "/client/:clientId/history",
  verifyToken,
  authorizeRoles("admin", "trainer", "client"),
  clearClientHistory
);

router.patch(
  "/:id/archive",
  verifyToken,
  authorizeRoles("admin", "trainer", "client"),
  archiveWorkoutPlan
);

/**
 * @swagger
 * /workouts/{id}/day/{dayId}/status:
 *   patch:
 *     summary: Atualizar status de um dia de treino
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do plano
 *       - in: path
 *         name: dayId
 *         required: true
 *         description: ID do dia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed]
 *               completionPhotoProof:
 *                 type: string
 *                 description: Prova fotográfica (obrigatória quando status=completed)
 *               failureReason:
 *                 type: string
 *                 description: Motivo da falha (obrigatório quando status=failed)
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.patch("/:id/day/:dayId/status", verifyToken, updateDayStatus);

export default router;
