import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });
  return io;
};

export const getIo = () => io;
