import { Router } from "express";
import {
  getSalas,
  getSalaById,
  getMensajesSala,
  getOnlineCount,
} from "../controllers/sala.controller";

const router = Router();

// Rutas públicas — no requieren autenticación
router.get("/", getSalas);
router.get("/:id/online", getOnlineCount);
router.get("/:id/mensajes", getMensajesSala);
router.get("/:id", getSalaById);

export default router;