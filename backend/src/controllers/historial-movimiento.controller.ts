import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { HistorialMovimiento } from '../models/historial-movimiento.model';
import { PoolClient } from 'pg';




const BASE_QUERY = `
    SELECT 
        hm.*, 
        o.obr_titulo as obra_titulo,
        a.art_nombre as autor_nombre,
        u.usu_nombre_completo as usuario_nombre,
        pe_envia.per_ext_nombre as envia_nombre,
        pe_recibe.per_ext_nombre as recibe_nombre,
        pe_envia.per_ext_cedula as envia_cedula,
        pe_envia.per_ext_telefono as envia_telefono,
        pe_recibe.per_ext_cedula as recibe_cedula,
        pe_recibe.per_ext_telefono as recibe_telefono,
        -- *** CAMPOS AÑADIDOS PARA MEDIDAS ***
        o.obr_alto_cm,
        o.obr_ancho_cm,
        o.obr_profundidad_cm,
        o.obr_diametro_cm,
        -- *** SUBCONSULTA PARA OBTENER TÉCNICAS ***
        (SELECT STRING_AGG(t.tec_nombre, ', ')
         FROM Tecnica t
         JOIN Obra_tecnica ot ON t.tec_id = ot.obr_tec_tec_fk
         WHERE ot.obr_tec_obr_fk = o.obr_id) as obra_tecnicas
    FROM Historial_movimiento hm
    JOIN Obra o ON hm.his_mov_obr_id_fk = o.obr_id
    LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
    JOIN Usuario u ON hm.his_mov_usu_id_fk = u.usu_id
    LEFT JOIN Persona_externa pe_envia ON hm.his_mov_envia_fk = pe_envia.per_ext_id
    LEFT JOIN Persona_externa pe_recibe ON hm.his_mov_recibe_fk = pe_recibe.per_ext_id
`;

// --- NUEVA FUNCIÓN AUXILIAR ---
// Esta función busca una persona externa por su cédula.
// Si no la encuentra, la crea y devuelve el nuevo ID.
// Si no se proporciona una cédula, devuelve null.
const findOrCreatePersonaExterna = async (
    client: PoolClient,
    persona: { nombre: string; cedula: string; telefono: string }
): Promise<number | null> => {
    // Si no hay datos de la persona o no hay cédula, no hacemos nada.
    if (!persona || !persona.cedula) {
        return null;
    }

    // 1. Buscar si la persona ya existe por la cédula.
    const existingPersona = await client.query(
        'SELECT per_ext_id FROM Persona_externa WHERE per_ext_cedula = $1',
        [persona.cedula]
    );

    if (existingPersona.rows.length > 0) {
        // Si existe, devolvemos su ID.
        return existingPersona.rows[0].per_ext_id;
    } else {
        // 2. Si no existe, la creamos.
        const newPersona = await client.query(
            'INSERT INTO Persona_externa (per_ext_nombre, per_ext_cedula, per_ext_telefono) VALUES ($1, $2, $3) RETURNING per_ext_id',
            [persona.nombre, persona.cedula, persona.telefono]
        );
        // Devolvemos el ID de la persona recién creada.
        return newPersona.rows[0].per_ext_id;
    }
};


// --- FUNCIÓN `createHistorialMovimiento` MODIFICADA ---
// Registra un nuevo movimiento para una obra.
export const createHistorialMovimiento = async (req: Request, res: Response) => {
    // Ahora recibimos los objetos completos de `receiver` y `deliverer`
    const {
        his_tip_movimiento,
        his_mov_motiv,
        his_mov_notas,
        his_mov_obr_id_fk,
        his_mov_usu_id_fk,
        receiver, // <-- Objeto con { nombre, cedula, telefono }
        deliverer // <-- Objeto con { nombre, cedula, telefono }
    } = req.body;

    if (!his_tip_movimiento || !his_mov_obr_id_fk || !his_mov_usu_id_fk) {
        return res.status(400).json({ message: 'El tipo de movimiento, la obra y el usuario son campos obligatorios.' });
    }

    const his_mov_fecha = new Date();
    const client = await pool.connect(); // Obtenemos un cliente de la pool para la transacción

    try {
        // Iniciamos la transacción
        await client.query('BEGIN');

        // Buscamos o creamos al receptor y obtenemos su ID
        const recibeId = await findOrCreatePersonaExterna(client, receiver);
        // Buscamos o creamos al entregador y obtenemos su ID
        const enviaId = await findOrCreatePersonaExterna(client, deliverer);

        // Creamos el query para insertar el movimiento con los IDs correctos
        const queryText = `
            INSERT INTO Historial_movimiento (
                his_mov_fecha, his_tip_movimiento, his_mov_motiv, his_mov_notas,
                his_mov_obr_id_fk, his_mov_envia_fk, his_mov_usu_id_fk, his_mov_recibe_fk
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            his_mov_fecha,
            his_tip_movimiento,
            his_mov_motiv,
            his_mov_notas,
            his_mov_obr_id_fk,
            enviaId, // <-- Usamos el ID del entregador
            his_mov_usu_id_fk,
            recibeId  // <-- Usamos el ID del receptor
        ];

        const newMovimiento = await client.query<HistorialMovimiento>(queryText, values);

        // Si todo fue bien, confirmamos la transacción
        await client.query('COMMIT');

        res.status(201).json(newMovimiento.rows[0]);

    } catch (error) {
        // Si algo falla, revertimos todos los cambios
        await client.query('ROLLBACK');
        console.error('Error al crear movimiento:', error);
        res.status(500).json({ message: 'Error en el servidor al crear el movimiento.' });
    } finally {
        // Liberamos el cliente para que vuelva a la pool
        client.release();
    }
};

// Obtiene todos los movimientos de una obra específica.
export const getHistorialByObraId = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const query = `${BASE_QUERY} WHERE hm.his_mov_obr_id_fk = $1 ORDER BY hm.his_mov_fecha DESC`;
        const historial = await pool.query(query, [id]);
        res.status(200).json(historial.rows);
    } catch (error) {
        console.error('Error al obtener historial por obra:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
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
        const query = `${BASE_QUERY} ORDER BY hm.his_mov_fecha DESC`;
        const historial = await pool.query(query);
        res.status(200).json(historial.rows);
    } catch (error) {
        console.error('Error al obtener todo el historial:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};