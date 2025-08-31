// backend/src/routes/historial-movimiento.routes.ts
// ¡Este archivo no necesita cambios! Las rutas siguen siendo las mismas.
import { Router } from 'express';
import { 
    createHistorialMovimiento, 
    getHistorialByObraId,
    updateHistorialMovimiento,
    deleteHistorialMovimiento,
    getAllHistorialMovimientos
} from '../controllers/historial-movimiento.controller';
import { authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

router.use(authenticateToken);

// Obtiene todos los movimientos
router.get('/', authorize('leer_historial_movimiento'), getAllHistorialMovimientos);

// Crea un nuevo movimiento
router.post('/', authorize('registrar_movimiento'), createHistorialMovimiento);

// Obtiene el historial de una obra específica
router.get('/obra/:id', authorize('leer_historial_movimiento'), getHistorialByObraId);

// Actualiza un movimiento existente
router.put('/:id', authorize('registrar_movimiento'), updateHistorialMovimiento);

// Elimina un movimiento
router.delete('/:id', authorize('registrar_movimiento'), deleteHistorialMovimiento);

export default router;
