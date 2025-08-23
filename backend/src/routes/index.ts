import { Router } from "express";
import obraRoutes from "./obra.routes";
import uploadRoutes from "./upload.routes";



const router = Router();

// Todas las rutas de obras bajo /api/obras
router.use("/obras", obraRoutes);

router.use("/upload", uploadRoutes);

export default router;
