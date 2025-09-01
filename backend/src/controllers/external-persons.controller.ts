// backend/src/controllers/external-persons.controller.ts
// Controlador para la gestión de personas externas registradas en la base de datos

import { Request, Response } from 'express';
import { pool } from '../db/pool';

/**
 * Obtiene todas las personas externas registradas en la base de datos
 * Estas personas se crean automáticamente al registrar movimientos
 * @param req - Request object de Express
 * @param res - Response object de Express
 */
export const getAllExternalPersons = async (req: Request, res: Response) => {
    try {
        // Consulta para obtener todas las personas externas ordenadas por nombre
        const query = `
            SELECT 
                per_ext_id,
                per_ext_nombre,
                per_ext_cedula,
                per_ext_telefono
            FROM Persona_externa 
            ORDER BY per_ext_nombre ASC
        `;
        
        const result = await pool.query(query);
        
        // Retorna la lista de personas externas
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener personas externas:', error);
        res.status(500).json({ 
            message: 'Error en el servidor al obtener las personas externas.',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

export const deleteExternalPerson = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Opcional: Verificar si la persona está siendo usada en algún movimiento.
        // Si se elimina, podría quedar un registro de movimiento sin referencia.
        // Por simplicidad, aquí la eliminaremos directamente.

        const deleteQuery = 'DELETE FROM Persona_externa WHERE per_ext_id = $1';
        const result = await pool.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        res.status(200).json({ message: 'Persona eliminada exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar persona externa:', error);
        res.status(500).json({ message: 'Error en el servidor al eliminar la persona externa.' });
    }
};