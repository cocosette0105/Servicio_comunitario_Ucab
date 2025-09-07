import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { PoolClient } from 'pg';

// ========================================================================
// 1. BASE_QUERY ACTUALIZADA
// Se elimina hm.his_mov_agregado_directorio
// Se añaden pe_envia.per_ext_agregado_directorio y pe_recibe.per_ext_agregado_directorio
// ========================================================================
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
        
        -- Datos del Entregador (envia)
        pe_envia.per_ext_id as envia_id,
        pe_envia.per_ext_nombre as envia_nombre,
        pe_envia.per_ext_cedula as envia_cedula,
        pe_envia.per_ext_telefono as envia_telefono,
        pe_envia.per_ext_agregado_directorio as envia_agregado_directorio,

        -- Datos del Receptor (recibe)
        pe_recibe.per_ext_id as recibe_id,
        pe_recibe.per_ext_nombre as recibe_nombre,
        pe_recibe.per_ext_cedula as recibe_cedula,
        pe_recibe.per_ext_telefono as recibe_telefono,
        pe_recibe.per_ext_agregado_directorio as recibe_agregado_directorio,

        o.obr_alto_cm,
        o.obr_ancho_cm,
        o.obr_profundidad_cm,
        o.obr_diametro_cm,
        STRING_AGG(DISTINCT t.tec_nombre, ', ') as tecnicas,
        STRING_AGG(DISTINCT m.mat_nombre, ', ') as materiales,
        o.obr_url_foto
    FROM Historial_movimiento hm
    JOIN Obra o ON hm.his_mov_obr_id_fk = o.obr_id
    JOIN Usuario u ON hm.his_mov_usu_id_fk = u.usu_id
    LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
    LEFT JOIN Persona_externa pe_envia ON hm.his_mov_envia_fk = pe_envia.per_ext_id
    LEFT JOIN Persona_externa pe_recibe ON hm.his_mov_recibe_fk = pe_recibe.per_ext_id
    LEFT JOIN Obra_tecnica ot ON o.obr_id = ot.obr_tec_obr_fk
    LEFT JOIN Tecnica t ON ot.obr_tec_tec_fk = t.tec_id
    LEFT JOIN Obra_material om ON o.obr_id = om.obr_id_fk
    LEFT JOIN Material m ON om.mat_id_fk = m.mat_id
`;

const GROUP_BY_CLAUSE = `
    GROUP BY 
        hm.his_mov_id, o.obr_id, a.art_nombre, u.usu_nombre_completo, 
        pe_envia.per_ext_id, pe_recibe.per_ext_id
`;

const findOrCreatePerson = async (client: PoolClient, person: { nombre: string; cedula: string; telefono: string; }): Promise<number> => {
    const personResult = await client.query(
        'SELECT per_ext_id, per_ext_nombre FROM Persona_externa WHERE per_ext_cedula = $1',
        [person.cedula]
    );

    if (personResult.rows.length > 0) {
        const existingPerson = personResult.rows[0];
        if (existingPerson.per_ext_nombre.toLowerCase().trim() !== person.nombre.toLowerCase().trim()) {
            throw new Error(`La cédula ${person.cedula} ya pertenece a "${existingPerson.per_ext_nombre}".`);
        } else {
            return existingPerson.per_ext_id;
        }
    } else {
        const newPersonResult = await client.query(
            'INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id',
            [person.nombre, person.cedula, person.telefono]
        );
        return newPersonResult.rows[0].per_ext_id;
    }
};

// ========================================================================
// 2. createHistorialMovimiento SIMPLIFICADA
// Se elimina toda la lógica relacionada con his_mov_agregado_directorio
// ========================================================================
export const createHistorialMovimiento = async (req: Request, res: Response) => {
    const {
        his_mov_fecha,
        his_tip_movimiento,
        his_mov_motiv,
        his_mov_notas,
        his_mov_obr_id_fk,
        his_mov_usu_id_fk,
        his_mov_coleccion,
        his_mov_descripcion_estado,
        receiver,
        deliverer
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let envia_fk = null;
        let recibe_fk = null;

        if (deliverer && deliverer.cedula) {
            envia_fk = await findOrCreatePerson(client, deliverer);
        }
        
        if (receiver && receiver.cedula) {
            recibe_fk = await findOrCreatePerson(client, receiver);
        }
        
        const insertQuery = `
            INSERT INTO Historial_movimiento (
                his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas, 
                his_mov_obr_id_fk, his_mov_usu_id_fk, his_mov_envia_fk, his_mov_recibe_fk,
                his_mov_coleccion, his_mov_descripcion_estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING his_mov_id;
        `;
        const result = await client.query(insertQuery, [
            his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas,
            his_mov_obr_id_fk, his_mov_usu_id_fk, envia_fk, recibe_fk,
            his_mov_coleccion, his_mov_descripcion_estado
        ]);

        const newMovementId = result.rows[0].his_mov_id;
        const fullQuery = `${BASE_QUERY} WHERE hm.his_mov_id = $1 ${GROUP_BY_CLAUSE}`;
        const newMovement = await client.query(fullQuery, [newMovementId]);

        await client.query('COMMIT');
        res.status(201).json(newMovement.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear movimiento:', error);
        
        if (error instanceof Error) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error en el servidor' });
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
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let envia_fk = null;
        let recibe_fk = null;
        
        if (deliverer && deliverer.cedula) {
            envia_fk = await findOrCreatePerson(client, deliverer);
        }
        
        if (receiver && receiver.cedula) {
            recibe_fk = await findOrCreatePerson(client, receiver);
        }

        const updateQuery = `
            UPDATE Historial_movimiento SET 
                his_tip_movimiento = $1, his_mov_motiv = $2, his_mov_notas = $3,
                his_mov_envia_fk = $4, his_mov_recibe_fk = $5, his_mov_coleccion = $6,
                his_mov_descripcion_estado = $7
            WHERE his_mov_id = $8;
        `;
        await client.query(updateQuery, [
            his_tip_movimiento, his_mov_motiv, his_mov_notas, envia_fk, recibe_fk,
            his_mov_coleccion, his_mov_descripcion_estado, id
        ]);

        const fullQuery = `${BASE_QUERY} WHERE hm.his_mov_id = $1 ${GROUP_BY_CLAUSE}`;
        const updatedMovement = await client.query(fullQuery, [id]);

        await client.query('COMMIT');
        res.status(200).json(updatedMovement.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar movimiento:', error);
        
        if (error instanceof Error) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error en el servidor' });
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
}