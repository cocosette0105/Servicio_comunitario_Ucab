// backend/src/scripts/restaurarObras.ts

import { pool } from '../db/pool';
import { PoolClient } from 'pg';

// --- Función auxiliar para obtener o crear IDs (CORREGIDA) ---
const getOrCreateId = async (cliente: PoolClient, tabla: string, columnaNombre: string, valor: string, idColumna: string): Promise<number> => {
    let res = await cliente.query(`SELECT ${idColumna} FROM "${tabla}" WHERE ${columnaNombre} = $1`, [valor]);
    // ✅ CORRECCIÓN APLICADA AQUÍ
    if (res?.rowCount && res.rowCount > 0) {
        return res.rows[0][idColumna];
    } else {
        res = await cliente.query(`INSERT INTO "${tabla}" (${columnaNombre}) VALUES ($1) RETURNING ${idColumna}`, [valor]);
        console.log(`   -> Se creó nueva entrada en '${tabla}': ${valor}`);
        return res.rows[0][idColumna];
    }
};

async function restaurarObras() {
    console.log("--- Iniciando script para restaurar obras eliminadas (v2) ---");
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // --- 1. RESTAURAR OBRA MCF-299 ---
        console.log("1. Restaurando obra MCF-299...");

        const obra299Res = await cliente.query(
            `INSERT INTO "obra" (obr_mcf, obr_titulo, obr_alto_cm, obr_ancho_cm, obr_profundidad_cm) 
             VALUES ($1, $2, $3, $4, $5) RETURNING obr_id;`,
            ['MCF-299', 'Mirada al Amazonas II', '80,5 cm', '49 cm', '46 cm']
        );
        const obra299Id = obra299Res.rows[0].obr_id;

        const artista299Id = await getOrCreateId(cliente, 'artista', 'art_nombre', 'Villoria; Francisco', 'art_id');
        const clasificacion299Id = await getOrCreateId(cliente, 'clasificacion', 'cla_nombre', 'Artes Visuales, Cerámica', 'cla_id');
        const tecnica299Id = await getOrCreateId(cliente, 'tecnica', 'tec_nombre', 'Cerámica modelada y policromada', 'tec_id');
        const materiales299Ids = await Promise.all([
            getOrCreateId(cliente, 'material', 'mat_nombre', 'Arcilla', 'mat_id'),
            getOrCreateId(cliente, 'material', 'mat_nombre', 'óxidos', 'mat_id'),
            getOrCreateId(cliente, 'material', 'mat_nombre', 'esmaltes', 'mat_id')
        ]);

        await cliente.query('UPDATE "obra" SET obr_art_fk = $1, obr_cla_fk = $2 WHERE obr_id = $3', [artista299Id, clasificacion299Id, obra299Id]);
        
        await cliente.query('INSERT INTO "obra_tecnica" (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [obra299Id, tecnica299Id]);
        for (const matId of materiales299Ids) {
            await cliente.query('INSERT INTO "obra_material" (obr_id_fk, mat_id_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [obra299Id, matId]);
        }
        console.log(" -> Obra MCF-299 restaurada con éxito.");


        // --- 2. RESTAURAR OBRA MCF-488 ---
        console.log("2. Restaurando obra MCF-488...");

        const obra488Res = await cliente.query(
            `INSERT INTO "obra" (obr_mcf, obr_titulo, obr_alto_cm, obr_ancho_cm) 
             VALUES ($1, $2, $3, $4) RETURNING obr_id;`,
            ['MCF-488', 'Satine', '120 cm', '80 cm']
        );
        const obra488Id = obra488Res.rows[0].obr_id;

        const artista488Id = await getOrCreateId(cliente, 'artista', 'art_nombre', 'Laya, Domingo', 'art_id');
        const clasificacion488Id = await getOrCreateId(cliente, 'clasificacion', 'cla_nombre', 'Artes Visuales, Pintura', 'cla_id');
        const tecnica488Id = await getOrCreateId(cliente, 'tecnica', 'tec_nombre', 'Mixta; Pintura', 'tec_id');
        const materiales488Ids = await Promise.all([
            getOrCreateId(cliente, 'material', 'mat_nombre', 'Acrílico', 'mat_id'),
            getOrCreateId(cliente, 'material', 'mat_nombre', 'Resina', 'mat_id'),
            getOrCreateId(cliente, 'material', 'mat_nombre', 'madera', 'mat_id')
        ]);
        
        await cliente.query('UPDATE "obra" SET obr_art_fk = $1, obr_cla_fk = $2 WHERE obr_id = $3', [artista488Id, clasificacion488Id, obra488Id]);

        await cliente.query('INSERT INTO "obra_tecnica" (obr_tec_obr_fk, obr_tec_tec_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [obra488Id, tecnica488Id]);
        for (const matId of materiales488Ids) {
            await cliente.query('INSERT INTO "obra_material" (obr_id_fk, mat_id_fk) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [obra488Id, matId]);
        }
        console.log(" -> Obra MCF-488 restaurada con éxito.");

        await cliente.query('COMMIT');
        console.log("--- ✅ Restauración de obras completada exitosamente ---");

    } catch (error) {
        await cliente.query('ROLLBACK');
        console.error("❌ ERROR: Ocurrió un error durante la restauración. Se revirtieron los cambios.", error);
    } finally {
        cliente.release();
        await pool.end();
    }
}

restaurarObras();