import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

const onlineUsers = new Map<number, string>();

interface AuthSocket extends Socket {
  user?: any;
}

export const socketHandler = (io: Server) => {

  // 🔐 JWT middleware
  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Token requerido"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;

      next();
    } catch {
      return next(new Error("Token inválido"));
    }
  });

  // 🟢 conexión
  io.on("connection", (socket: AuthSocket) => {

    const userId = socket.user?.userId;

    if (!userId) return;

    console.log("🟢 Usuario conectado:", userId);

    onlineUsers.set(userId, socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));

    // 🔴 desconexión
    socket.on("disconnect", () => {
      const userId = socket.user?.userId;

      if (!userId) return;

      console.log("🔴 Usuario desconectado:", userId);

      onlineUsers.delete(userId);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });
};