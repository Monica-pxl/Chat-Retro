import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { avatarUpload } from "../middlewares/avatar.middleware";
import { getMe, updateMe, uploadAvatar, searchUsers } from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.get("/search", authMiddleware, searchUsers);
router.put("/me", authMiddleware, updateMe);
router.post("/me/avatar", authMiddleware, avatarUpload.single("avatar"), uploadAvatar);

export default router;
