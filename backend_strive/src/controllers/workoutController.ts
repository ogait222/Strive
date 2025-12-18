import { Request, Response } from "express";
import WorkoutPlan from "../models/WorkoutPlan";
import Notification from "../models/Notification";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}


export const createWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const plan = await WorkoutPlan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar plano de treino", error });
  }
};

export const getAllWorkoutPlans = async (req: Request, res: Response) => {
  try {
    const { sort = "createdAt", order = "desc", client, trainer } = req.query;

    const filter: any = {};
    if (client) filter.client = client;
    if (trainer) filter.trainer = trainer;

    const plans = await WorkoutPlan.find(filter)
      .populate("client trainer", "username email role")
      .sort({ [sort as string]: order === "asc" ? 1 : -1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar planos", error });
  }
};


export const getWorkoutPlansByClient = async (req: Request, res: Response) => {
  try {
    const plans = await WorkoutPlan.find({ client: req.params.clientId })
      .populate("trainer", "username email");
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter planos do cliente", error });
  }
};


export const updateWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const updated = await WorkoutPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Plano não encontrado" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar plano", error });
  }
};


export const deleteWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const deleted = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Plano não encontrado" });
    res.json({ message: "Plano eliminado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao eliminar plano", error });
  }
};

export const updateDayStatus = async (req: Request, res: Response) => {
  try {
    const { id, dayId } = req.params;
    const { status, completionPhotoProof } = req.body;

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const plan = await WorkoutPlan.findById(id);
    if (!plan) return res.status(404).json({ message: "Plano não encontrado" });

    // Encontrar o dia específico
    const day = plan.days.find((d: any) => d._id.toString() === dayId);
    if (!day) return res.status(404).json({ message: "Dia não encontrado no plano" });

    if (day.status && day.status !== "pending") {
      return res.status(400).json({ message: "O status deste dia já foi definido e não pode ser alterado." });
    }

    if (status === "completed" && !completionPhotoProof) {
      return res.status(400).json({ message: "É necessário enviar a prova fotográfica para concluir o treino." });
    }

    day.status = status;
    if (completionPhotoProof) {
      day.completionPhotoProof = completionPhotoProof;
    }

    // Verificar se todos os dias estão concluídos ou falhados
    const allDaysDone = plan.days.every(d => d.status !== 'pending' && d.status !== undefined);

    if (allDaysDone) {
      plan.active = false;
    }

    if (status === 'failed') {
      await Notification.create({
        recipient: plan.client,
        type: "missedWorkout", // or "message" if you prefer
        message: "Não desanimes! A persistência é o caminho do êxito. O próximo treino será melhor!",
        read: false,
      });
    }

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar status do dia", error });
  }
};

export const clearClientHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const requester = req.user;

    if (requester?.role === "client" && requester.id !== clientId) {
      return res.status(403).json({ message: "Não podes limpar o histórico de outro utilizador." });
    }

    const result = await WorkoutPlan.deleteMany({ client: clientId, active: false });
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Erro ao limpar histórico de treinos", error });
  }
};

export const archiveWorkoutPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requester = req.user;
    const plan = await WorkoutPlan.findById(id);
    if (!plan) return res.status(404).json({ message: "Plano não encontrado" });

    if (requester?.role === "client" && plan.client.toString() !== requester.id) {
      return res.status(403).json({ message: "Não podes arquivar planos de outro utilizador." });
    }

    if (plan.active !== false) {
      return res.status(400).json({ message: "Só podes arquivar planos concluídos." });
    }

    if (plan.archived) {
      return res.status(400).json({ message: "Plano já se encontra arquivado." });
    }

    plan.archived = true;
    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Erro ao arquivar plano", error });
  }
};
