import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { HistorialMovimiento } from '../models/historial-movimiento.model';

// Registra un nuevo movimiento para una obra.
export const createHistorialMovimiento = async (req: Request, res: Response) => {
    const { his_tip_movimiento, his_mov_motiv, his_mov_notas, his_mov_obr_id_fk, his_mov_envia_fk, his_mov_usu_id_fk, his_mov_recibe_fk } = req.body;

    if (!his_tip_movimiento || !his_mov_obr_id_fk || !his_mov_usu_id_fk) {
        return res.status(400).json({ message: 'El tipo de movimiento, la obra y el usuario son campos obligatorios.' });
    }

    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    // Usamos new Date() que genera una fecha y hora completas (timestamp).
    const his_mov_fecha = new Date();

    try {
        const newMovimiento = await pool.query<HistorialMovimiento>(
            `INSERT INTO Historial_movimiento (
                his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas, 
                his_mov_obr_id_fk, his_mov_envia_fk, his_mov_usu_id_fk, his_mov_recibe_fk
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas, his_mov_obr_id_fk, his_mov_envia_fk, his_mov_usu_id_fk, his_mov_recibe_fk]
        );

        res.status(201).json({ message: 'Movimiento registrado exitosamente.', movimiento: newMovimiento.rows[0] });

    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al registrar el movimiento.' });
    }
};
// Obtiene todos los movimientos de una obra específica.
export const getHistorialByObraId = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
        // Se añade el JOIN con la tabla Artista para obtener el nombre del autor.
        const historial = await pool.query(
            `SELECT 
                hm.*, 
                o.obr_titulo as obra_titulo, 
                a.art_nombre as autor_nombre, -- <-- ESTA LÍNEA ES NUEVA
                u.usu_nombre_completo as usuario_nombre,
                pe_envia.per_ext_nombre as envia_nombre,
                pe_recibe.per_ext_nombre as recibe_nombre
             FROM Historial_movimiento hm
             JOIN Obra o ON hm.his_mov_obr_id_fk = o.obr_id
             LEFT JOIN Artista a ON o.obr_art_fk = a.art_id -- <-- ESTA LÍNEA ES NUEVA
             JOIN Usuario u ON hm.his_mov_usu_id_fk = u.usu_id
             LEFT JOIN Persona_externa pe_envia ON hm.his_mov_envia_fk = pe_envia.per_ext_id
             LEFT JOIN Persona_externa pe_recibe ON hm.his_mov_recibe_fk = pe_recibe.per_ext_id
             WHERE hm.his_mov_obr_id_fk = $1
             ORDER BY hm.his_mov_fecha DESC`,
            [id]
        );

        res.status(200).json(historial.rows);

    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener el historial.' });
    }
};

// Actualiza un movimiento existente.
export const updateHistorialMovimiento = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { his_tip_movimiento, his_mov_motiv, his_mov_notas, his_mov_recibe_fk } = req.body;

    try {
        // NOTA: Esta consulta asume que se actualiza por el ID de la obra, lo cual podría
        // afectar a múltiples registros. Sería ideal tener un ID único por movimiento.
        const updatedMovimiento = await pool.query<HistorialMovimiento>(
            `UPDATE Historial_movimiento 
             SET his_tip_movimiento = $1, his_mov_motiv = $2, his_mov_notas = $3, his_mov_recibe_fk = $4
             WHERE his_mov_obr_id_fk = $5 RETURNING *`,
            [his_tip_movimiento, his_mov_motiv, his_mov_notas, his_mov_recibe_fk, id]
        );

        if (updatedMovimiento.rowCount === 0) {
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        res.status(200).json({ message: 'Movimiento actualizado exitosamente.', movimiento: updatedMovimiento.rows[0] });

    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el movimiento.' });
    }
};

// Elimina un movimiento.
export const deleteHistorialMovimiento = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const deleteOp = await pool.query('DELETE FROM Historial_movimiento WHERE his_mov_obr_id_fk = $1', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        res.status(200).json({ message: 'Movimiento eliminado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al eliminar el movimiento.' });
    }
};

export const getAllHistorialMovimientos = async (req: Request, res: Response) => {
    try {
        const historial = await pool.query(
            `SELECT 
                hm.*, 
                o.obr_titulo as obra_titulo,
                a.art_nombre as autor_nombre,
                u.usu_nombre_completo as usuario_nombre,
                pe_envia.per_ext_nombre as envia_nombre,
                pe_recibe.per_ext_nombre as recibe_nombre
             FROM Historial_movimiento hm
             JOIN Obra o ON hm.his_mov_obr_id_fk = o.obr_id
             LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
             JOIN Usuario u ON hm.his_mov_usu_id_fk = u.usu_id
             LEFT JOIN Persona_externa pe_envia ON hm.his_mov_envia_fk = pe_envia.per_ext_id
             LEFT JOIN Persona_externa pe_recibe ON hm.his_mov_recibe_fk = pe_recibe.per_ext_id
             ORDER BY hm.his_mov_fecha DESC`
        );
        res.status(200).json(historial.rows);
    } catch (error) {
        console.error('Error al obtener todo el historial:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener el historial.' });
    }
};
