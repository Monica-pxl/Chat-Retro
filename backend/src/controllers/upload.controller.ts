import { Request, Response } from "express";
import { validateImage } from "../helpers/uploadValidation";

export const uploadImage = (req: Request, res: Response) => {
  try {
    const validation = validateImage(req.file as Express.Multer.File);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message,
      });
    }

    return res.status(200).json({
      url: `/uploads/salas/${req.file!.filename}`,
    });

  } catch {
    return res.status(500).json({
      error: "Error al subir la imagen",
    });
  }
};