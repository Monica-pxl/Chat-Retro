import fs from "fs";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

function hasValidSignature(file: Express.Multer.File) {
  const bytes = fs.readFileSync(file.path);
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isGif = bytes.length >= 6 && (bytes.subarray(0, 6).toString() === "GIF87a" || bytes.subarray(0, 6).toString() === "GIF89a");
  const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";

  return (file.mimetype === "image/jpeg" && isJpeg)
    || (file.mimetype === "image/png" && isPng)
    || (file.mimetype === "image/gif" && isGif)
    || (file.mimetype === "image/webp" && isWebp);
}

export function validateImage(file: Express.Multer.File, maxSize = MAX_IMAGE_SIZE) {
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

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `La imagen supera el tamaño máximo de ${maxSize / (1024 * 1024)} MB`,
    };
  }

  if (!hasValidSignature(file)) {
    return {
      valid: false,
      message: "El contenido del archivo no coincide con su formato de imagen",
    };
  }

  return {
    valid: true,
  };
}