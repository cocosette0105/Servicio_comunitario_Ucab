// backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { pool } from '../db/pool';
import bcrypt from 'bcrypt';

// Obtener todos los usuarios del sistema con su rol
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await pool.query(
            `SELECT u.usu_id, u.usu_nombre_completo, u.usu_nombre_usuario, u.usu_fecha_creacion, u.usu_esta_activo, r.rol_nombre AS usu_rol
             FROM Usuario u
             JOIN Rol r ON u.usu_rol_id_fk = r.rol_id
             ORDER BY u.usu_fecha_creacion DESC`
        );
        res.status(200).json(users.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener usuarios.' });
    }
};

// Crear un nuevo usuario
export const createUser = async (req: Request, res: Response) => {
    const { fullName, username, password, role } = req.body;

    // Verificación básica de datos de entrada
    if (!fullName || !username || !password || !role) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Obtener el ID del rol basado en el nombre
        const roleResult = await pool.query('SELECT rol_id FROM Rol WHERE rol_nombre = $1', [role]);
        const roleId = roleResult.rows[0]?.rol_id;

        if (!roleId) {
            return res.status(400).json({ message: 'Rol inválido.' });
        }

        // Insertar el nuevo usuario en la base de datos
        const newUser = await pool.query(
            `INSERT INTO Usuario (usu_nombre_completo, usu_nombre_usuario, usu_contraseña, usu_rol_id_fk)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [fullName, username, hashedPassword, roleId]
        );

        res.status(201).json({ message: 'Usuario creado exitosamente.', user: newUser.rows[0] });

    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        // Manejar error de duplicación de usuario de manera específica
        if (error.code === '23505') { // Código de error de duplicación de PostgreSQL
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: 'Error en el servidor al crear usuario.' });
    }
};

// Actualizar un usuario existente
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, username, password, role, isActive } = req.body;

    try {
        let updatePassword = '';
        if (password) {
            // Si se proporciona una nueva contraseña, la encriptamos
            const salt = await bcrypt.genSalt(10);
            updatePassword = await bcrypt.hash(password, salt);
        }

        const roleResult = await pool.query('SELECT rol_id FROM Rol WHERE rol_nombre = $1', [role]);
        const roleId = roleResult.rows[0]?.rol_id;

        if (!roleId) {
            return res.status(400).json({ message: 'Rol inválido.' });
        }

        const updatedUser = await pool.query(
            `UPDATE Usuario
             SET usu_nombre_completo = $1, usu_nombre_usuario = $2, usu_contraseña = COALESCE($3, usu_contraseña), usu_rol_id_fk = $4, usu_esta_activo = $5
             WHERE usu_id = $6
             RETURNING *`,
            [fullName, username, updatePassword || null, roleId, isActive, id]
        );

        if (updatedUser.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: updatedUser.rows[0] });

    } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: 'Error en el servidor al actualizar usuario.' });
    }
};

// Eliminar un usuario
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const deletedUser = await pool.query(
            'DELETE FROM Usuario WHERE usu_id = $1 RETURNING *',
            [id]
        );

        if (deletedUser.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Usuario eliminado exitosamente.', user: deletedUser.rows[0] });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor al eliminar usuario.' });
    }
};

// Activar/desactivar un usuario
export const toggleUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const updatedUser = await pool.query(
            `UPDATE Usuario
             SET usu_esta_activo = $1
             WHERE usu_id = $2
             RETURNING *`,
            [isActive, id]
        );

        if (updatedUser.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Estado del usuario actualizado.', user: updatedUser.rows[0] });

    } catch (error) {
        console.error('Error al cambiar el estado del usuario:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
