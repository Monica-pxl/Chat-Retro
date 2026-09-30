import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import { validateImage } from "../helpers/uploadValidation";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No se recibió ninguna imagen",
      });
    }

    const validation = validateImage(req.file as Express.Multer.File);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message,
      });
    }

    // Subir a Cloudinary en memoria (sin escribir en disco)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "chatretro/salas", resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file!.buffer);
    });

    return res.status(200).json({
      url: uploadResult.secure_url,
    });

  } catch {
    return res.status(500).json({
      error: "Error al subir la imagen",
    });
  }
};