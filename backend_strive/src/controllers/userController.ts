import { Request, Response } from "express";
import User from "../models/Users";
interface AuthenticatedRequest extends Request {
    user?: { id: string; role: string };
}
import Notification from "../models/Notification";

export const getTrainers = async (req: Request, res: Response) => {
    try {
        const trainers = await User.find({ role: "trainer" }).select("-password");
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar treinadores", error });
    }
};

export const selectTrainer = async (req: Request, res: Response) => {
    try {
        const { trainerId, reason } = req.body;
        const userId = (req as any).user.id; // From verifyToken middleware

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

        // Verify if trainer exists
        const trainer = await User.findById(trainerId);
        if (!trainer || trainer.role !== "trainer") {
            return res.status(400).json({ message: "Treinador inválido" });
        }

        const previousTrainerId = user.trainerId?.toString();
        if (previousTrainerId === trainerId) {
            return res.status(400).json({ message: "Já estás associado a este treinador." });
        }

        user.trainerId = trainerId;
        await user.save();

        // Notify previous trainer, if any
        if (previousTrainerId) {
            const reasonText = reason && typeof reason === "string" && reason.trim().length > 0
                ? reason.trim()
                : "Motivo não indicado";

            await Notification.create({
                recipient: previousTrainerId,
                type: "changeTrainer",
                message: `${user.username || user.email} deixou de ser teu aluno. Motivo: ${reasonText}`,
                read: false,
            });
        }

        res.json({ message: "Treinador selecionado com sucesso", user });
    } catch (error) {
        res.status(500).json({ message: "Erro ao selecionar treinador", error });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findById(userId).select("-password").populate("trainerId", "name username email");

        if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar perfil", error });
    }
}


export const getStudents = async (req: Request, res: Response) => {
    try {
        const trainerId = (req as any).user.id;
        const students = await User.find({ trainerId: trainerId, role: "client" }).select("-password");
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar alunos", error });
    }
}

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const currentUserId = (req as any).user.id;

        if (!query) {
            return res.status(400).json({ message: "Termo de pesquisa necessário" });
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Don't show myself
                {
                    $or: [
                        { name: { $regex: query, $options: "i" } },
                        { username: { $regex: query, $options: "i" } }
                    ]
                }
            ]
        }).select("name username role");

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erro ao pesquisar utilizadores", error });
    }
};

export const updateAvatar = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { avatarUrl } = req.body;

        if (!userId) return res.status(401).json({ message: "Não autenticado" });
        if (!avatarUrl) return res.status(400).json({ message: "avatarUrl obrigatório" });

        const updated = await User.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        ).select("-password");

        if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar avatar", error });
    }
};
