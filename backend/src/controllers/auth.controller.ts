import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../helpers/jwt";
import { validateRegister, validateLogin } from "../helpers/validate";
import { removeUserSocket, getOnlineUserIds } from "../helpers/socketStore";

const prisma = new PrismaClient();

/* ======================
   REGISTER
====================== */
export const register = async (req: Request, res: Response) => {
  try {
    let { email, password, nickname } = req.body;

    email = email.toLowerCase().trim();
    nickname = nickname.trim();

    validateRegister(email, password, nickname);

    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const existingNick = await prisma.user.findUnique({
      where: { nickname }
    });

    if (existingNick) {
      return res.status(409).json({ error: "Nickname ya en uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        estado: "en_linea",
        rol: "user",
        estado_cuenta: "activa"
      }
    });

    const token = generateToken(user.id);

    const { password: _, ...safeUser } = user;

    return res.status(201).json({
      user: safeUser,
      token
    });

  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
};

/* ======================
   LOGIN
====================== */
export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    validateLogin(email, password);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (user.estado_cuenta === "baneada") {
      return res.status(403).json({ error: "Has sido baneado de tu cuenta" });
    }

    if (user.estado_cuenta === "suspendida") {
      return res.status(403).json({ error: "Has sido suspendido de tu cuenta" });
    }

    // ACTUALIZAR ESTADO A ONLINE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        estado: "en_linea",
        ultima_conexion: new Date()
      }
    });

    const token = generateToken(user.id);

    const { password: _, ...safeUser } = user;

    return res.json({
      user: {
        ...safeUser,
        estado: "en_linea" 
      },
      token
    });

  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
};

/* ======================
   LOGOUT
====================== */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Actualizar estado en BD a desconectado
    await prisma.user.update({
      where: { id: userId },
      data: {
        estado: "desconectado",
        ultima_conexion: new Date()
      }
    });

    // Intentar notificar a todos, pero sin que falle si no hay socket
    try {
      const { getIo, getOnlineUserIds } = require("../helpers/socketStore");
      const io = getIo();
      if (io) {
        io.emit("online-users", getOnlineUserIds());
      }
    } catch (socketError) {
      // Si falla la notificación por socket, no importa, el logout sigue funcionando
      console.warn("No se pudo notificar el logout por socket:", socketError);
    }

    return res.status(200).json({ message: "Sesión cerrada correctamente" });

  } catch (error) {
    console.error("Error en logout:", error);
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};