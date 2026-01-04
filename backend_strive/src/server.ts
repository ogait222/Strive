import dotenv from "dotenv";
import cors from "cors";

const swaggerUi = require("swagger-ui-express");
import { swaggerSpec } from "./swagger/swagger";

import express from "express";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/authRoutes";
import workoutRoutes from "./routes/workoutRoutes";
import workoutLogRoutes from "./routes/workoutLogRoutes";
import workoutTemplateRoutes from "./routes/workoutTemplateRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import chatRoutes from "./routes/chatRoutes";
import changeTrainerRoutes from "./routes/changeTrainerRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec));


app.use("/auth", authRoutes);
app.use("/workouts", workoutRoutes);
app.use("/workout-logs", workoutLogRoutes);
app.use("/workout-templates", workoutTemplateRoutes);
app.use("/notifications", notificationRoutes);
app.use("/chats", chatRoutes);
app.use("/change-trainer", changeTrainerRoutes);
app.use("/users", userRoutes);

io.on("connection", (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} entrou na sala ${chatId}`);
  });

  socket.on("sendMessage", async (data) => {
    const { chatId, sender, receiver, content } = data;

    try {
      const Message = (await import("./models/Message")).Message;
      const Chat = (await import("./models/Chat")).Chat;

      const message = await Message.create({
        chatId,
        sender,
        receiver,
        content,
      });

      await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

      io.to(chatId).emit("newMessage", message);
    } catch (error) {
      console.error("Erro ao enviar mensagem via socket:", error);
      socket.emit("error", { message: "Erro ao enviar mensagem" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket desconectado: ${socket.id}`);
  });
});








const PORT = process.env.PORT || 3500;
const MONGO_URI = process.env.MONGO_URI as string;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado com sucesso");
    server.listen(PORT, () => {
      console.log(`Servidor a correr na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error);
  });

export default app;
