// backend/src/middlewares/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, "../../uploads/obras");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

