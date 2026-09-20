import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import { uploadImage } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { handleUploadError } from "../middlewares/uploadError.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  handleUploadError(upload.single("imagen")),
  uploadImage
);

export default router;