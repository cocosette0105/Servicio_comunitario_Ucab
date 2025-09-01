// backend/src/controllers/obra.controller.ts
import { Request, Response } from 'express';
import { pool } from '../db/pool';
import path from "path";

// ==========================
// GET: Todas las obras
// ==========================
export const getObras = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*, -- Esto trae todas las columnas de la tabla Obra
        a.art_nombre AS artist_name,
        c.cla_nombre AS classification_name,
        l.lu_nombre AS location_name,
        -- Trae los materiales como un array de strings
        COALESCE(
          (SELECT string_agg(m.mat_nombre, ', ')
           FROM Obra_material om
           JOIN Material m ON om.mat_id_fk = m.mat_id
           WHERE om.obr_id_fk = o.obr_id), ''
        ) AS materials,
        -- Trae las técnicas como un array de strings
        COALESCE(
          (SELECT string_agg(t.tec_nombre, ', ')
           FROM Obra_tecnica ot
           JOIN Tecnica t ON ot.obr_tec_tec_fk = t.tec_id
           WHERE ot.obr_tec_obr_fk = o.obr_id), ''
        ) AS technique
      FROM Obra o
      LEFT JOIN Artista a ON o.obr_art_fk = a.art_id
      LEFT JOIN Clasificacion c ON o.obr_cla_fk = c.cla_id
      LEFT JOIN Lugar l ON o.obr_lu_fk = l.lu_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo obras" });
  }
};

// ==========================
// GET: Obra por ID
// ==========================
export const getObraById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    // Aquí también podrías usar una consulta más completa si necesitas los nombres
    const result = await pool.query("SELECT * FROM Obra WHERE obr_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Obra no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo la obra" });
  }
};

