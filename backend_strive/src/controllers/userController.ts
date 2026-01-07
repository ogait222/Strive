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
        const user = await User.findById(userId)
            .select("-password")
            .populate("trainerId", "name username email avatarUrl");

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

export const createStudent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const trainerId = req.user?.id;
        if (!trainerId) return res.status(401).json({ message: "Não autenticado" });

        const { name, username, email, password } = req.body;
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "Nome, username, email e password são obrigatórios." });
        }

        const trimmedName = typeof name === "string" ? name.trim() : "";
        const trimmedUsername = typeof username === "string" ? username.trim() : "";
        const trimmedEmail = typeof email === "string" ? email.trim() : "";

        if (!trimmedName || !trimmedUsername || !trimmedEmail) {
            return res.status(400).json({ message: "Nome, username e email inválidos." });
        }

        const existingUser = await User.findOne({
            $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email ou username já registado" });
        }

        const newUser = new User({
            name: trimmedName,
            username: trimmedUsername,
            email: trimmedEmail,
            password,
            role: "client",
            trainerId,
        });

        await newUser.save();

        const userResponse = await User.findById(newUser._id).select("-password");
        res.status(201).json({ message: "Cliente criado com sucesso!", user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar cliente", error });
    }
}

export const createTrainer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        if (!adminId) return res.status(401).json({ message: "Não autenticado" });

        const { name, username, email, password } = req.body;
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "Nome, username, email e password são obrigatórios." });
        }

        const trimmedName = typeof name === "string" ? name.trim() : "";
        const trimmedUsername = typeof username === "string" ? username.trim() : "";
        const trimmedEmail = typeof email === "string" ? email.trim() : "";

        if (!trimmedName || !trimmedUsername || !trimmedEmail) {
            return res.status(400).json({ message: "Nome, username e email inválidos." });
        }

        const existingUser = await User.findOne({
            $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email ou username já registado" });
        }

        const newUser = new User({
            name: trimmedName,
            username: trimmedUsername,
            email: trimmedEmail,
            password,
            role: "trainer",
        });

        await newUser.save();

        const userResponse = await User.findById(newUser._id).select("-password");
        res.status(201).json({ message: "Personal trainer criado com sucesso!", user: userResponse });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar personal trainer", error });
    }
};

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

export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) return res.status(401).json({ message: "Não autenticado" });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Password atual e nova password são obrigatórias." });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "A nova password deve ser diferente da atual." });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: "A senha deve ter pelo menos 6 caracteres, incluindo letras maiúsculas, minúsculas e números.",
            });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "Password atual incorreta." });

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password atualizada com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar password", error });
    }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role, applicationStatus } = req.query;
        const filter: any = {};
        if (role) filter.role = role;
        if (applicationStatus) {
            filter["trainerApplication.status"] = applicationStatus;
        }

        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar utilizadores", error });
    }
};

export const updateTrainerApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Estado inválido." });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

        user.trainerApplication = {
            ...(user.trainerApplication || {}),
            status,
        };

        if (status === "approved") {
            user.role = "trainer";
        }

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar candidatura", error });
    }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["client", "trainer", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role inválida." });
        }

        const updated = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-password");

        if (!updated) return res.status(404).json({ message: "Utilizador não encontrado" });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar role", error });
    }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const deleted = await User.findByIdAndDelete(id).select("-password");
        if (!deleted) return res.status(404).json({ message: "Utilizador não encontrado" });

        res.json({ message: "Utilizador eliminado", user: deleted });
    } catch (error) {
        res.status(500).json({ message: "Erro ao eliminar utilizador", error });
    }
};
