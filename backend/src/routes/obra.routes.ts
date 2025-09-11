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
router.post("/", upload.array("obra_imagenes", 10), createObra);

// ==========================\
// Ruta PUT: Acepta un array de hasta 10 imágenes para actualizar
// ==========================
router.put("/:id", upload.array("obra_imagenes", 10), updateObra);


// ==========================
// Ruta DELETE: eliminar obra
// ==========================
router.delete("/:id", deleteObra);

export default router;
