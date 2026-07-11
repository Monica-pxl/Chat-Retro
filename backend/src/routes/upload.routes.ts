import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import { uploadImage } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.single("imagen"),
  uploadImage
);

export default router;