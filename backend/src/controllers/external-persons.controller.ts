import { Request, Response } from 'express';
import { pool } from '../db/pool';

/**
 * Obtiene TODAS las personas externas, sin importar si están en el directorio.
 * Útil para autocompletados en formularios.
 */
export const getAllExternalPersons = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT per_ext_id, per_ext_nombre, per_ext_cedula, per_ext_telefono, per_ext_agregado_directorio
            FROM Persona_externa 
            ORDER BY per_ext_nombre ASC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener personas externas:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener las personas externas.' });
    }
};

/**
 * ========================================================================
 * FUNCIÓN CORREGIDA
 * Obtiene solo las personas que tienen el atributo 'per_ext_agregado_directorio' en TRUE.
 * La consulta es ahora mucho más simple y directa.
 * ========================================================================
 */
export const getDirectoryContacts = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT per_ext_id, per_ext_nombre, per_ext_cedula, per_ext_telefono
            FROM Persona_externa
            WHERE per_ext_agregado_directorio = TRUE
            ORDER BY per_ext_nombre ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener contactos del directorio:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener el directorio.' });
    }
};

/**
 * ========================================================================
 * NUEVA FUNCIÓN
 * Cambia el estado (agrega/quita) de una persona en el directorio.
 * Esta función reemplaza la lógica anterior de 'removeFromDirectory'.
 * ========================================================================
 */
export const toggleDirectoryStatus = async (req: Request, res: Response) => {
    const { id } = req.params; // ID de la Persona Externa (per_ext_id)
    try {
        const result = await pool.query(
            `UPDATE Persona_externa 
             SET per_ext_agregado_directorio = NOT per_ext_agregado_directorio 
             WHERE per_ext_id = $1 
             RETURNING per_ext_agregado_directorio`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        res.status(200).json({ newStatus: result.rows[0].per_ext_agregado_directorio });
    } catch (error) {
        console.error('Error al cambiar el estado del directorio de la persona:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el estado.' });
    }
};

// La función 'removeFromDirectory' ya no es necesaria con este nuevo enfoque y puede ser eliminada.