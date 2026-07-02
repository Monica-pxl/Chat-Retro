import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getSalas,
  getSalaById,
  getMensajesSala,
} from "../controllers/sala.controller";

const router = Router();

router.get("/", authMiddleware, getSalas);
router.get("/:id/mensajes", authMiddleware, getMensajesSala);
router.get("/:id", authMiddleware, getSalaById);

export default router;