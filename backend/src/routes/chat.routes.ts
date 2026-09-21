import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getOrCreateChat, listarChats, eliminarMensajePrivado } from "../controllers/chat.controller";

const router = Router();

router.get("/", authMiddleware, listarChats);
router.delete("/mensajes/:id", authMiddleware, eliminarMensajePrivado);
router.get("/:userId", authMiddleware, getOrCreateChat);


export default router;
