import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { PoolClient } from 'pg';

// CONSULTA BASE (SIN CAMBIOS)
const BASE_QUERY = `
    SELECT 
        hm.his_mov_id,
        hm.his_mov_fecha,
        hm.his_tip_movimiento,
        hm.his_mov_motiv,
        hm.his_mov_notas,
        hm.his_mov_coleccion,
        hm.his_mov_descripcion_estado,
        hm.his_mov_obr_id_fk,
        hm.his_mov_usu_id_fk,
        o.obr_titulo as obra_titulo,
        a.art_nombre as autor_nombre,
        u.usu_nombre_completo as usuario_nombre,
        pe_envia.per_ext_nombre as envia_nombre,
        pe_recibe.per_ext_nombre as recibe_nombre,
        pe_envia.per_ext_cedula as envia_cedula,
        pe_envia.per_ext_telefono as envia_telefono,
        pe_recibe.per_ext_cedula as recibe_cedula,
        pe_recibe.per_ext_telefono as recibe_telefono,
        o.obr_alto_cm,
        o.obr_ancho_cm,
        o.obr_profundidad_cm,
        o.obr_diametro_cm,
        STRING_AGG(DISTINCT tec.tec_nombre, ', ') as tecnica_nombre
    FROM Historial_movimiento hm
    JOIN Obra o ON hm.his_mov_obr_id_fk = o.obr_id
    JOIN Usuario u ON hm.his_mov_usu_id_fk = u.usu_id
    LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
    LEFT JOIN Persona_externa pe_envia ON hm.his_mov_envia_fk = pe_envia.per_ext_id
    LEFT JOIN Persona_externa pe_recibe ON hm.his_mov_recibe_fk = pe_recibe.per_ext_id
    LEFT JOIN Obra_tecnica ot ON o.obr_id = ot.obr_tec_obr_fk
    LEFT JOIN Tecnica tec ON ot.obr_tec_tec_fk = tec.tec_id
`;

const GROUP_BY_CLAUSE = `
    GROUP BY
        hm.his_mov_id, o.obr_titulo, a.art_nombre, u.usu_nombre_completo,
        pe_envia.per_ext_nombre, pe_recibe.per_ext_nombre, pe_envia.per_ext_cedula,
        pe_envia.per_ext_telefono, pe_recibe.per_ext_cedula, pe_recibe.per_ext_telefono,
        o.obr_alto_cm, o.obr_ancho_cm, o.obr_profundidad_cm, o.obr_diametro_cm
`;

