import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import { validateImage } from "../helpers/uploadValidation";

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
      return res.status(400).json({ error: "La contraseña actual no es correcta" });
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
   Sube el avatar a Cloudinary.
───────────────────────────── */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    const validation = validateImage(req.file, 3 * 1024 * 1024);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const previousAvatar = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Subir la imagen a Cloudinary en memoria (sin escribir en disco)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "chatretro/avatars", resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file!.buffer);
    });

    const avatarUrl = uploadResult.secure_url;

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

    // Si el usuario tenía un avatar anterior alojado en Cloudinary, lo borramos de la nube.
    // Si era una ruta antigua (/uploads/...), no hacemos nada.
    if (previousAvatar?.avatar && previousAvatar.avatar.includes("res.cloudinary.com")) {
      try {
        const publicId = extractCloudinaryPublicId(previousAvatar.avatar);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      } catch {
        /* Si falla el borrado del anterior, no bloqueamos la respuesta */
      }
    }

    return res.json({ avatar: avatarUrl, user: updated });
  } catch (error) {
    console.error("Error al subir el avatar:", error);
    return res.status(500).json({ error: "Error al subir el avatar" });
  }
};

/* ─────────────────────────────
   DELETE /api/users/me/avatar
   Elimina el avatar del usuario (y de Cloudinary si está allí).
───────────────────────────── */
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.avatar) {
      return res.status(400).json({ error: "No tienes avatar para eliminar" });
    }

    // Si el avatar está en Cloudinary, lo borramos de la nube.
    if (user.avatar.includes("res.cloudinary.com")) {
      try {
        const publicId = extractCloudinaryPublicId(user.avatar);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      } catch {
        /* Si falla, seguimos para limpiar la referencia en BD */
      }
    }

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

/* ───────────────────────────────
   Helper: extrae el publicId de una URL de Cloudinary.
   Ejemplo:
   https://res.cloudinary.com/xxxx/image/upload/v123456/chatretro/avatars/abc.jpg
   → chatretro/avatars/abc
─────────────────────────────── */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    // Quitar la versión (v123456/) si existe
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    // Quitar la extensión del archivo
    return afterUpload.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}