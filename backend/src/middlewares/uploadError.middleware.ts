import { RequestHandler } from "express";
import multer from "multer";

export function handleUploadError(uploadMiddleware: RequestHandler): RequestHandler {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "El archivo supera el tamaño máximo permitido" });
        return;
      }

      if (error instanceof Error) {
        res.status(400).json({ error: error.message || "Archivo no válido" });
        return;
      }

      res.status(400).json({ error: "Archivo no válido" });
    });
  };
}