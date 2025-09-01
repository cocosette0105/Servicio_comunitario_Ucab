// backend/src/routes/external-persons.routes.ts
// Rutas para la gestión de personas externas registradas en la base de datos

import { Router } from 'express';
import { getAllExternalPersons, deleteExternalPerson } from '../controllers/external-persons.controller';
import { authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

// Middleware de autenticación para todas las rutas de personas externas
router.use(authenticateToken);

// Ruta para obtener todas las personas externas
// Requiere privilegio de lectura de historial de movimientos
router.get('/', authorize('leer_historial_movimiento'), getAllExternalPersons); // ← única ruta GET (evita duplicados)

router.delete('/:id', authorize('registrar_movimiento'), deleteExternalPerson);

export default router;