export const createHistorialMovimiento = async (req: Request, res: Response) => {
    const {
        his_tip_movimiento,
        his_mov_motiv,
        his_mov_notas,
        his_mov_coleccion,
        his_mov_descripcion_estado,
        his_mov_obr_id_fk,
        his_mov_usu_id_fk,
        receiver, 
        deliverer
    } = req.body;

    const client: PoolClient = await pool.connect();

    try {
        await client.query('BEGIN');

        let enviaFk = null;
        let recibeFk = null;

        // ================== CORRECCIÓN DEFINITIVA ==================
        // Se elimina la condición del tipo de movimiento. 
        // Si se envía un 'deliverer' con cédula, se procesa.
        if (deliverer && deliverer.cedula) {
            let result = await client.query('SELECT per_ext_id FROM Persona_externa WHERE per_ext_cedula = $1', [deliverer.cedula]);
            if (result.rows.length > 0) {
                enviaFk = result.rows[0].per_ext_id;
            } else {
                result = await client.query(
                    'INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id',
                    [deliverer.nombre, deliverer.cedula, deliverer.telefono]
                );
                enviaFk = result.rows[0].per_ext_id;
            }
        }

        // Se elimina la condición del tipo de movimiento. 
        // Si se envía un 'receiver' con cédula, se procesa.
        if (receiver && receiver.cedula) {
             let result = await client.query('SELECT per_ext_id FROM Persona_externa WHERE per_ext_cedula = $1', [receiver.cedula]);
            if (result.rows.length > 0) {
                recibeFk = result.rows[0].per_ext_id;
            } else {
                result = await client.query(
                    'INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id',
                    [receiver.nombre, receiver.cedula, receiver.telefono]
                );
                recibeFk = result.rows[0].per_ext_id;
            }
        }
        // ==========================================================
        
        const insertQuery = `
            INSERT INTO Historial_movimiento (
                his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas,
                his_mov_coleccion, his_mov_descripcion_estado, 
                his_mov_obr_id_fk, his_mov_usu_id_fk, his_mov_envia_fk, his_mov_recibe_fk
            ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING his_mov_id;
        `;
        
        const values = [
            his_tip_movimiento, his_mov_motiv, his_mov_notas,
            his_mov_coleccion, his_mov_descripcion_estado,
            his_mov_obr_id_fk, his_mov_usu_id_fk, enviaFk, recibeFk
        ];

        const newMovement = await client.query(insertQuery, values);
        const newMovementId = newMovement.rows[0].his_mov_id;

        const resultQuery = `${BASE_QUERY} WHERE hm.his_mov_id = $1 ${GROUP_BY_CLAUSE}`;
        const { rows } = await client.query(resultQuery, [newMovementId]);
        
        await client.query('COMMIT');
        res.status(201).json(rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al crear el movimiento.' });
    } finally {
        client.release();
    }
};

export const updateHistorialMovimiento = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        his_tip_movimiento,
        his_mov_motiv,
        his_mov_notas,
        his_mov_coleccion,
        his_mov_descripcion_estado,
        receiver,
        deliverer
    } = req.body;

    const client: PoolClient = await pool.connect();

    try {
        await client.query('BEGIN');
        
        let enviaFk = null;
        let recibeFk = null;
        
        // Se elimina la condición del tipo de movimiento también en la actualización.
        if (deliverer && deliverer.cedula) {
            let result = await client.query('SELECT per_ext_id FROM Persona_externa WHERE per_ext_cedula = $1', [deliverer.cedula]);
            if (result.rows.length > 0) {
                enviaFk = result.rows[0].per_ext_id;
                await client.query('UPDATE Persona_externa SET per_ext_nombre = $1, per_ext_telefono = $2 WHERE per_ext_id = $3', [deliverer.nombre, deliverer.telefono, enviaFk]);
            } else {
                result = await client.query('INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id', [deliverer.nombre, deliverer.cedula, deliverer.telefono]);
                enviaFk = result.rows[0].per_ext_id;
            }
        }

        // Se elimina la condición del tipo de movimiento también en la actualización.
        if (receiver && receiver.cedula) {
            let result = await client.query('SELECT per_ext_id FROM Persona_externa WHERE per_ext_cedula = $1', [receiver.cedula]);
            if (result.rows.length > 0) {
                recibeFk = result.rows[0].per_ext_id;
                await client.query('UPDATE Persona_externa SET per_ext_nombre = $1, per_ext_telefono = $2 WHERE per_ext_id = $3', [receiver.nombre, receiver.telefono, recibeFk]);
            } else {
                result = await client.query('INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id', [receiver.nombre, receiver.cedula, receiver.telefono]);
                recibeFk = result.rows[0].per_ext_id;
            }
        }
        
        const fieldsToUpdate = [
            `his_tip_movimiento = $1`,
            `his_mov_motiv = $2`,
            `his_mov_notas = $3`,
            `his_mov_coleccion = $4`,
            `his_mov_descripcion_estado = $5`,
            `his_mov_envia_fk = $6`,
            `his_mov_recibe_fk = $7`
        ];
        
        const values = [
            his_tip_movimiento, his_mov_motiv, his_mov_notas,
            his_mov_coleccion, his_mov_descripcion_estado,
            enviaFk, recibeFk, id
        ];

        const updateQuery = `
            UPDATE Historial_movimiento
            SET ${fieldsToUpdate.join(', ')}
            WHERE his_mov_id = $8;
        `;
        
        const updateResult = await client.query(updateQuery, values);

        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }
        
        const resultQuery = `${BASE_QUERY} WHERE hm.his_mov_id = $1 ${GROUP_BY_CLAUSE}`;
        const { rows } = await client.query(resultQuery, [id]);

        await client.query('COMMIT');
        res.status(200).json(rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el movimiento.' });
    } finally {
        client.release();
    }
};


export const deleteHistorialMovimiento = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM Historial_movimiento WHERE his_mov_id = $1', [id]);
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
        const query = `${BASE_QUERY} ${GROUP_BY_CLAUSE} ORDER BY hm.his_mov_fecha DESC`;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const getHistorialByObraId = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const query = `${BASE_QUERY} WHERE hm.his_mov_obr_id_fk = $1 ${GROUP_BY_CLAUSE} ORDER BY hm.his_mov_fecha DESC`;
        const { rows } = await pool.query(query, [id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener historial por obra:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};