// ==============================================================
// POST: Crear obra (VERSIÓN CORREGIDA CON MATERIALES Y TÉCNICAS)
// ==============================================================
export const createObra = async (req: Request, res: Response) => {
    console.log('[LOG] POST /api/obras - body:', req.body);
    
    const {
        inventoryNumber, previousNumbers, name, realizationDate, description,
        signatureDetails, observations, artist, classification, storageLocation,
        dimensions, collection, conservationState, technicalData, 
        references, responsibleEntity, inventory, 
        // ¡NUEVO! Recibimos materiales y técnicas
        materials, technique
    } = req.body;
    
    const photoUrl = req.file ? path.join('uploads', 'obras', req.file.filename).replace(/\\/g, '/') : null;
    
    const parsedDimensions = dimensions ? JSON.parse(dimensions) : {};
    const parsedCollection = collection ? JSON.parse(collection) : {};
    const parsedConservation = conservationState ? JSON.parse(conservationState) : {};
    const parsedTechData = technicalData ? JSON.parse(technicalData) : {};
    const parsedReferences = references ? JSON.parse(references) : {};
    const parsedRespEntity = responsibleEntity ? JSON.parse(responsibleEntity) : {};

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener IDs de Artista, Clasificación, Lugar
        let artistResult = await client.query('SELECT art_id FROM Artista WHERE art_nombre = $1', [artist]);
        if (artistResult.rows.length === 0) {
            artistResult = await client.query('INSERT INTO Artista (art_nombre) VALUES ($1) RETURNING art_id', [artist]);
        }
        const artistId = artistResult.rows[0].art_id;

        const classificationResult = await client.query('SELECT cla_id FROM Clasificacion WHERE cla_nombre = $1', [classification]);
        const classificationId = classificationResult.rows.length > 0 ? classificationResult.rows[0].cla_id : null;
        
        const locationResult = await client.query('SELECT lu_id FROM Lugar WHERE lu_nombre = $1', [storageLocation]);
        const locationId = locationResult.rows.length > 0 ? locationResult.rows[0].lu_id : null;

        // 2. Insertar la obra principal
        const obraQuery = `
            INSERT INTO Obra (
                obr_mcf, obr_numeros_anteriores, obr_titulo, obr_fecha_realizacion, obr_alto_cm, obr_ancho_cm, obr_profundidad_cm, obr_diametro_cm, obr_descripcion_formal, obr_detalles_firma, obr_observaciones, obr_url_foto, obr_estado_condicion, obr_estado_integridad, obr_procedencia, obr_cultura_tradicion, obr_epoca_estilo, obr_valor_avaluo, obr_moneda_avaluo, obr_responsable_avaluo, obr_fecha_avaluo, obr_propietario_original, obr_documentos_relacionados, obr_bibliografia, obr_fecha_ingreso, obr_fuente_adquisicion, obr_metodo_adquisicion, obr_entidad_responsable, obr_cla_fk, obr_art_fk, obr_lu_fk
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
            ) RETURNING *;
        `;
        const obraValues = [
            inventoryNumber, previousNumbers, name, realizationDate, parsedDimensions.height, parsedDimensions.width, parsedDimensions.depth, parsedDimensions.diameter, description, signatureDetails, observations, photoUrl, parsedConservation.condition, parsedConservation.integrity, parsedTechData.provenance, parsedTechData.culture, parsedTechData.eraStyle, parsedTechData.value, parsedTechData.currency, parsedTechData.appraiser, parsedTechData.appraisalDate, parsedTechData.originalOwner, parsedReferences.documents, parsedReferences.bibliography, parsedCollection.entryDate, parsedCollection.acquisitionSource, parsedCollection.acquisitionMethod, parsedRespEntity.name, classificationId, artistId, locationId
        ];
        const result = await client.query(obraQuery, obraValues);
        const newWork = result.rows[0];

        // 3. ¡NUEVO! Manejar Materiales (N:N)
        if (materials && typeof materials === 'string' && materials.trim() !== '') {
            const materialArray = materials.split(',').map(m => m.trim());
            for (const matName of materialArray) {
                let matResult = await client.query('SELECT mat_id FROM Material WHERE mat_nombre = $1', [matName]);
                if (matResult.rows.length === 0) {
                    matResult = await client.query('INSERT INTO Material (mat_nombre) VALUES ($1) RETURNING mat_id', [matName]);
                }
                const materialId = matResult.rows[0].mat_id;
                await client.query('INSERT INTO Obra_material (obr_id_fk, mat_id_fk) VALUES ($1, $2)', [newWork.obr_id, materialId]);
            }
        }

        // 4. ¡NUEVO! Manejar Técnicas (N:N)
        if (technique && typeof technique === 'string' && technique.trim() !== '') {
            const techniqueArray = technique.split(',').map(t => t.trim());
            for (const tecName of techniqueArray) {
                let tecResult = await client.query('SELECT tec_id FROM Tecnica WHERE tec_nombre = $1', [tecName]);
                if (tecResult.rows.length === 0) {
                    tecResult = await client.query('INSERT INTO Tecnica (tec_nombre) VALUES ($1) RETURNING tec_id', [tecName]);
                }
                const techniqueId = tecResult.rows[0].tec_id;
                await client.query('INSERT INTO Obra_tecnica (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2)', [newWork.obr_id, techniqueId]);
            }
        }

        await client.query('COMMIT');
        
        res.status(201).json({
            ...newWork,
            artist_name: artist,
            classification_name: classification,
            location_name: storageLocation,
            materials, // Devolvemos el string original para consistencia
            technique  // Devolvemos el string original para consistencia
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error al guardar la obra' });
    } finally {
        client.release();
    }
};

// ==========================
// PUT: Actualizar obra
// ==========================
export const updateObra = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { material_id, technique_id, ...obraData } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Actualizar la tabla principal de Obra
        const updateObraQuery = `
            UPDATE Obra SET 
                obr_mcf=$1, obr_numeros_anteriores=$2, obr_titulo=$3, obr_fecha_realizacion=$4, obr_alto_cm=$5, obr_ancho_cm=$6, 
                obr_profundidad_cm=$7, obr_diametro_cm=$8, obr_descripcion_formal=$9, obr_detalles_firma=$10, obr_observaciones=$11, 
                obr_url_foto=$12, obr_estado_condicion=$13, obr_estado_integridad=$14, obr_procedencia=$15, obr_cultura_tradicion=$16, 
                obr_epoca_estilo=$17, obr_valor_avaluo=$18, obr_moneda_avaluo=$19, obr_responsable_avaluo=$20, obr_fecha_avaluo=$21, 
                obr_propietario_original=$22, obr_documentos_relacionados=$23, obr_bibliografia=$24, obr_fecha_ingreso=$25, 
                obr_fuente_adquisicion=$26, obr_metodo_adquisicion=$27, obr_entidad_responsable=$28, obr_cla_fk=$29, obr_art_fk=$30, obr_lu_fk=$31
            WHERE obr_id=$32 RETURNING *`;
        
        const obraValues = [
            obraData.obr_mcf, obraData.obr_numeros_anteriores, obraData.obr_titulo, obraData.obr_fecha_realizacion, obraData.obr_alto_cm, obraData.obr_ancho_cm,
            obraData.obr_profundidad_cm, obraData.obr_diametro_cm, obraData.obr_descripcion_formal, obraData.obr_detalles_firma, obraData.obr_observaciones,
            obraData.obr_url_foto, obraData.obr_estado_condicion, obraData.obr_estado_integridad, obraData.obr_procedencia, obraData.obr_cultura_tradicion,
            obraData.obr_epoca_estilo, obraData.obr_valor_avaluo, obraData.obr_moneda_avaluo, obraData.obr_responsable_avaluo, obraData.obr_fecha_avaluo,
            obraData.obr_propietario_original, obraData.obr_documentos_relacionados, obraData.obr_bibliografia, obraData.obr_fecha_ingreso,
            obraData.obr_fuente_adquisicion, obraData.obr_metodo_adquisicion, obraData.obr_entidad_responsable, obraData.obr_cla_fk, obraData.obr_art_fk, obraData.obr_lu_fk,
            id
        ];
        
        const result = await client.query(updateObraQuery, obraValues);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Obra no encontrada" });
        }

        // 2. Actualizar material (borrar los anteriores e insertar el nuevo)
        await client.query('DELETE FROM Obra_material WHERE obr_id_fk = $1', [id]);
        if (material_id) {
            await client.query('INSERT INTO Obra_material (obr_id_fk, mat_id_fk) VALUES ($1, $2)', [id, material_id]);
        }

        // 3. Actualizar técnica (borrar las anteriores e insertar la nueva)
        await client.query('DELETE FROM Obra_tecnica WHERE obr_tec_obr_fk = $1', [id]);
        if (technique_id) {
            await client.query('INSERT INTO Obra_tecnica (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2)', [id, technique_id]);
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Error actualizando la obra" });
    } finally {
        client.release();
    }
};

// ==========================
// DELETE: Eliminar obra
// ==========================
export const deleteObra = async (req: Request, res: Response) => {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Eliminar referencias en tablas N:N
    await client.query('DELETE FROM Obra_material WHERE obr_id_fk = $1', [id]);
    await client.query('DELETE FROM Obra_tecnica WHERE obr_tec_obr_fk = $1', [id]);
    
    // Aquí deberías eliminar también referencias en otras tablas si las hubiera
    // (ej: Historial_movimiento, Historial_mantenimiento)
    // await client.query('DELETE FROM Historial_movimiento WHERE his_mov_obr_id_fk = $1', [id]);
    // await client.query('DELETE FROM Historial_mantenimiento WHERE his_man_obr_fk = $1', [id]);

    // 2. Eliminar la obra principal
    const result = await client.query("DELETE FROM Obra WHERE obr_id=$1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      // Si no se encontró la obra, no hay nada que eliminar.
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Obra no encontrada" });
    }

    await client.query('COMMIT');
    res.json({ message: "Obra eliminada permanentemente", obra: result.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Error eliminando la obra" });
  } finally {
    client.release();
  }
};
