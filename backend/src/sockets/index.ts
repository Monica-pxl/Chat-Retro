import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";
import { PrismaClient } from "@prisma/client";
import { canJoinRoom } from "../helpers/roomAvailability";

const prisma = new PrismaClient();

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

    prisma.user.update({
      where: { id: userId },
      data: { estado: "en_linea" },
    }).catch(() => {});

    io.emit("online-users", Array.from(onlineUsers.keys()));

    // 🔴 desconexión
    socket.on("disconnect", () => {
      const userId = socket.user?.userId;

      if (!userId) return;

      console.log("🔴 Usuario desconectado:", userId);

      onlineUsers.delete(userId);

      prisma.user.update({
        where: { id: userId },
        data: {
          estado: "desconectado",
          ultima_conexion: new Date(),
        },
      }).catch(() => {});

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // 🚪 join-room
    socket.on("join-room", async (roomId: number) => {
      try {
        const sala = await prisma.sala.findUnique({
          where: { id: roomId },
        });

        if (!sala) {
          socket.emit("room-error", {
            message: "Sala no encontrada",
          });
          return;
        }

        if (!canJoinRoom(sala)) {
          socket.emit("room-error", {
            message: "La sala no está disponible ahora mismo",
          });
          return;
        }

        const roomName = `room-${roomId}`;

        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
        }

        socket.emit("joined-room", {
          roomId,
        });

      } catch {
        socket.emit("room-error", {
          message: "Error al unirse a la sala",
        });
      }
    });

    // 🚶 leave-room
    socket.on("leave-room", (roomId: number) => {

      const roomName = `room-${roomId}`;

      socket.leave(roomName);

      socket.emit("left-room", {
        roomId,
      });
    });

    // � private-message
    socket.on(
      "private-message",
      async ({ destinatarioId, contenido }: { destinatarioId: number; contenido: string }) => {
        const emisorId: number = socket.user?.userId;

        if (!emisorId || !destinatarioId || !contenido?.trim()) return;

        try {
          // Buscar o crear el chat privado
          let chat = await prisma.chatPrivado.findFirst({
            where: {
              OR: [
                { usuario1Id: emisorId, usuario2Id: destinatarioId },
                { usuario1Id: destinatarioId, usuario2Id: emisorId },
              ],
            },
          });

          if (!chat) {
            chat = await prisma.chatPrivado.create({
              data: { usuario1Id: emisorId, usuario2Id: destinatarioId },
            });
          }

          const mensaje = await prisma.mensajePrivado.create({
            data: {
              chatId: chat.id,
              emisorId,
              contenido: contenido.trim(),
              tipo: "texto",
            },
          });

          // Emitir solo al destinatario si está conectado
          const destinatarioSocketId = onlineUsers.get(destinatarioId);
          if (destinatarioSocketId) {
            io.to(destinatarioSocketId).emit("receive-private-message", {
              chatId: chat.id,
              emisorId,
              contenido: mensaje.contenido,
              fecha: mensaje.fecha_creacion.toISOString(),
            });
          }
        } catch {
          socket.emit("private-message-error", { message: "Error al enviar el mensaje privado" });
        }
      }
    );

    // �💬 send-message
    socket.on(
      "send-message",
      async ({ roomId, contenido }: { roomId: number; contenido: string }) => {

        const senderUserId = socket.user?.userId;

        if (!senderUserId) return;

        if (!roomId) return;

        if (!contenido.trim()) {
          socket.emit("room-error", {
            message: "El mensaje está vacío",
          });
          return;
        }

        if (contenido.length > 1000) {
          socket.emit("room-error", {
            message: "El mensaje supera el máximo permitido",
          });
          return;
        }

        const roomName = `room-${roomId}`;

        if (!socket.rooms.has(roomName)) {
          socket.emit("room-error", {
            message: "No perteneces a esta sala",
          });
          return;
        }

        try {
          await prisma.mensajeSala.create({
            data: {
              salaId: roomId,
              userId: senderUserId,
              contenido: contenido.trim(),
              tipo: "texto",
            },
          });
        } catch {
          socket.emit("room-error", {
            message: "Error al guardar el mensaje",
          });
          return;
        }

        io.to(roomName).emit("receive-message", {
          roomId,
          userId: senderUserId,
          contenido: contenido.trim(),
          fecha: new Date().toISOString(),
        });

      }
    );
  });
}