import { Request, Response } from "express";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";

export const createOrGetChat = async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!chat) {
      chat = await Chat.create({ participants: [userId1, userId2] });
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar/obter chat", error: err });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, sender, receiver, content } = req.body;

    const message = await Message.create({
      chatId,
      sender,
      receiver,
      content,
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Erro ao enviar mensagem", error: err });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erro ao obter mensagens", error: err });
  }
};

export const getUserChats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name role")
      .populate("lastMessage");
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: "Erro ao obter chats", error: err });
  }
};
