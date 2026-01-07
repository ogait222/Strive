import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import User, { UserDocument } from "../models/Users";
import dotenv from "dotenv";
import { sendResetPasswordEmail } from "../utils/email";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definido no .env");
}

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      username,
      email,
      password,
      applyForTrainer,
      fullName,
      birthDate,
      certificateFile,
      idDocumentFile,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Email ou username já registado" });

    const trainerApplication = applyForTrainer
      ? {
          status: "pending",
          fullName: typeof fullName === "string" ? fullName.trim() : "",
          birthDate,
          certificateFile,
          idDocumentFile,
          submittedAt: new Date(),
        }
      : undefined;

    if (applyForTrainer) {
      if (
        !trainerApplication.fullName ||
        !birthDate ||
        !certificateFile ||
        !idDocumentFile
      ) {
        return res.status(400).json({ message: "Preenche todos os dados da candidatura a PT." });
      }

      const parsedDate = new Date(birthDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Data de nascimento inválida." });
      }

      trainerApplication.birthDate = parsedDate;
    }

    const newUser = new User({
      name,
      username,
      email,
      password,
      role: "client",
      trainerApplication,
    });
    await newUser.save();

    res.status(200).json({ message: "Utilizador criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao registar utilizador", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user: UserDocument | null = await User.findOne({ username });

    if (!user)
      return res.status(400).json({ message: "Credenciais inválidas" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Credenciais inválidas" });

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not defined" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const user: UserDocument | null = await User.findOne({ email: trimmedEmail });

    if (!user)
      return res.status(404).json({ message: "Utilizador não encontrado" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: "Erro ao enviar email de recuperação." });
    }

    res.json({ message: "Email de recuperação enviado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao processar recuperação de password", error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: "Token inválido ou expirado" });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao resetar password", error });
  }
};

export const generateQrLogin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Não autenticado" });

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      userId,
      { qrLoginToken: hashedToken, qrLoginExpires: expiresAt },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Utilizador não encontrado" });

    res.json({ token, expiresAt });
  } catch (error) {
    res.status(500).json({ message: "Erro ao gerar QR login", error });
  }
};

export const loginWithQr = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token inválido" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      qrLoginToken: hashedToken,
      qrLoginExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "QR inválido ou expirado" });
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login com QR", error });
  }
};
