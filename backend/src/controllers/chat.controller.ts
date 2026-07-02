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

    // Comprobar que la cuenta está activa
    if (receptor.estado_cuenta !== "activa") {
      return res.status(403).json({
        error: "No puedes iniciar un chat con este usuario",
      });
    }

    // Buscar un chat existente entre ambos usuarios
    const chatExistente = await prisma.chatPrivado.findFirst({
      where: {
        OR: [
          {
            usuario1Id: emisorId,
            usuario2Id: receptorId,
          },
          {
            usuario1Id: receptorId,
            usuario2Id: emisorId,
          },
        ],
      },
      include: {
        usuario1: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        usuario2: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
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
      include: {
        usuario1: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        usuario2: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(201).json(nuevoChat);

  } catch {
    return res.status(500).json({
      error: "Error al obtener o crear el chat privado",
    });
  }
};