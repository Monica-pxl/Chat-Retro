export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImage(file: Express.Multer.File) {
  if (!file) {
    return {
      valid: false,
      message: "No se ha enviado ninguna imagen",
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      message: "Formato de imagen no permitido",
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      message: "La imagen supera el tamaño máximo de 5 MB",
    };
  }

  return {
    valid: true,
  };
}