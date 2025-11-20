import {Request , Response} from "express";
import ChangeTrainer  from "../models/ChangeTrainer";

export const requestTrainerChange = async (req: Request, res: Response) => {
  try {
    const { client, currentTrainer, requestedTrainer, reason } = req.body;

    if (!client || !currentTrainer || !requestedTrainer) {
      return res.status(400).json({ message: "Campos obrigatórios em falta." });
    }

    const existing = await ChangeTrainer.findOne({
      client,
      status: "pending",
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Já existe um pedido pendente para este cliente." });
    }

    const changeRequest = await ChangeTrainer.create({
      client,
      currentTrainer,
      requestedTrainer,
      reason,
    });

    res.status(201).json(changeRequest);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao solicitar troca de treinador", error });
  }
};

export const getAllTrainerChangeRequests = async (req: Request, res: Response) => {
    try {
        const { sort = "requestedAt", order = "desc" , client , currentTrainer, newTrainer, adminHandler , status } = req.query;

        const filter: any = {};
        if (client) filter.client = client;
        if (currentTrainer) filter.newTrainer = currentTrainer;
        if (newTrainer) filter.newTrainer = newTrainer;
        if (adminHandler) filter.adminHandler = adminHandler;
        if (status) filter.status = status;
        
        const requests = await ChangeTrainer.find(filter)
            .populate("client", "name email")
            .populate("currentTrainer", "name email")
            .populate("newTrainer", "name email")
            .populate("adminHandler", "name email")
            .sort({ [sort as string]: order === "asc" ? 1 : -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar solicitações de troca de treinador", error });
    }
};

export const getAllTrainerChangeRequestsByClient = async (req: Request, res: Response) => {
    try {
        const requests = await ChangeTrainer.find({ client: req.params.clientId })
            .populate("currentTrainer", "name email")
            .populate("newTrainer", "name email")
            .populate("adminHandler", "name email")
            .sort ({ createdAt: -1 });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ message: "Erro ao obter solicitações do cliente", error });
    }
};

export const updateTrainerChangeRequest = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const updated = await ChangeTrainer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Solicitação não encontrada" });

    if (status === "approved") {
      await ChangeTrainer.findByIdAndUpdate(updated.client, {
        trainer: updated.newTrainer,
      });
    }
    res.json(updated);
    
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar solicitação", error });
  }
};

export const deleteTrainerChangeRequest = async (req: Request, res: Response) => {
    try {
        const deleted = await ChangeTrainer.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Solicitação não encontrada" });
        res.json({ message: "Solicitação deletada com sucesso" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar solicitação", error });
    }
};

