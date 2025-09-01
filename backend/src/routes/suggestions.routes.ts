import { Router } from "express";
import { 
    getArtistas,
    getClasificaciones,
    getMateriales,
    getTecnicas
} from "../controllers/suggestions.controller";

const router = Router();

router.get("/artistas", getArtistas);
router.get("/clasificaciones", getClasificaciones);
router.get("/materiales", getMateriales);
router.get("/tecnicas", getTecnicas);

export default router;
