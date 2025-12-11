import { Request, Response } from "express";
import User from "../models/Users";

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
        const { trainerId } = req.body;
        const userId = (req as any).user.id; // From verifyToken middleware

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

        // Verify if trainer exists
        const trainer = await User.findById(trainerId);
        if (!trainer || trainer.role !== "trainer") {
            return res.status(400).json({ message: "Treinador inválido" });
        }

        user.trainerId = trainerId;
        await user.save();

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
