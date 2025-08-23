import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller";

const router = Router();

// Ruta para subir imagen
router.post("/", uploadImage);

export default router;
