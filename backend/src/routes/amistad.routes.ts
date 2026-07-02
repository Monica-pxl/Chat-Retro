import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  enviarSolicitud,
  aceptarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  eliminarAmigo,
  listarAmigos,
  listarSolicitudes,
  listarSolicitudesEnviadas
} from "../controllers/amistad.controller";

const router = Router();

router.get("/", authMiddleware, listarAmigos);
router.get("/solicitudes", authMiddleware, listarSolicitudes);
router.get("/solicitudes/enviadas", authMiddleware, listarSolicitudesEnviadas);
router.post("/solicitud", authMiddleware, enviarSolicitud);
router.put("/solicitud/:id/aceptar", authMiddleware, aceptarSolicitud);
router.put("/solicitud/:id/rechazar", authMiddleware, rechazarSolicitud);
router.delete("/solicitud/:id", authMiddleware, cancelarSolicitud);
router.delete("/:amigoId", authMiddleware, eliminarAmigo);

export default router;
