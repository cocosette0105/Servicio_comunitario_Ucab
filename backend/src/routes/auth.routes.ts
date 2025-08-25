// src/routes/auth.routes.ts
import { Router } from 'express';
import { login, authenticateToken, authorize } from '../controllers/auth.controller';

const router = Router();

// Ruta pública para iniciar sesión
router.post('/login', login);

// Ejemplo de una ruta protegida. Solo los usuarios autenticados pueden acceder.
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Acceso concedido a la información del perfil', user: req.user });
});

// Ejemplo de una ruta que requiere un privilegio específico.
router.get('/admin', authenticateToken, authorize('ver_usuarios'), (req, res) => {
    res.json({ message: 'Acceso concedido a la página de administración' });
});

export default router;