import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";
import { PrismaClient } from "@prisma/client";
import { canJoinRoom } from "../helpers/roomAvailability";
import { setRoomCount, getRoomCount } from "../helpers/roomStore";

const prisma = new PrismaClient();

const onlineUsers = new Map<number, string>();

interface AuthSocket extends Socket {
  user?: any;
}

/**
 * 🔥 NUEVA FUNCIÓN: Obtiene los usuarios conectados a una sala y emite la lista
 */
async function emitRoomUsers(io: Server, roomId: number, roomName: string) {
  try {
    // Obtener los sockets en la sala
    const roomSockets = await io.in(roomName).fetchSockets();

    // Obtener los userIds de los sockets
    const userIds: number[] = [];
    for (const sock of roomSockets) {
      const userId = (sock as any).user?.userId;
      if (userId) {
        userIds.push(userId);
      }
    }

    if (userIds.length === 0) {
      io.to(roomName).emit("room-users", { users: [] });
      return;
    }

    // Buscar los usuarios en la base de datos
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });

    io.to(roomName).emit("room-users", { users });
  } catch (error) {
    console.error("Error al obtener usuarios de la sala:", error);
  }
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

    // 🔴 disconnecting: el socket AÚN está en las salas
    socket.on("disconnecting", () => {
      for (const roomName of socket.rooms) {
        if (roomName.startsWith("room-")) {
          const roomId = Number(roomName.replace("room-", ""));
          const currentSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 1;
          const newCount = Math.max(0, currentSize - 1);
          setRoomCount(roomId, newCount);
          io.to(roomName).emit("room-user-count", { count: newCount });
          
          // 🔥 ACTUALIZAR LISTA DE USUARIOS
          emitRoomUsers(io, roomId, roomName);
        }
      }
    });

    // 🔴 disconnect: socket.rooms ya está vacío aquí
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

    // 🚪 join-room - CORREGIDO
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

        if (sala.cerrada) {
          socket.emit("room-error", {
            message: "Esta sala está cerrada",
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

        // 🔥 1. UNIRSE PRIMERO
        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
        }

        // 🔥 2. EMITIR QUE SE UNIÓ
        socket.emit("joined-room", { roomId });

        // 🔥 3. CALCULAR TAMAÑO REAL Y EMITIR A TODOS
        const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 1;
        setRoomCount(roomId, roomSize);
        io.to(roomName).emit("room-user-count", { count: roomSize });

        // 🔥 4. ENVIAR LA LISTA DE USUARIOS EN LA SALA
        await emitRoomUsers(io, roomId, roomName);

      } catch {
        socket.emit("room-error", {
          message: "Error al unirse a la sala",
        });
      }
    });

    // 🚶 leave-room - CORREGIDO
    socket.on("leave-room", (roomId: number) => {

      const roomName = `room-${roomId}`;

      // 🔥 1. SALIR PRIMERO
      socket.leave(roomName);

      // 🔥 2. EMITIR QUE SALIÓ
      socket.emit("left-room", { roomId });

      // 🔥 3. CALCULAR TAMAÑO REAL Y EMITIR A LOS QUE QUEDAN
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
      setRoomCount(roomId, roomSize);
      io.to(roomName).emit("room-user-count", { count: roomSize });

      // 🔥 4. ACTUALIZAR LA LISTA DE USUARIOS
      emitRoomUsers(io, roomId, roomName);
    });

    // 💬 private-message
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

          const emisor = await prisma.user.findUnique({
            where: { id: emisorId },
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          });

          // Emitir solo al destinatario si está conectado
          const destinatarioSocketId = onlineUsers.get(destinatarioId);
          if (destinatarioSocketId) {
            io.to(destinatarioSocketId).emit("receive-private-message", {
              chatId: chat.id,
              user: emisor,
              contenido: mensaje.contenido,
              fecha: mensaje.fecha_creacion.toISOString(),
            });
          }
        } catch {
          socket.emit("private-message-error", { message: "Error al enviar el mensaje privado" });
        }
      }
    );

    // 💬 send-message
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

        const usuario = await prisma.user.findUnique({
          where: { id: senderUserId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        });

        io.to(roomName).emit("receive-message", {
          roomId,
          user: usuario,
          contenido: contenido.trim(),
          fecha: new Date().toISOString(),
        });
      }
    );
  });
};