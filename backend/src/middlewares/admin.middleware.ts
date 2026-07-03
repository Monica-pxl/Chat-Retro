import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tokenPayload = (req as any).user;

  if (!tokenPayload?.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: { rol: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    if (user.rol !== "admin") {
      return res.status(403).json({
        error: "Acceso denegado. No tienes permisos para realizar esta acción",
      });
    }

    next();
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};