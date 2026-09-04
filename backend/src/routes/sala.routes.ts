import { Router } from "express";
import {
  getSalas,
  getSalaById,
  getMensajesSala,
  getOnlineCount,
} from "../controllers/sala.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Rutas públicas — no requieren autenticación
router.get("/", getSalas);
router.get("/:id/online", getOnlineCount);
router.get("/:id/mensajes", optionalAuthMiddleware, getMensajesSala);
router.get("/:id", getSalaById);

export default router;