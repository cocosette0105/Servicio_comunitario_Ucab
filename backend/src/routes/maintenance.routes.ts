// backend/src/routes/maintenance.routes.ts

import { Router } from 'express';
import { 
    getAllMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord
} from '../controllers/maintenance.controller';
import { authenticateToken } from '../controllers/auth.controller'; // Middleware de autenticación

const router = Router();

// Todas las rutas de esta sección requieren que el usuario esté autenticado
router.use(authenticateToken);

router.get('/', getAllMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);

export default router;