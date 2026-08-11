import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getOrCreateChat, listarChats } from "../controllers/chat.controller";

const router = Router();

router.get("/", authMiddleware, listarChats);
router.get("/:userId", authMiddleware, getOrCreateChat);

export default router;
