// backend/src/routes/historial-movimiento.routes.ts
import { Router } from 'express';
import { 
    createHistorialMovimiento, 
    getHistorialByObraId,
    updateHistorialMovimiento,
    deleteHistorialMovimiento,
    getAllHistorialMovimientos // <-- Importamos la nueva función
} from '../controllers/historial-movimiento.controller';
import { authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

router.use(authenticateToken);

// --- ¡NUEVA RUTA! ---
// Esta ruta obtiene TODOS los movimientos y solo requiere permiso de lectura.
router.get('/', authorize('leer_historial_movimiento'), getAllHistorialMovimientos);

// Rutas existentes (sin cambios)
router.post('/', authorize('registrar_movimiento'), createHistorialMovimiento);
router.get('/obra/:id', authorize('leer_historial_movimiento'), getHistorialByObraId);
router.put('/:id', authorize('registrar_movimiento'), updateHistorialMovimiento);
router.delete('/:id', authorize('registrar_movimiento'), deleteHistorialMovimiento);

export default router;
