import { Router } from "express";
import obraRoutes from "./obra.routes";

const router = Router();

// Todas las rutas de obras bajo /api/obras
router.use("/obras", obraRoutes);

export default router;
