import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ================================
   ENVIAR SOLICITUD
================================ */
export const enviarSolicitud = async (req: Request, res: Response) => {
  try {
    const emisorId = (req as any).user.userId;
    const { receptorId } = req.body;

    if (!receptorId || isNaN(Number(receptorId))) {
      return res.status(400).json({
        error: "ID del usuario receptor inválido"
      });
    }

    const receptor = Number(receptorId);

    if (emisorId === receptor) {
      return res.status(400).json({
        error: "No puedes enviarte una solicitud a ti mismo"
      });
    }

    const usuarioDestino = await prisma.user.findUnique({
      where: {
        id: receptor
      }
    });

    if (!usuarioDestino) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      });
    }

    if (usuarioDestino.estado_cuenta !== "activa") {
      return res.status(403).json({
        error: "No puedes enviar solicitudes a este usuario"
      });
    }

    const existente = await prisma.amistad.findFirst({
      where: {
        OR: [
          {
            emisorId,
            receptorId: receptor
          },
          {
            emisorId: receptor,
            receptorId: emisorId
          }
        ]
      }
    });

    if (existente) {
      return res.status(409).json({
        error: "Ya existe una relación o solicitud con este usuario"
      });
    }

    const solicitud = await prisma.amistad.create({
      data: {
        emisorId,
        receptorId: receptor,
        estado: "pendiente"
      },
      include: {
        emisor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        receptor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    return res.status(201).json(solicitud);

  } catch {
    return res.status(500).json({
      error: "Error al enviar la solicitud"
    });
  }
};

/* ================================
   ACEPTAR SOLICITUD
================================ */
export const aceptarSolicitud = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID de solicitud inválido"
      });
    }

    const solicitud = await prisma.amistad.findUnique({
      where: {
        id
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        error: "Solicitud no encontrada"
      });
    }

    if (solicitud.receptorId !== userId) {
      return res.status(403).json({
        error: "No tienes permiso para aceptar esta solicitud"
      });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(409).json({
        error: "La solicitud ya fue procesada"
      });
    }

    const actualizada = await prisma.amistad.update({
      where: {
        id
      },
      data: {
        estado: "aceptado"
      },
      include: {
        emisor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        receptor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    return res.json(actualizada);

  } catch {
    return res.status(500).json({
      error: "Error al aceptar la solicitud"
    });
  }
};

/* ================================
   RECHAZAR SOLICITUD
================================ */
export const rechazarSolicitud = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID de solicitud inválido"
      });
    }

    const solicitud = await prisma.amistad.findUnique({
      where: {
        id
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        error: "Solicitud no encontrada"
      });
    }

    if (solicitud.receptorId !== userId) {
      return res.status(403).json({
        error: "No tienes permiso para rechazar esta solicitud"
      });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(409).json({
        error: "La solicitud ya fue procesada"
      });
    }

    const actualizada = await prisma.amistad.update({
      where: {
        id
      },
      data: {
        estado: "rechazado"
      },
      include: {
        emisor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        receptor: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    return res.json(actualizada);

  } catch {
    return res.status(500).json({
      error: "Error al rechazar la solicitud"
    });
  }
};

/* ================================
   CANCELAR SOLICITUD
================================ */
export const cancelarSolicitud = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID de solicitud inválido"
      });
    }

    const solicitud = await prisma.amistad.findUnique({
      where: {
        id
      }
    });

    if (!solicitud) {
      return res.status(404).json({
        error: "Solicitud no encontrada"
      });
    }

    if (solicitud.emisorId !== userId) {
      return res.status(403).json({
        error: "No tienes permiso para cancelar esta solicitud"
      });
    }

    if (solicitud.estado !== "pendiente") {
      return res.status(409).json({
        error: "Solo puedes cancelar solicitudes pendientes"
      });
    }

    await prisma.amistad.delete({
      where: {
        id
      }
    });

    return res.json({
      message: "Solicitud cancelada correctamente"
    });

  } catch {
    return res.status(500).json({
      error: "Error al cancelar la solicitud"
    });
  }
};

/* ================================
   ELIMINAR AMIGO
================================ */
export const eliminarAmigo = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;
    const amigoId = Number(req.params.amigoId);

    if (isNaN(amigoId)) {
      return res.status(400).json({
        error: "ID de usuario inválido"
      });
    }

    const amistad = await prisma.amistad.findFirst({
      where: {
        estado: "aceptado",
        OR: [
          {
            emisorId: userId,
            receptorId: amigoId
          },
          {
            emisorId: amigoId,
            receptorId: userId
          }
        ]
      }
    });

    if (!amistad) {
      return res.status(404).json({
        error: "No existe amistad con ese usuario"
      });
    }

    await prisma.amistad.delete({
      where: {
        id: amistad.id
      }
    });

    return res.json({
      message: "Amigo eliminado correctamente"
    });

  } catch {
    return res.status(500).json({
      error: "Error al eliminar el amigo"
    });
  }
};

/* ================================
   LISTAR AMIGOS
================================ */
export const listarAmigos = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;

    const amistades = await prisma.amistad.findMany({
      where: {
        estado: "aceptado",
        OR: [
          {
            emisorId: userId
          },
          {
            receptorId: userId
          }
        ]
      },
      include: {
        emisor: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            estado: true,
            ultima_conexion: true
          }
        },
        receptor: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            estado: true,
            ultima_conexion: true
          }
        }
      }
    });

    const amigos = amistades.map((amistad) => {

      const amigo =
        amistad.emisorId === userId
          ? amistad.receptor
          : amistad.emisor;

      return {
        amistadId: amistad.id,
        desde: amistad.fecha_creacion,
        amigo
      };

    });

    return res.json(amigos);

  } catch {
    return res.status(500).json({
      error: "Error al obtener la lista de amigos"
    });
  }
};

/* ================================
   SOLICITUDES RECIBIDAS
================================ */
export const listarSolicitudes = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;

    const solicitudes = await prisma.amistad.findMany({
      where: {
        receptorId: userId,
        estado: "pendiente"
      },
      orderBy: {
        fecha_creacion: "desc"
      },
      include: {
        emisor: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            estado: true
          }
        }
      }
    });

    return res.json(solicitudes);

  } catch {
    return res.status(500).json({
      error: "Error al obtener las solicitudes"
    });
  }
};

/* ================================
   SOLICITUDES ENVIADAS
================================ */
export const listarSolicitudesEnviadas = async (req: Request, res: Response) => {
  try {

    const userId = (req as any).user.userId;

    const solicitudes = await prisma.amistad.findMany({
      where: {
        emisorId: userId,
        estado: "pendiente"
      },
      orderBy: {
        fecha_creacion: "desc"
      },
      include: {
        receptor: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            estado: true
          }
        }
      }
    });

    return res.json(solicitudes);

  } catch {
    return res.status(500).json({
      error: "Error al obtener las solicitudes enviadas"
    });
  }
};