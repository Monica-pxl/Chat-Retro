import multer from "multer";

// Con Cloudinary ya no guardamos en disco: usamos memoria y subimos el archivo directamente a la nube.
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Formato no permitido. Usa JPG, PNG, WEBP o GIF"));
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
});