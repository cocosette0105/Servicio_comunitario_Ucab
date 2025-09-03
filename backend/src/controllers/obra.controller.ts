// backend/src/controllers/obra.controller.ts
import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../db/pool';

// --- Interfaces para los datos que vienen como JSON string del frontend ---
interface Dimensions { height?: string; width?: string; depth?: string; diameter?: string; }
interface Appraisal { value?: string; currency?: string; appraiser?: string; appraisalDate?: string; }
interface Acquisition { acquisitionSource?: string; acquisitionMethod?: string; entryDate?: string; }
interface Inventory { responsible?: string; date?: string; supervisor?: string; supervisorDate?: string; }
interface ConservationState { condition?: string; integrity?: string; }
interface TechnicalData { provenance?: string; culture?: string; eraStyle?: string; originalOwner?: string; }
interface ResponsibleEntity { name?: string; address?: string; }
interface References { documents?: string; bibliography?: string; exhibitions?: string; treatments?: string; }

// --- Funciones auxiliares ---
const safeParse = <T extends object>(value: any, fallback: T): T => {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch { return fallback; }
};

const getOrCreateEntityId = async (client: PoolClient, tableName: string, columnName: string, name: string): Promise<number | null> => {
  if (!name || typeof name !== 'string' || name.trim() === '') return null;
  const trimmedName = name.trim();
  const idColumn = tableName === 'Lugar' ? 'lu_id' : `${tableName.substring(0, 3).toLowerCase()}_id`;
  let res = await client.query(`SELECT ${idColumn} FROM ${tableName} WHERE ${columnName} = $1`, [trimmedName]);
  if (res.rows.length > 0) return res.rows[0][idColumn];
  res = await client.query(`INSERT INTO ${tableName} (${columnName}) VALUES ($1) RETURNING ${idColumn}`, [trimmedName]);
  return res.rows[0][idColumn];
};

// --- Consulta Unificada (para obtener todos los datos de una obra) ---
const fullWorkQuery = `
  SELECT
    o.*,
    a.art_nombre AS artist_name,
    c.cla_nombre AS classification_name,
    l.lu_nombre AS location_name,
    COALESCE((SELECT string_agg(m.mat_nombre, ', ') FROM Obra_material om JOIN Material m ON om.mat_id_fk = m.mat_id WHERE om.obr_id_fk = o.obr_id), '') AS materials_str,
    COALESCE((SELECT string_agg(t.tec_nombre, ', ') FROM Obra_tecnica ot JOIN Tecnica t ON ot.obr_tec_tec_fk = t.tec_id WHERE ot.obr_tec_obr_fk = o.obr_id), '') AS technique_str,
    inv.his_inv_responsable,
    inv.his_inv_fecha,
    inv.his_inv_supervisor,
    inv.his_inv_fecha_supervisor
  FROM Obra o
  LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
  LEFT JOIN Clasificacion c ON o.obr_cla_fk = c.cla_id
  LEFT JOIN Lugar l ON o.obr_lu_fk = l.lu_id
  LEFT JOIN (
    SELECT DISTINCT ON (his_inv_obr_fk) *
    FROM Historial_Inventario
    ORDER BY his_inv_obr_fk, his_inv_fecha DESC, his_inv_id DESC
  ) inv ON inv.his_inv_obr_fk = o.obr_id
`;

// --- Función para procesar y validar los datos del formulario ---
const processWorkData = (body: any) => {
    return {
        inventoryNumber: body.inventoryNumber,
        previousNumbers: body.previousNumbers,
        name: body.name,
        artist: body.artist,
        classification: body.classification,
        realizationDate: body.realizationDate,
        description: body.description,
        signatureDetails: body.signatureDetails,
        observations: body.observations,
        storageLocation: body.storageLocation,
        technique: body.technique?.split(',').map((t: string) => t.trim()) || [],
        materials: body.materials?.split(',').map((m: string) => m.trim()) || [],
        dimensions: safeParse<Dimensions>(body.dimensions, {}),
        appraisal: safeParse<Appraisal>(body.appraisal, {}),
        collection: safeParse<Acquisition>(body.collection, {}),
        inventory: safeParse<Inventory>(body.inventory, {}),
        conservationState: safeParse<ConservationState>(body.conservationState, {}),
        technicalData: safeParse<TechnicalData>(body.technicalData, {}),
        responsibleEntity: safeParse<ResponsibleEntity>(body.responsibleEntity, {}),
        references: safeParse<References>(body.references, {}),
    };
};


