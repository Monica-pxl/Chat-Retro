import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { avatarUpload } from "../middlewares/avatar.middleware";
import { getMe, updateMe, uploadAvatar } from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.post("/me/avatar", authMiddleware, avatarUpload.single("avatar"), uploadAvatar);

export default router;
