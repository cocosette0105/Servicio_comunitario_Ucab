// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { login, authenticateToken, refreshToken, logout, authorize } from '../controllers/auth.controller';

const router = Router();

// Ruta pública para iniciar sesión
router.post('/login', login);

// Ruta para refrescar token (requiere autenticación)
router.post('/refresh-token', authenticateToken, refreshToken);

// Ruta para cerrar sesión (requiere autenticación)
router.post('/logout', authenticateToken, logout);

// Ruta para verificar el estado del token
router.get('/verify', authenticateToken, (req, res) => {
    res.status(200).json({
        message: 'Token válido.',
        user: {
            id: req.user?.id,
            username: req.user?.username,
            roleId: req.user?.roleId
        },
        tokenStatus: 'valid'
    });
});

// Rutas existentes
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Acceso concedido a la información del perfil', user: req.user });
});

// Ejemplo de una ruta que requiere un privilegio específico.
router.get('/admin', authenticateToken, authorize('ver_usuarios'), (req, res) => {
    res.json({ message: 'Acceso concedido a la página de administración' });
});

export default router;