// --- CONTROLADORES DE RUTA ---

export const getObras = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`${fullWorkQuery} ORDER BY o.obr_id DESC;`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las obras:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getObraById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`${fullWorkQuery} WHERE o.obr_id = $1;`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Obra no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching work by ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


export const createObra = async (req: Request, res: Response) => {
    const data = processWorkData(req.body);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const artistId = await getOrCreateEntityId(client, 'Artista', 'art_nombre', data.artist);
        const classificationId = await getOrCreateEntityId(client, 'Clasificacion', 'cla_nombre', data.classification);
        const locationId = await getOrCreateEntityId(client, 'Lugar', 'lu_nombre', data.storageLocation);

        const obraQuery = `
            INSERT INTO Obra (
                obr_mcf, obr_numeros_anteriores, obr_titulo, obr_fecha_realizacion, obr_alto_cm,
                obr_ancho_cm, obr_profundidad_cm, obr_diametro_cm, obr_descripcion_formal,
                obr_observaciones, obr_url_foto, obr_estado_condicion, obr_estado_integridad,
                obr_procedencia, obr_cultura_tradicion, obr_epoca_estilo, obr_valor_avaluo,
                obr_moneda_avaluo, obr_responsable_avaluo, obr_fecha_avaluo, obr_propietario_original,
                obr_documentos_relacionados, obr_bibliografia, obr_fecha_ingreso, obr_fuente_adquisicion,
                obr_metodo_adquisicion, obr_entidad_responsable, obr_art_fk, obr_cla_fk, obr_lu_fk,
                obr_detalles_firma, obr_exposiciones, obr_tratamientos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
            RETURNING obr_id;`;

        const obraValues = [
            data.inventoryNumber, data.previousNumbers, data.name, data.realizationDate, data.dimensions.height,
            data.dimensions.width, data.dimensions.depth, data.dimensions.diameter, data.description,
            data.observations, imageUrl, data.conservationState.condition, data.conservationState.integrity,
            data.technicalData.provenance, data.technicalData.culture, data.technicalData.eraStyle, data.appraisal.value,
            data.appraisal.currency, data.appraisal.appraiser, data.appraisal.appraisalDate, data.technicalData.originalOwner,
            data.references.documents, data.references.bibliography, data.collection.entryDate, data.collection.acquisitionSource,
            data.collection.acquisitionMethod, data.responsibleEntity.name, artistId, classificationId, locationId,
            data.signatureDetails, data.references.exhibitions, data.references.treatments
        ];

        const newObra = await client.query(obraQuery, obraValues);
        const newObraId = newObra.rows[0].obr_id;

        if (data.inventory && (data.inventory.date || data.inventory.responsible)) {
            const userId = 1; // Placeholder
            await client.query(
                'INSERT INTO Historial_Inventario (his_inv_fecha, his_inv_responsable, his_inv_supervisor, his_inv_fecha_supervisor, his_inv_obr_fk, his_inv_usu_fk) VALUES ($1, $2, $3, $4, $5, $6)',
                [data.inventory.date || null, data.inventory.responsible, data.inventory.supervisor, data.inventory.supervisorDate || null, newObraId, userId]
            );
        }

        for (const materialName of data.materials) {
            const materialId = await getOrCreateEntityId(client, 'Material', 'mat_nombre', materialName);
            if (materialId) await client.query('INSERT INTO Obra_material (obr_id_fk, mat_id_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newObraId, materialId]);
        }
        for (const techName of data.technique) {
            const techId = await getOrCreateEntityId(client, 'Tecnica', 'tec_nombre', techName);
            if (techId) await client.query('INSERT INTO Obra_tecnica (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newObraId, techId]);
        }

        await client.query('COMMIT');
        const finalNewWork = await client.query(`${fullWorkQuery} WHERE o.obr_id = $1;`, [newObraId]);
        res.status(201).json(finalNewWork.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al crear la obra:", error);
        res.status(500).json({ error: "Error interno al crear la obra" });
    } finally {
        client.release();
    }
};

export const updateObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = processWorkData(req.body);
    let imageUrl = req.body.photoUrl;
    if (req.file) { imageUrl = `/uploads/${req.file.filename}`; }
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const artistId = await getOrCreateEntityId(client, 'Artista', 'art_nombre', data.artist);
        const classificationId = await getOrCreateEntityId(client, 'Clasificacion', 'cla_nombre', data.classification);
        const locationId = await getOrCreateEntityId(client, 'Lugar', 'lu_nombre', data.storageLocation);

        const updateQuery = `
            UPDATE Obra SET
                obr_mcf = $1, obr_numeros_anteriores = $2, obr_titulo = $3, obr_fecha_realizacion = $4, obr_alto_cm = $5,
                obr_ancho_cm = $6, obr_profundidad_cm = $7, obr_diametro_cm = $8, obr_descripcion_formal = $9,
                obr_observaciones = $10, obr_url_foto = $11, obr_estado_condicion = $12, obr_estado_integridad = $13,
                obr_procedencia = $14, obr_cultura_tradicion = $15, obr_epoca_estilo = $16, obr_valor_avaluo = $17,
                obr_moneda_avaluo = $18, obr_responsable_avaluo = $19, obr_fecha_avaluo = $20, obr_propietario_original = $21,
                obr_documentos_relacionados = $22, obr_bibliografia = $23, obr_fecha_ingreso = $24, obr_fuente_adquisicion = $25,
                obr_metodo_adquisicion = $26, obr_entidad_responsable = $27, obr_art_fk = $28, obr_cla_fk = $29, obr_lu_fk = $30,
                obr_detalles_firma = $31, obr_exposiciones = $32, obr_tratamientos = $33
            WHERE obr_id = $34;`;

        const updateValues = [
            data.inventoryNumber, data.previousNumbers, data.name, data.realizationDate, data.dimensions.height,
            data.dimensions.width, data.dimensions.depth, data.dimensions.diameter, data.description,
            data.observations, imageUrl, data.conservationState.condition, data.conservationState.integrity,
            data.technicalData.provenance, data.technicalData.culture, data.technicalData.eraStyle, data.appraisal.value,
            data.appraisal.currency, data.appraisal.appraiser, data.appraisal.appraisalDate, data.technicalData.originalOwner,
            data.references.documents, data.references.bibliography, data.collection.entryDate, data.collection.acquisitionSource,
            data.collection.acquisitionMethod, data.responsibleEntity.name, artistId, classificationId, locationId,
            data.signatureDetails, data.references.exhibitions, data.references.treatments,
            id
        ];
        
        await client.query(updateQuery, updateValues);
        
        // Se añade un NUEVO registro de inventario si se proporcionan datos
        if (data.inventory && (data.inventory.date || data.inventory.responsible)) {
            const userId = 1; // Placeholder
            await client.query(
                'INSERT INTO Historial_Inventario (his_inv_fecha, his_inv_responsable, his_inv_supervisor, his_inv_fecha_supervisor, his_inv_obr_fk, his_inv_usu_fk) VALUES ($1, $2, $3, $4, $5, $6)',
                [data.inventory.date || null, data.inventory.responsible, data.inventory.supervisor, data.inventory.supervisorDate || null, id, userId]
            );
        }
        
        // Se actualizan relaciones N:N
        await client.query('DELETE FROM Obra_material WHERE obr_id_fk = $1', [id]);
        for (const materialName of data.materials) {
            const materialId = await getOrCreateEntityId(client, 'Material', 'mat_nombre', materialName);
            if (materialId) await client.query('INSERT INTO Obra_material (obr_id_fk, mat_id_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, materialId]);
        }
        await client.query('DELETE FROM Obra_tecnica WHERE obr_tec_obr_fk = $1', [id]);
        for (const techName of data.technique) {
            const techId = await getOrCreateEntityId(client, 'Tecnica', 'tec_nombre', techName);
            if (techId) await client.query('INSERT INTO Obra_tecnica (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, techId]);
        }
        
        await client.query('COMMIT');
        const finalUpdatedWork = await client.query(`${fullWorkQuery} WHERE o.obr_id = $1;`, [id]);
        res.status(200).json(finalUpdatedWork.rows[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error al actualizar la obra:", error);
        res.status(500).json({ error: "Error interno al actualizar la obra" });
    } finally {
        client.release();
    }
};

export const deleteObra = async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM Historial_Inventario WHERE his_inv_obr_fk = $1', [id]);
        await client.query('DELETE FROM Obra_material WHERE obr_id_fk = $1', [id]);
        await client.query('DELETE FROM Obra_tecnica WHERE obr_tec_obr_fk = $1', [id]);
        const result = await client.query('DELETE FROM Obra WHERE obr_id = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Obra no encontrada' });
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Obra eliminada exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar la obra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
};