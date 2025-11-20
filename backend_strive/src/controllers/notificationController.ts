import { Request, Response } from "express";
import Notification from "../models/Notification";


export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const filter = user.role === "admin" ? {} : { recipient: user.id };

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar notificações", error });
  }
};


export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notificação não encontrada" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar notificação", error });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { recipient, type, message } = req.body;

    if (!recipient || !type || !message) {
      return res.status(400).json({ message: "Campos obrigatórios em falta" });
    }

    const newNotification = await Notification.create({
      recipient,
      type,
      message,
      read: false,
    });

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar notificação", error });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notificação não encontrada" });
    }

    res.json({ message: "Notificação eliminada com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao eliminar notificação", error });
  }
};
