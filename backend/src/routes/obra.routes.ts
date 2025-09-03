// backend/src/routers/obra.router.ts

import { Router } from "express";
import { 
    getObras,
    getObraById,
    createObra,
    updateObra,
    deleteObra 
} from "../controllers/obra.controller";
import { upload } from "../middlewares/upload";

const router = Router();

// ==========================
// Rutas GET
// ==========================
router.get("/", getObras);
router.get("/:id", getObraById);

// ==========================
// Ruta POST: crear obra con imagen
// ==========================
router.post("/", upload.single("obr_url_foto"), createObra);

// ==========================
// Ruta PUT: actualizar obra (imagen opcional)
// ==========================
router.put("/:id", upload.single("obr_url_foto"), updateObra);

// ==========================
// Ruta DELETE: eliminar obra
// ==========================
router.delete("/:id", deleteObra);

export default router;
