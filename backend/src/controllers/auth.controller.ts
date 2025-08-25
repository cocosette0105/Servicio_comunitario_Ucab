// backend/src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { env } from '../config/env';

// Verificamos que JWT_SECRET esté definido
if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno.');
}

// Define la interfaz para el payload del JWT
interface UserPayload {
  id: number;
  username: string;
  roleId: number;
}

// Extiende la interfaz de Request de Express para agregar la propiedad 'user'.
// Esto resuelve los errores de tipado en los middlewares.
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Maneja el inicio de sesión de un usuario.
 */
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

        const payload: UserPayload = {
            id: user.usu_id,
            username: user.usu_nombre_usuario,
            roleId: user.rol_id,
        };

        // Pasamos env.JWT_SECRET con una aserción de no-nulo (!)
        // porque ya verificamos que existe al inicio del archivo.
        const token = jwt.sign(payload, env.JWT_SECRET!, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.usu_id,
                username: user.usu_nombre_usuario,
                name: user.usu_nombre_completo,
                role: user.rol_nombre
            }
        });

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

/**
 * Middleware para proteger rutas.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    // Usamos una aserción de no-nulo para JWT_SECRET
    jwt.verify(token, env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado.' });
        }
        req.user = user as UserPayload;
        next();
    });
};

/**
 * Middleware para verificar si el usuario tiene un privilegio específico.
 */
export const authorize = (privilegeName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }

        try {
            // Añade este log para ver qué valores se están usando
            console.log(`Verificando privilegio: '${privilegeName}' para el usuario con roleId: '${user.roleId}'`);

            const result = await pool.query(
                `SELECT COUNT(*)
                 FROM Rol_Privilegio rp
                 JOIN Privilegios p ON rp.priv_id_fk = p.priv_id
                 WHERE rp.rol_id_fk = $1 AND p.priv_nombre = $2`,
                [user.roleId, privilegeName]
            );

            const hasPrivilege = parseInt(result.rows[0].count, 10) > 0;
            
            // Añade este log para ver el resultado de la consulta
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
