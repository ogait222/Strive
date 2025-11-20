import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as crypto from "crypto";
import User, { UserDocument } from "../models/Users";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não está definido no .env");
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Email ou username já registado" });

    const newUser = new User({ name, username, email, password, role });
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
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user: UserDocument | null = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Utilizador não encontrado" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    res.json({
      message: "Token de reset gerado com sucesso.",
      resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao gerar token de reset", error });
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
