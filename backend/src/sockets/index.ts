import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";
import { PrismaClient } from "@prisma/client";
import { canJoinRoom } from "../helpers/roomAvailability";
import { setRoomCount, getRoomCount } from "../helpers/roomStore";
import { addUserSocket, removeUserSocket, getOnlineUserIds, emitToUser } from "../helpers/socketStore";

const prisma = new PrismaClient();

interface AuthSocket extends Socket {
  user?: any;
}

async function emitRoomUsers(io: Server, roomId: number, roomName: string) {
  try {
    const roomSockets = await io.in(roomName).fetchSockets();
    const userIds: number[] = [];
    for (const sock of roomSockets) {
      const userId = (sock as any).user?.userId;
      if (userId) userIds.push(userId);
    }

    if (userIds.length === 0) {
      io.to(roomName).emit("room-users", { users: [] });
      return;
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatar: true },
    });

    io.to(roomName).emit("room-users", { users });
  } catch (error) {
    console.error("Error al obtener usuarios de la sala:", error);
  }
}

export const socketHandler = (io: Server) => {

  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Token requerido"));
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.user?.userId;
    if (!userId) return;

    console.log("🟢 Usuario conectado:", userId);
    addUserSocket(userId, socket.id);

    prisma.user.update({
      where: { id: userId },
      data: { estado: "en_linea" },
    }).catch(() => {});

    io.emit("online-users", getOnlineUserIds());

    socket.on("disconnecting", () => {
      for (const roomName of socket.rooms) {
        if (roomName.startsWith("room-")) {
          const roomId = Number(roomName.replace("room-", ""));
          const currentSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 1;
          const newCount = Math.max(0, currentSize - 1);
          setRoomCount(roomId, newCount);
          io.to(roomName).emit("room-user-count", { count: newCount });
          emitRoomUsers(io, roomId, roomName);
        }
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.user?.userId;
      if (!userId) return;
      console.log("🔴 Usuario desconectado:", userId);
      removeUserSocket(userId, socket.id);
      if (!getOnlineUserIds().includes(userId)) {
        prisma.user.update({
          where: { id: userId },
          data: { estado: "desconectado" },
        }).catch(() => {});
      }
      io.emit("online-users", getOnlineUserIds());
    });

    // 🚪 JOIN ROOM - BLOQUEADO SI ESTÁ SUSPENDIDO (NO ENTRA NI UN POCO)
    socket.on("join-room", async (roomId: number) => {
      try {
        // 🔥 BLOQUEO DURO
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.estado_cuenta === 'suspendida') {
          socket.emit("room-error", {
            message: "Cuenta suspendida. No puedes unirte a salas.",
          });
          return; // 🔥 SE CORTA AQUÍ, NO ENTRA
        }

        const sala = await prisma.sala.findUnique({ where: { id: roomId } });
        if (!sala) {
          socket.emit("room-error", { message: "Sala no encontrada" });
          return;
        }
        if (sala.cerrada) {
          socket.emit("room-error", { message: "Esta sala está cerrada" });
          return;
        }
        if (!canJoinRoom(sala)) {
          socket.emit("room-error", { message: "La sala no está disponible ahora mismo" });
          return;
        }

        const roomName = `room-${roomId}`;
        if (!socket.rooms.has(roomName)) socket.join(roomName);
        socket.emit("joined-room", { roomId });

        const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 1;
        setRoomCount(roomId, roomSize);
        io.to(roomName).emit("room-user-count", { count: roomSize });
        await emitRoomUsers(io, roomId, roomName);

      } catch {
        socket.emit("room-error", { message: "Error al unirse a la sala" });
      }
    });

    socket.on("leave-room", (roomId: number) => {
      const roomName = `room-${roomId}`;
      socket.leave(roomName);
      socket.emit("left-room", { roomId });
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
      setRoomCount(roomId, roomSize);
      io.to(roomName).emit("room-user-count", { count: roomSize });
      emitRoomUsers(io, roomId, roomName);
    });

    // 💬 SEND MESSAGE - BLOQUEADO SI ESTÁ SUSPENDIDO
    socket.on("send-message", async ({ roomId, contenido, tipo }) => {
      const senderUserId = socket.user?.userId;
      if (!senderUserId || !roomId || !contenido) return;
      if (tipo == "texto" && contenido.length > 1000) {
        socket.emit("room-error", { message: "El mensaje supera el máximo permitido" });
        return;
      }

      // 🔥 BLOQUEO DURO ANTES DE GUARDAR
      const sender = await prisma.user.findUnique({ where: { id: senderUserId } });
      if (sender?.estado_cuenta === 'suspendida') {
        socket.emit("room-error", { message: "Cuenta suspendida. No puedes enviar mensajes." });
        return;
      }

      const roomName = `room-${roomId}`;
      if (!socket.rooms.has(roomName)) {
        socket.emit("room-error", { message: "No perteneces a esta sala" });
        return;
      }

      try {
        await prisma.mensajeSala.create({
          data: { salaId: roomId, userId: senderUserId, contenido, tipo },
        });
      } catch {
        socket.emit("room-error", { message: "Error al guardar el mensaje" });
        return;
      }

      const usuario = await prisma.user.findUnique({
        where: { id: senderUserId },
        select: { id: true, nickname: true, avatar: true },
      });

      io.to(roomName).emit("receive-message", {
        roomId,
        user: usuario,
        contenido,
        tipo,
        fecha: new Date().toISOString(),
      });
    });

    // 💬 PRIVATE MESSAGE - BLOQUEADO SI ESTÁ SUSPENDIDO
    socket.on("private-message", async ({ destinatarioId, contenido, tipo }) => {
      const emisorId: number = socket.user?.userId;
      if (!emisorId || !destinatarioId || !contenido?.trim()) return;
      const tipoValido = (tipo === "imagen" || tipo === "gif" || tipo === "audio") ? tipo : "texto";

      // 🔥 BLOQUEO DURO ANTES DE GUARDAR
      const emisor = await prisma.user.findUnique({ where: { id: emisorId } });
      if (emisor?.estado_cuenta === 'suspendida') {
        socket.emit("private-message-error", { message: "Cuenta suspendida. No puedes enviar mensajes." });
        return; // 🔥 SE CORTA AQUÍ, NO SE GUARDA EN LA BD
      }

      try {
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
            tipo: tipoValido as any,
          },
        });

        const emisorData = await prisma.user.findUnique({
          where: { id: emisorId },
          select: { id: true, nickname: true, avatar: true },
        });

        socket.emit("receive-private-message", {
          chatId: chat.id,
          user: emisorData,
          destinatarioId,
          contenido: mensaje.contenido,
          tipo: tipoValido,
          fecha: mensaje.fecha_creacion.toISOString(),
        });

        emitToUser(destinatarioId, "receive-private-message", {
          chatId: chat.id,
          user: emisorData,
          destinatarioId,
          contenido: mensaje.contenido,
          tipo: tipoValido,
          fecha: mensaje.fecha_creacion.toISOString(),
        });
      } catch {
        socket.emit("private-message-error", { message: "Error al enviar el mensaje privado" });
      }
    });
  });
};