// backend/src/scripts/limpiezaDB.ts

import { pool } from '../db/pool';

async function limpiarBaseDeDatos() {
  console.log('--- Iniciando script de limpieza AVANZADO (v3) ---');
  const cliente = await pool.connect();

  try {
    // Iniciamos una transacción. Si algo falla, nada se guarda.
    await cliente.query('BEGIN');

    // --- TAREA 1: Corregir prefijos duplicados "MCF-MCF-" (Como antes) ---
    console.log('1. Corrigiendo prefijos duplicados (MCF-MCF-)...');
    const resRepetidos = await cliente.query(`
      UPDATE "obra"
      SET obr_mcf = REPLACE(obr_mcf, 'MCF-MCF-', 'MCF-')
      WHERE obr_mcf LIKE 'MCF-MCF-%';
    `);
    console.log(` -> Se corrigieron ${resRepetidos.rowCount} registros.`);

    // --- TAREA 2: Extraer códigos válidos de cadenas sucias ---
    // Busca 'MCF-[números]' dentro de una cadena más larga y lo extrae.
    // Ej: "MCF-0465""" -> "MCF-465"
    console.log("2. Extrayendo códigos MCF válidos de registros sucios...");
    const resExtraidos = await cliente.query(`
      UPDATE "obra"
      SET obr_mcf = substring(obr_mcf from 'MCF-[0-9]+')
      WHERE 
        obr_mcf ~ 'MCF-[0-9]+' -- Contiene el patrón
        AND obr_mcf != substring(obr_mcf from 'MCF-[0-9]+'); -- Pero no es exactamente igual al patrón
    `);
    console.log(` -> Se extrajeron y repararon ${resExtraidos.rowCount} registros.`);

    // --- TAREA 3: Marcar los registros que siguen siendo inválidos ---
    // En lugar de poner NULL, los marcamos para revisión manual.
    // Usamos el ID de la obra para crear un identificador único (ej: 'REVISAR-463').
    console.log("3. Marcando registros inválidos restantes para revisión manual...");
    const resInvalidos = await cliente.query(`
      UPDATE "obra"
      SET obr_mcf = 'REVISAR-' || obr_id 
      WHERE 
        obr_mcf IS NOT NULL 
        AND obr_mcf !~ '^MCF-[0-9]+([ A-Z-]+)?$';
    `);
    console.log(` -> Se marcaron ${resInvalidos.rowCount} registros para revisión manual.`);

    // Si todo salió bien, guardamos los cambios.
    await cliente.query('COMMIT');
    console.log('--- ✅ Limpieza de la base de datos completada exitosamente ---');

  } catch (error) {
    // Si algo falló, revertimos todo para no dejar la base de datos a medias.
    await cliente.query('ROLLBACK');
    console.error('❌ ERROR: Ocurrió un error durante la limpieza. Se revirtieron los cambios.', error);
  } finally {
    cliente.release();
    await pool.end();
  }
}

limpiarBaseDeDatos();