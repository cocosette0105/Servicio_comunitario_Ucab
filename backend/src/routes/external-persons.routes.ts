import { Router } from 'express';
import { 
    getAllExternalPersons, 
    getDirectoryContacts,
    toggleDirectoryStatus // <-- 1. Se importa la nueva función
} from '../controllers/external-persons.controller';
import { authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

router.use(authenticateToken);

// Ruta para obtener TODAS las personas externas (para autocompletados, etc.)
router.get('/', authorize('leer_historial_movimiento'), getAllExternalPersons);

// Ruta para obtener solo los contactos guardados en el DIRECTORIO
router.get('/directory', authorize('leer_historial_movimiento'), getDirectoryContacts);

// ========================================================================
// RUTA CORREGIDA
// Esta ruta ahora usa el método PUT y apunta a la nueva función `toggleDirectoryStatus`.
// Reemplaza la antigua ruta DELETE.
// ========================================================================
router.put('/:id/toggle-directory', authorize('registrar_movimiento'), toggleDirectoryStatus);

export default router;