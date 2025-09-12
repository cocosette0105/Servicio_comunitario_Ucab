// backend/src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { env } from '../config/env';

if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno.');
}

interface UserPayload {
    id: number;
    username: string;
    roleId: number;
    iat?: number; // Token issued at
    exp?: number; // Token expires at
    lastActivity?: number; // Timestamp de última actividad
}

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

// 🔧 CONFIGURACIÓN DE TIEMPOS - EDITA AQUÍ PARA CAMBIAR LA INACTIVIDAD PERMITIDA
const INACTIVITY_TIMEOUT = 5; // ⏰ MINUTOS de inactividad antes de cerrar sesión (cambia este valor)
const SESSION_DURATION = 8; // HORAS de duración máxima de sesión
const WARNING_TIME = 3; // ⚠️ MINUTOS de advertencia antes del cierre (cuando mostrar el aviso)

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'El usuario y la contraseña son requeridos.' });
    }

    try {
        const userResult = await pool.query(
            `SELECT u.usu_id, u.usu_nombre_usuario, u.usu_contraseña, u.usu_nombre_completo, r.rol_nombre, r.rol_id
             FROM Usuario u
             JOIN Rol r ON u.usu_rol_id_fk = r.rol_id
             WHERE u.usu_nombre_usuario = $1 AND u.usu_activo = TRUE`,
            [username]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.usu_contraseña);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const privilegesResult = await pool.query(
            `SELECT p.priv_nombre
             FROM Rol_Privilegio rp
             JOIN Privilegios p ON rp.priv_id_fk = p.priv_id
             WHERE rp.rol_id_fk = $1`,
            [user.rol_id]
        );

        const privileges = privilegesResult.rows.map(row => row.priv_nombre);

        const now = Math.floor(Date.now() / 1000);
        const payload: UserPayload = {
            id: user.usu_id,
            username: user.usu_nombre_usuario,
            roleId: user.rol_id,
            lastActivity: now
        };

        // Token con duración máxima de sesión
        const token = jwt.sign(payload, env.JWT_SECRET!, { 
            expiresIn: `${SESSION_DURATION}h` 
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.usu_id,
                username: user.usu_nombre_usuario,
                name: user.usu_nombre_completo,
                role: user.rol_nombre,
                privileges: privileges
            },
            sessionConfig: {
                inactivityTimeout: INACTIVITY_TIMEOUT,
                maxSessionDuration: SESSION_DURATION,
                warningTime: WARNING_TIME // 📤 Enviar tiempo de advertencia al frontend
            }
        });

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

/**
 * Middleware para verificar inactividad - SIN RENOVACIÓN AUTOMÁTICA
 */
export const checkInactivity = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
        return next();
    }

    const now = Math.floor(Date.now() / 1000);
    const lastActivity = user.lastActivity || user.iat || 0;
    const timeSinceLastActivity = now - lastActivity;

    console.log(`Verificando inactividad: Última actividad hace ${Math.floor(timeSinceLastActivity / 60)} minutos`);

    // Verificar si ha pasado el tiempo de inactividad - EXPIRA DEFINITIVAMENTE
    if (timeSinceLastActivity > (INACTIVITY_TIMEOUT * 60)) {
        console.log(`Sesión expirada por inactividad. Tiempo transcurrido: ${Math.floor(timeSinceLastActivity / 60)} minutos`);
        return res.status(401).json({ 
            message: 'Sesión expirada por inactividad. Debe iniciar sesión nuevamente.',
            code: 'SESSION_EXPIRED_INACTIVITY',
            inactivityTime: Math.floor(timeSinceLastActivity / 60),
            forceLogout: true // Indicador para el frontend
        });
    }

    // Continuar sin renovación automática
    next();
};

