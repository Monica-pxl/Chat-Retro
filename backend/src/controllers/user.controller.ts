import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

/* ─────────────────────────────
   GET /api/users/me
───────────────────────────── */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        estado: true,
        rol: true,
        estado_cuenta: true,
        fecha_creacion: true,
        ultima_conexion: true,
      },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json(user);
  } catch {
    return res.status(500).json({ error: "Error al obtener el perfil" });
  }
};

/* ─────────────────────────────
   PUT /api/users/me
   Body: { nickname }
───────────────────────────── */
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
      return res.status(400).json({ error: "Nickname inválido" });
    }

    const trimmed = nickname.trim();

    if (trimmed.length < 3 || trimmed.length > 24) {
      return res.status(400).json({ error: "El nickname debe tener entre 3 y 24 caracteres" });
    }

    const existing = await prisma.user.findUnique({ where: { nickname: trimmed } });
    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: "Ese nickname ya está en uso" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { nickname: trimmed },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        estado: true,
        rol: true,
        estado_cuenta: true,
        fecha_creacion: true,
        ultima_conexion: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

/* ─────────────────────────────
   POST /api/users/me/avatar
   Multipart: imagen
───────────────────────────── */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        estado: true,
        rol: true,
        estado_cuenta: true,
        fecha_creacion: true,
        ultima_conexion: true,
      },
    });

    return res.json({ avatar: avatarUrl, user: updated });
  } catch {
    return res.status(500).json({ error: "Error al subir el avatar" });
  }
};
