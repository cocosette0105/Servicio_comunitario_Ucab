// backend/src/routers/obra.router.ts
import { Router } from "express";
import { 
    getObras,
    getObraById,
    createObra,
    updateObra,
    deleteObra 
} from "../controllers/obra.controller";

const router = Router();

// Define las rutas y las asocia con las funciones del controlador
router.get("/", getObras);
router.get("/:id", getObraById);
router.post("/", createObra);
router.put("/:id", updateObra);
router.delete("/:id", deleteObra);

export default router;
