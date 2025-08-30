// backend/src/routes/index.ts
import { Router } from "express";
import obraRoutes from "./obra.routes";
import uploadRoutes from "./upload.routes";
import authRoutes from "./auth.routes"; 
import userRoutes from "./user.routes";
import historialMovimientoRoutes from "./historial-movimiento.routes"; 
import maintenanceRoutes from "./maintenance.routes";

const router = Router();

// Todas las rutas de obras bajo /api/obras
router.use("/obras", obraRoutes);

// Rutas de subida de archivos
router.use("/upload", uploadRoutes);

// Todas las rutas de autenticación bajo /api/auth
router.use("/auth", authRoutes);

// Todas las rutas de gestión de usuarios bajo /api/users
router.use("/users", userRoutes);

// Todas las rutas de gestión del historial de movimiento bajo /api/historial-movimiento
router.use("/historial-movimiento", historialMovimientoRoutes);

// Rutas de mantenimiento
router.use("/maintenance", maintenanceRoutes);

export default router;
