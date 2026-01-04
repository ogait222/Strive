import { Request, Response } from "express";
import WorkoutTemplate from "../models/WorkoutTemplate";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const createWorkoutTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const { title, description, days } = req.body;
    const template = await WorkoutTemplate.create({
      trainer: trainerId,
      title,
      description,
      days,
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: "Erro ao guardar modelo de treino", error });
  }
};

export const getWorkoutTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const templates = await WorkoutTemplate.find({ trainer: trainerId }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar modelos de treino", error });
  }
};

export const deleteWorkoutTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const { id } = req.params;
    const template = await WorkoutTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Modelo não encontrado" });
    }

    if (template.trainer.toString() !== trainerId) {
      return res.status(403).json({ message: "Não podes eliminar este modelo." });
    }

    await template.deleteOne();
    res.json({ message: "Modelo eliminado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao eliminar modelo de treino", error });
  }
};
