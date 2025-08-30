// backend/src/controllers/maintenance.controller.ts

import { Request, Response } from 'express';
import { pool } from '../db/pool';

// GET: Obtener todos los registros de mantenimiento (CORREGIDO)
export const getAllMaintenanceRecords = async (req: Request, res: Response) => {
    try {
        // Se ajusta la consulta para que coincida con la nueva interfaz del frontend
        const result = await pool.query(`
            SELECT 
                hm.his_man_id AS "id",
                hm.his_man_fecha AS "date",
                hm.his_man_categoria AS "maintenanceCategory",
                hm.his_man_descripcion_intervencion AS "interventionDescription",
                hm.his_man_precio AS "currentPrice",
                o.obr_id AS "workId",
                o.obr_titulo AS "workName",
                o.obr_fecha_realizacion AS "year",
                o.obr_alto_cm,
                o.obr_ancho_cm,
                o.obr_profundidad_cm,
                o.obr_diametro_cm,
                u.usu_nombre_completo AS "userName",
                a.art_nombre AS "author",
                c.cla_nombre AS "workType",
                (SELECT STRING_AGG(t.tec_nombre, ', ') 
                 FROM Tecnica t
                 JOIN Obra_tecnica ot ON t.tec_id = ot.obr_tec_tec_fk
                 WHERE ot.obr_tec_obr_fk = o.obr_id) AS "technique"
            FROM Historial_mantenimiento hm
            JOIN Obra o ON hm.his_man_obr_fk = o.obr_id
            JOIN Usuario u ON hm.his_man_usu_fk = u.usu_id
            JOIN Artista a ON o.obr_art_fk = a.art_id
            JOIN Clasificacion c ON o.obr_cla_fk = c.cla_id
            ORDER BY hm.his_man_fecha DESC
        `);

        // Procesar dimensiones en el backend para simplificar el frontend
        const recordsWithDimensions = result.rows.map(record => {
            const dims = [];
            if (record.obr_alto_cm) dims.push(`Alto: ${record.obr_alto_cm} cm`);
            if (record.obr_ancho_cm) dims.push(`Ancho: ${record.obr_ancho_cm} cm`);
            if (record.obr_profundidad_cm) dims.push(`Prof: ${record.obr_profundidad_cm} cm`);
            if (record.obr_diametro_cm) dims.push(`Diám: ${record.obr_diametro_cm} cm`);
            
            return {
                ...record,
                dimensions: dims.join(' | ')
            };
        });

        res.json(recordsWithDimensions);

    } catch (error) {
        console.error('Error al obtener registros de mantenimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST: Crear un nuevo registro (CORREGIDO para usar los nuevos nombres de campo)
export const createMaintenanceRecord = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id; 
    const {
        workId,
        date,
        maintenanceCategory, // Nombre actualizado
        interventionDescription, // Nombre actualizado
        currentPrice // Nombre actualizado
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO Historial_mantenimiento 
             (his_man_obr_fk, his_man_fecha, his_man_categoria, his_man_descripcion_intervencion, his_man_precio, his_man_usu_fk) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [workId, date, maintenanceCategory, interventionDescription, currentPrice, userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear registro de mantenimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT: Actualizar un registro (CORREGIDO para usar los nuevos nombres de campo)
export const updateMaintenanceRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        workId,
        date,
        maintenanceCategory, // Nombre actualizado
        interventionDescription, // Nombre actualizado
        currentPrice // Nombre actualizado
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE Historial_mantenimiento
             SET his_man_obr_fk = $1, his_man_fecha = $2, his_man_categoria = $3, his_man_descripcion_intervencion = $4, his_man_precio = $5
             WHERE his_man_id = $6`,
            [workId, date, maintenanceCategory, interventionDescription, currentPrice, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }

        res.json({ message: 'Registro actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar registro de mantenimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// DELETE: Eliminar un registro de mantenimiento
export const deleteMaintenanceRecord = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM Historial_mantenimiento WHERE his_man_id = $1',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }
        res.status(204).send(); // 204 No Content es una respuesta común para DELETE exitoso
    } catch (error) {
        console.error('Error al eliminar registro de mantenimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};