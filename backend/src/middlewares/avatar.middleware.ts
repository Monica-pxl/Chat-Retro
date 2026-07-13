import multer from "multer";
import path from "path";
import fs from "fs";

const avatarPath = path.join(process.cwd(), "uploads", "avatars");

if (!fs.existsSync(avatarPath)) {
  fs.mkdirSync(avatarPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, avatarPath);
  },
  filename(_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, unique);
  },
});

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
