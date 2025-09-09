// backend/src/scripts/finalizarLimpieza.ts

import { pool } from '../db/pool';

async function finalizarLimpieza() {
  console.log("--- Iniciando script final de limpieza y reparación (v4) ---");
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN'); // Iniciar transacción

    // --- TAREA 0: Identificar los IDs de las obras a eliminar ---
    console.log("0. Identificando obras a eliminar...");
    const obrasParaEliminarRes = await cliente.query(`
      SELECT obr_id FROM "obra" 
      WHERE obr_mcf LIKE 'REVISAR-%' OR obr_id IN (467, 468);
    `);
    const idsParaEliminar: number[] = obrasParaEliminarRes.rows.map(row => row.obr_id);
    
    if (idsParaEliminar.length > 0) {
      console.log(` -> Se encontraron ${idsParaEliminar.length} obras para eliminar.`);

      // --- TAREA 1: Eliminar las referencias en las tablas hijas ---
      console.log("1. Eliminando referencias en tablas relacionadas...");
      
      await cliente.query('DELETE FROM "obra_material" WHERE obr_id_fk = ANY($1::int[])', [idsParaEliminar]);
      await cliente.query('DELETE FROM "obra_tecnica" WHERE obr_tec_obr_fk = ANY($1::int[])', [idsParaEliminar]);
      await cliente.query('DELETE FROM "historial_movimiento" WHERE his_mov_obr_id_fk = ANY($1::int[])', [idsParaEliminar]);
      await cliente.query('DELETE FROM "historial_mantenimiento" WHERE his_man_obr_fk = ANY($1::int[])', [idsParaEliminar]);
      await cliente.query('DELETE FROM "historial_inventario" WHERE his_inv_obr_fk = ANY($1::int[])', [idsParaEliminar]);
      
      console.log(" -> Referencias eliminadas.");

      // --- TAREA 2: Eliminar las obras principales ---
      console.log("2. Eliminando registros de obras...");
      const resEliminar = await cliente.query('DELETE FROM "obra" WHERE obr_id = ANY($1::int[]);', [idsParaEliminar]);
      console.log(` -> Se eliminaron ${resEliminar.rowCount} obras.`);
    } else {
        console.log(" -> No se encontraron obras para eliminar.");
    }

    // --- TAREA 3: Reparar y rellenar los datos de la obra con ID 464 ---
    console.log("3. Actualizando y rellenando datos para la obra ID 464...");
    
    await cliente.query(`
      UPDATE "obra" SET
        obr_mcf = 'MCF-465',
        obr_titulo = 'Provincia de Vélez (Estrecho de Furatena en el Río Minero)',
        obr_alto_cm = '30 cm',
        obr_ancho_cm = '40 cm'
      WHERE obr_id = 464;
    `);

    const getOrCreateId = async (tabla: string, columnaNombre: string, valor: string, idColumna: string) => {
      let res = await cliente.query(`SELECT ${idColumna} FROM "${tabla}" WHERE ${columnaNombre} = $1`, [valor]);
      if (res?.rowCount && res.rowCount > 0) {
        return res.rows[0][idColumna];
      } else {
        res = await cliente.query(`INSERT INTO "${tabla}" (${columnaNombre}) VALUES ($1) RETURNING ${idColumna}`, [valor]);
        console.log(`   -> Se creó nueva entrada en "${tabla}": ${valor}`);
        return res.rows[0][idColumna];
      }
    };

    const artistaId = await getOrCreateId('artista', 'art_nombre', 'Wizche, Antoine', 'art_id');
    const clasificacionId = await getOrCreateId('clasificacion', 'cla_nombre', 'Artes Visuales, fotografía', 'cla_id');
    const tecnicaId = await getOrCreateId('tecnica', 'tec_nombre', 'Fotografía a color del original en acuarela', 'tec_id');
    const materialPapelId = await getOrCreateId('material', 'mat_nombre', 'Papel', 'mat_id');
    const materialEmulsionId = await getOrCreateId('material', 'mat_nombre', 'Emulsión fotográfica', 'mat_id');

    await cliente.query(`
      UPDATE "obra" SET
        obr_art_fk = $1,
        obr_cla_fk = $2
      WHERE obr_id = 464;
    `, [artistaId, clasificacionId]);

    await cliente.query('INSERT INTO "obra_tecnica" (obr_tec_obr_fk, obr_tec_tec_fk) VALUES (464, $1) ON CONFLICT DO NOTHING;', [tecnicaId]);
    await cliente.query('INSERT INTO "obra_material" (obr_id_fk, mat_id_fk) VALUES (464, $1) ON CONFLICT DO NOTHING;', [materialPapelId]);
    await cliente.query('INSERT INTO "obra_material" (obr_id_fk, mat_id_fk) VALUES (464, $1) ON CONFLICT DO NOTHING;', [materialEmulsionId]);

    console.log(" -> Se actualizaron y completaron los datos de la obra MCF-465.");

    await cliente.query('COMMIT');
    console.log("--- ✅ Tareas finales de limpieza y reparación completadas exitosamente ---");

  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error("❌ ERROR: Ocurrió un error durante la limpieza final. Se revirtieron los cambios.", error);
  } finally {
    cliente.release();
    await pool.end();
  }
}

finalizarLimpieza();