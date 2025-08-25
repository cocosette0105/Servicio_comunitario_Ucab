// backend/src/routes/user.routes.ts
import { Router } from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
} from '../controllers/user.controller';
import { authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

// Middleware de autenticación y autorización para todas las rutas de usuario
router.use(authenticateToken);
router.use(authorize('gestionar_usuarios'));

// Rutas de la API para usuarios
router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/status', toggleUserStatus); // Usamos PATCH para actualizar parcialmente

export default router;
