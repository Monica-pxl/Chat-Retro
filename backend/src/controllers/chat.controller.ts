import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ================================
   OBTENER O CREAR CHAT PRIVADO
================================ */
export const getOrCreateChat = async (req: Request, res: Response) => {
  try {
    const emisorId = (req as any).user.userId;
    const receptorId = Number(req.params.userId);

    if (isNaN(receptorId)) {
      return res.status(400).json({
        error: "ID de usuario inválido",
      });
    }

    if (emisorId === receptorId) {
      return res.status(400).json({
        error: "No puedes chatear contigo mismo",
      });
    }

    // Comprobar que el usuario existe
    const receptor = await prisma.user.findUnique({
      where: {
        id: receptorId,
      },
    });

    if (!receptor) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // 🔥 CAMBIO AQUÍ: Bloquear si el receptor es admin o no está activo
    if (receptor.rol === 'admin' || receptor.estado_cuenta !== "activa") {
      return res.status(403).json({
        error: "No puedes iniciar un chat con este administrador.",
      });
    }

    const mensajesInclude = {
      mensajes: {
        orderBy: { fecha_creacion: 'asc' as const },
        take: 100,
        select: {
          id: true,
          contenido: true,
          tipo: true,
          fecha_creacion: true,
          emisorId: true,
          emisor: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      },
      usuario1: { select: { id: true, nickname: true, avatar: true } },
      usuario2: { select: { id: true, nickname: true, avatar: true } },
    };

    // Buscar un chat existente entre ambos usuarios
    const chatExistente = await prisma.chatPrivado.findFirst({
      where: {
        OR: [
          { usuario1Id: emisorId, usuario2Id: receptorId },
          { usuario1Id: receptorId, usuario2Id: emisorId },
        ],
      },
      include: mensajesInclude,
    });

    if (chatExistente) {
      return res.status(200).json(chatExistente);
    }

    // Crear nuevo chat privado
    const nuevoChat = await prisma.chatPrivado.create({
      data: {
        usuario1Id: emisorId,
        usuario2Id: receptorId,
      },
      include: mensajesInclude,
    });

    return res.status(201).json(nuevoChat);

  } catch {
    return res.status(500).json({
      error: "Error al obtener o crear el chat privado",
    });
  }
};

/* ================================
   LISTAR TODOS LOS CHATS DEL USUARIO
================================ */
export const listarChats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const chats = await prisma.chatPrivado.findMany({
      where: {
        OR: [
          { usuario1Id: userId },
          { usuario2Id: userId },
        ],
        mensajes: { some: {} },
      },
      include: {
        usuario1: { select: { id: true, nickname: true, avatar: true } },
        usuario2: { select: { id: true, nickname: true, avatar: true } },
        mensajes: {
          orderBy: { fecha_creacion: "desc" },
          take: 1,
          select: {
            id: true,
            contenido: true,
            tipo: true,
            fecha_creacion: true,
            emisorId: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return res.json(chats);
  } catch {
    return res.status(500).json({ error: "Error al listar los chats" });
  }
};