import { Request, Response } from "express";
import WorkoutLog from "../models/WorkoutLog";

export const createWorkoutLog = async (req: Request, res: Response) => {
  try {
    const log = await WorkoutLog.create(req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: "Erro ao criar workout log", error });
  }
};


export const getWorkoutLogs = async (req: Request, res: Response) => {
  try {
    const { client, trainer } = req.query;

    const filters: any = {};
    if (client) filters.client = client;
    if (trainer) filters.personalTrainer = trainer;

    const logs = await WorkoutLog.find(filters)
      .populate("client", "name email")
      .populate("personalTrainer", "name email")
      .populate("workoutPlan", "title");

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar workout logs", error });
  }
};


export const getWorkoutLogById = async (req: Request, res: Response) => {
  try {
    const log = await WorkoutLog.findById(req.params.id)
      .populate("client")
      .populate("personalTrainer")
      .populate("workoutPlan");

    if (!log) return res.status(404).json({ message: "Log não encontrado" });

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter workout log", error });
  }
};


export const updateWorkoutLog = async (req: Request, res: Response) => {
  try {
    const log = await WorkoutLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!log) return res.status(404).json({ message: "Log não encontrado" });

    res.json(log);
  } catch (error) {
    res.status(400).json({ message: "Erro ao atualizar workout log", error });
  }
};


export const deleteWorkoutLog = async (req: Request, res: Response) => {
  try {
    const log = await WorkoutLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: "Log não encontrado" });

    res.json({ message: "Log eliminado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao eliminar workout log", error });
  }
};
