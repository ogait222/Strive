import { Router } from "express";
import {
  requestTrainerChange,
  getAllTrainerChangeRequests,
  getAllTrainerChangeRequestsByClient,
  updateTrainerChangeRequest,
  deleteTrainerChangeRequest
} from "../controllers/changeTrainerController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TrainerChange
 *   description: Gestão de pedidos de mudança de Personal Trainer
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TrainerChangeRequest:
 *       type: object
 *       required:
 *         - clientId
 *         - currentTrainerId
 *         - requestedTrainerId
 *         - reason
 *       properties:
 *         clientId:
 *           type: string
 *           example: 65f4b3f2e4a9d3a21c8f1234
 *         currentTrainerId:
 *           type: string
 *           example: 65f4b4eae4a9d3a21c8f5678
 *         requestedTrainerId:
 *           type: string
 *           example: 65f4b50ae4a9d3a21c8f9876
 *         reason:
 *           type: string
 *           example: Quero mudar porque os horários não são compatíveis.
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: pending
 */

/**
 * @swagger
 * /change-trainer/request:
 *   post:
 *     summary: Criar um pedido de mudança de personal trainer
 *     tags: [TrainerChange]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainerChangeRequest'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Erro ao criar pedido
 */
router.post("/request", requestTrainerChange);

/**
 * @swagger
 * /change-trainer/request:
 *   get:
 *     summary: Obter todos os pedidos de mudança (ADMIN)
 *     tags: [TrainerChange]
 *     responses:
 *       200:
 *         description: Lista de pedidos de mudança
 */
router.get("/request", getAllTrainerChangeRequests);

/**
 * @swagger
 * /change-trainer/request/{id}:
 *   get:
 *     summary: Obter todos os pedidos feitos por um cliente
 *     tags: [TrainerChange]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Lista de pedidos feitos por este cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.get("/request/:id", getAllTrainerChangeRequestsByClient);

/**
 * @swagger
 * /change-trainer/request/{id}:
 *   put:
 *     summary: Atualizar o estado de um pedido (ADMIN)
 *     tags: [TrainerChange]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido de mudança
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.put("/request/:id", updateTrainerChangeRequest);

/**
 * @swagger
 * /change-trainer/request/{id}:
 *   delete:
 *     summary: Eliminar um pedido de mudança de personal trainer
 *     tags: [TrainerChange]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido eliminado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
router.delete("/request/:id", deleteTrainerChangeRequest);

export default router;
