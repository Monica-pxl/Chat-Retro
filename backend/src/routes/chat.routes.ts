import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getOrCreateChat } from "../controllers/chat.controller";

const router = Router();

router.get("/:userId", authMiddleware, getOrCreateChat);

export default router;
