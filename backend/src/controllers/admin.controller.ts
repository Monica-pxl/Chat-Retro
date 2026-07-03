import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ================================
   LISTAR USUARIOS
   (excluye al propio admin y a otros admins)
================================ */
export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.userId;

    const usuarios = await prisma.user.findMany({
      where: {
        id: { not: adminId },
      },
      orderBy: { id: "asc" },
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

    return res.json(usuarios);
  } catch {
    return res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

/* ================================
   CAMBIAR ESTADO DE CUENTA
   (activa / suspendida / baneada)
   No aplica sobre sí mismo ni sobre otros admins
================================ */
export const updateEstadoCuenta = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.userId;
    const targetId = Number(req.params.id);
    const { estado_cuenta } = req.body;

    if (isNaN(targetId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const estadosValidos = ["activa", "suspendida", "baneada"];
    if (!estado_cuenta || !estadosValidos.includes(estado_cuenta)) {
      return res.status(400).json({
        error: "estado_cuenta inválido. Valores permitidos: activa, suspendida, baneada",
      });
    }

    if (adminId === targetId) {
      return res.status(403).json({
        error: "No puedes modificar tu propio estado de cuenta",
      });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });

    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (target.rol === "admin") {
      return res.status(403).json({
        error: "No puedes modificar el estado de cuenta de otro administrador",
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { estado_cuenta },
      select: {
        id: true,
        nickname: true,
        estado_cuenta: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Error al actualizar el estado de cuenta" });
  }
};

/* ================================
   CAMBIAR ROL DE USUARIO
   El admin no puede cambiarse de rol a sí mismo
================================ */
export const cambiarRol = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.userId;
    const targetId = Number(req.params.id);
    const { rol } = req.body;

    if (isNaN(targetId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const rolesValidos = ["user", "admin"];
    if (!rol || !rolesValidos.includes(rol)) {
      return res.status(400).json({
        error: "rol inválido. Valores permitidos: user, admin",
      });
    }

    if (adminId === targetId) {
      return res.status(403).json({
        error: "No puedes cambiar tu propio rol",
      });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });

    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { rol },
      select: {
        id: true,
        nickname: true,
        rol: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Error al cambiar el rol del usuario" });
  }
};

// Salas que tienen horario especial y NO se pueden reabrir manualmente
const SALAS_CON_HORARIO = new Set([
  "Fiesta 90s",
  "Fiesta 2000s",
  "Tropical 90s",
  "Tropical 2000s",
  "Navidad 90s",
  "Navidad 2000s",
  "TV Shows 90s",
  "TV Shows 2000s",
]);

/* ================================
   CERRAR SALA
================================ */
export const cerrarSala = async (req: Request, res: Response) => {
  try {
    const salaId = Number(req.params.id);

    if (isNaN(salaId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sala = await prisma.sala.findUnique({ where: { id: salaId } });

    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    if (sala.cerrada) {
      return res.status(409).json({ error: "La sala ya está cerrada" });
    }

    const updated = await prisma.sala.update({
      where: { id: salaId },
      data: { cerrada: true },
      select: {
        id: true,
        nombre: true,
        cerrada: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Error al cerrar la sala" });
  }
};

/* ================================
   ABRIR SALA
   No aplica sobre salas con horario especial
================================ */
export const abrirSala = async (req: Request, res: Response) => {
  try {
    const salaId = Number(req.params.id);

    if (isNaN(salaId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sala = await prisma.sala.findUnique({ where: { id: salaId } });

    if (!sala) {
      return res.status(404).json({ error: "Sala no encontrada" });
    }

    if (SALAS_CON_HORARIO.has(sala.nombre)) {
      return res.status(403).json({
        error: "Esta sala tiene horario especial y no puede abrirse manualmente",
      });
    }

    if (!sala.cerrada) {
      return res.status(409).json({ error: "La sala ya está abierta" });
    }

    const updated = await prisma.sala.update({
      where: { id: salaId },
      data: { cerrada: false },
      select: {
        id: true,
        nombre: true,
        cerrada: true,
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Error al abrir la sala" });
  }
};

/* ================================
   ESTADÍSTICAS GLOBALES
================================ */
export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosSuspendidos,
      usuariosBaneados,
      usuariosOnline,
      totalSalas,
      salasAbiertas,
      salasCerradas,
      totalAmistades,
      totalChatsPrivados,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { estado_cuenta: "activa" } }),
      prisma.user.count({ where: { estado_cuenta: "suspendida" } }),
      prisma.user.count({ where: { estado_cuenta: "baneada" } }),
      prisma.user.count({ where: { estado: "en_linea" } }),
      prisma.sala.count(),
      prisma.sala.count({ where: { cerrada: false } }),
      prisma.sala.count({ where: { cerrada: true } }),
      prisma.amistad.count({ where: { estado: "aceptado" } }),
      prisma.chatPrivado.count(),
    ]);

    return res.json({
      usuarios: totalUsuarios,
      usuariosActivos,
      usuariosSuspendidos,
      usuariosBaneados,
      usuariosOnline,
      salas: totalSalas,
      salasAbiertas,
      salasCerradas,
      amistades: totalAmistades,
      chatsPrivados: totalChatsPrivados,
    });
  } catch {
    return res.status(500).json({ error: "Error al obtener las estadísticas" });
  }
};