/**
 * Middleware para proteger rutas - SIN RENOVACIÓN
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    console.log('--- [INICIO DEPURACIÓN authenticateToken] ---');
    console.log(`Ruta solicitada: ${req.method} ${req.originalUrl}`);
    console.log(`Header [authorization] completo recibido: ${authHeader}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Resultado de la depuración: Header no encontrado o no comienza con "Bearer ".');
        return res.status(401).json({ 
            message: 'Formato de token inválido o token no proporcionado.',
            forceLogout: true
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
        console.log(`Resultado de la depuración: El token extraído es inválido (valor: ${token}).`);
        return res.status(401).json({ 
            message: 'Token inválido.',
            forceLogout: true
        });
    }
    
    console.log('Verificando la siguiente cadena de token:', token);

    jwt.verify(token, env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            console.log('Error de verificación de JWT:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expirado. Debe iniciar sesión nuevamente.',
                    code: 'TOKEN_EXPIRED',
                    forceLogout: true
                });
            }
            return res.status(403).json({ 
                message: 'Token inválido o expirado.',
                forceLogout: true
            });
        }
        
        req.user = user as UserPayload;
        console.log('--- Token verificado exitosamente ---');
        
        // Llamar al middleware de verificación de inactividad (SIN renovación)
        checkInactivity(req, res, next);
    });
};

/**
 * Endpoint para refrescar token manualmente (solo si no ha expirado por inactividad)
 */
export const refreshToken = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ 
            message: 'Usuario no autenticado.',
            forceLogout: true
        });
    }

    // Verificar que no haya expirado por inactividad ANTES de refrescar
    const now = Math.floor(Date.now() / 1000);
    const lastActivity = user.lastActivity || user.iat || 0;
    const timeSinceLastActivity = now - lastActivity;

    if (timeSinceLastActivity > (INACTIVITY_TIMEOUT * 60)) {
        console.log(`No se puede refrescar: sesión expirada por inactividad`);
        return res.status(401).json({ 
            message: 'Sesión expirada por inactividad. No se puede refrescar.',
            code: 'SESSION_EXPIRED_INACTIVITY',
            forceLogout: true
        });
    }

    try {
        const newPayload: UserPayload = {
            id: user.id,
            username: user.username,
            roleId: user.roleId,
            lastActivity: now // Actualizar actividad al refrescar manualmente
        };

        const newToken = jwt.sign(newPayload, env.JWT_SECRET!, { 
            expiresIn: `${SESSION_DURATION}h` 
        });

        console.log('Token refrescado manualmente para usuario:', user.username);

        res.status(200).json({
            message: 'Token refrescado exitosamente.',
            token: newToken,
            refreshedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al refrescar token:', error);
        res.status(500).json({ message: 'Error al refrescar token.' });
    }
};

/**
 * Endpoint para cerrar sesión
 */
export const logout = async (req: Request, res: Response) => {
    console.log('Usuario desconectado:', req.user?.username);
    
    res.status(200).json({
        message: 'Sesión cerrada exitosamente.'
    });
};

export const authorize = (privilegeName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ 
                message: 'Usuario no autenticado.',
                forceLogout: true
            });
        }

        try {
            console.log(`Verificando privilegio: '${privilegeName}' para el usuario con roleId: '${user.roleId}'`);

            const result = await pool.query(
                `SELECT COUNT(*)
                 FROM Rol_Privilegio rp
                 JOIN Privilegios p ON rp.priv_id_fk = p.priv_id
                 WHERE rp.rol_id_fk = $1 AND p.priv_nombre = $2`,
                [user.roleId, privilegeName]
            );

            const hasPrivilege = parseInt(result.rows[0].count, 10) > 0;
            
            console.log(`Resultado de la consulta de privilegios: ${result.rows[0].count}`);

            if (hasPrivilege) {
                next();
            } else {
                res.status(403).json({ message: 'Acceso denegado. No tienes los privilegios necesarios.' });
            }
        } catch (error) {
            console.error('Error de autorización:', error);
            res.status(500).json({ message: 'Error de autorización en el servidor.' });
        }
    };
};