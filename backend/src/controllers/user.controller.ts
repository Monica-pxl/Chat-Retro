import { Request, Response } from "express";
import bcrypt from "bcrypt";
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
   PUT /api/users/me/password
   Body: { currentPassword, newPassword, confirmPassword }
───────────────────────────── */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: "Introduce tu contraseña actual" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "Introduce una contraseña nueva" });
    }

    if (!confirmPassword) {
      return res.status(400).json({ error: "Repite la contraseña nueva para confirmarla" });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,15}$/.test(newPassword)) {
      return res.status(400).json({ error: "La nueva contraseña debe tener entre 8 y 15 caracteres, con al menos una letra y un número" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "La confirmación no coincide con la nueva contraseña" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const currentPasswordIsValid = await bcrypt.compare(currentPassword, user.password);
    if (!currentPasswordIsValid) {
      return res.status(401).json({ error: "La contraseña actual no es correcta" });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ error: "La nueva contraseña debe ser distinta de la actual" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch {
    return res.status(500).json({ error: "Error al actualizar la contraseña" });
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

/* ─────────────────────────────
   DELETE /api/users/me/avatar
───────────────────────────── */
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Obtener el usuario para saber si tiene avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.avatar) {
      return res.status(400).json({ error: "No tienes avatar para eliminar" });
    }

    // Eliminar el avatar de la BD
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
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
    return res.status(500).json({ error: "Error al eliminar el avatar" });
  }
};

/* ───────────────────────────────
   GET /api/users/search?q=nickname
─────────────────────────────── */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.userId;
    const q = ((req.query.q as string) || '').trim();

    if (!q || q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        nickname: { contains: q },
        id: { not: currentUserId },
        rol: { not: 'admin' },
        estado_cuenta: { in: ['activa', 'suspendida'] },
      },
      select: { id: true, nickname: true, avatar: true, estado: true, estado_cuenta: true },
      take: 8,
    });

    return res.json(users);
  } catch {
    return res.status(500).json({ error: 'Error al buscar usuarios' });
  }
};
