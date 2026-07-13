import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getRoomCount } from "../helpers/roomStore";
import { canJoinRoom } from "../helpers/roomAvailability";

const prisma = new PrismaClient();

/* ======================
   OBTENER TODAS LAS SALAS
====================== */
export const getSalas = async (req: Request, res: Response) => {
  try {
    const salas = await prisma.sala.findMany({
      orderBy: { id: "asc" },
      include: { epoca: true, tematica: true },
    });

    // Aplicar disponibilidad en tiempo real
    const salasConDisponibilidad = salas.map(sala => ({
      ...sala,
      cerrada: sala.cerrada || !canJoinRoom(sala),
    }));

    return res.json(salasConDisponibilidad);
  } catch {
    return res.status(500).json({ error: "Error al obtener las salas" });
  }
};

/* ======================
   HISTORIAL DE MENSAJES
====================== */
export const getMensajesSala = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sala = await prisma.sala.findUnique({ where: { id } });

    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    if (sala.cerrada) {
      const requesterId = (req as any).user?.userId;
      const requester = requesterId
        ? await prisma.user.findUnique({
            where: { id: requesterId },
            select: { rol: true },
          })
        : null;

      if (requester?.rol !== "admin") {
        return res.status(403).json({ error: "Esta sala está cerrada" });
      }
    }

    const mensajes = await prisma.mensajeSala.findMany({
      where: { salaId: id },
      orderBy: { fecha_creacion: "asc" },
      take: 50,
      select: {
        id: true,
        contenido: true,
        tipo: true,
        fecha_creacion: true,
        userId: true,
        user: {
          select: {
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return res.json(mensajes);
  } catch {
    return res.status(500).json({ error: "Error al obtener los mensajes" });
  }
};

/* ======================
   OBTENER UNA SALA
====================== */
export const getSalaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      });
    }

    const sala = await prisma.sala.findUnique({
      where: {
        id,
      },
      include: {
        epoca: true,
        tematica: true,
      },
    });

    if (!sala) {
      return res.status(404).json({
        error: "Sala no encontrada",
      });
    }

    return res.json(sala);
  } catch {
    return res.status(500).json({
      error: "Error al obtener la sala",
    });
  }
};

/* ================================
   USUARIOS ONLINE EN UNA SALA
================================ */
export const getOnlineCount = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
  return res.json({ count: getRoomCount(id) });
};