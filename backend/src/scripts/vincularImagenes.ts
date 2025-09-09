// backend/src/scripts/vincularImagenes.ts

import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool';

const directorioDeImagenes = path.join(__dirname, '..', '..', 'uploads', 'obras');

// Función que toma un nombre de archivo y lo convierte al formato estándar 'MCF-Numero'
const normalizarNombreArchivo = (nombre: string): string | null => {
    // Quita espacios, guiones, y todo lo que no sea letra o número
    const limpio = nombre.replace(/[-\s_()]/g, ''); 
    const match = limpio.match(/^(MCF)(\d+)$/i); // Busca 'MCF' seguido de números

    if (!match) {
        return null; // No sigue el patrón
    }
    
    const prefijo = match[1].toUpperCase();     // "MCF"
    const numeroStr = match[2];                 // "0005"
    
    // ✅ CORRECCIÓN FINAL: Convertimos a número para eliminar ceros a la izquierda
    const numeroInt = parseInt(numeroStr, 10);  // 5

    return `${prefijo}-${numeroInt}`; // Devuelve "MCF-5"
};


async function vincularImagenes() {
  console.log('--- Iniciando script de vinculación final (v2) ---');
  let cliente;
  try {
    cliente = await pool.connect();
    console.log('Conexión a la base de datos exitosa.');

    const archivos = fs.readdirSync(directorioDeImagenes);
    console.log(`Se encontraron ${archivos.length} imágenes en la carpeta.`);

    let contadorExitos = 0;
    let contadorFallos = 0;

    for (const archivo of archivos) {
      const nombreSinExtension = path.parse(archivo).name;
      const mcfEstandar = normalizarNombreArchivo(nombreSinExtension);

      if (!mcfEstandar) {
        console.warn(`⏭️  SALTANDO: El archivo '${archivo}' no tiene un formato de MCF válido.`);
        contadorFallos++;
        continue;
      }

      const rutaEnBD = `/uploads/obras/${archivo}`;

      try {
        // La consulta sigue siendo simple y directa
        const query = `
          UPDATE "obra"
          SET obr_url_foto = $1
          WHERE obr_mcf = $2;
        `;
        const resultado = await cliente.query(query, [rutaEnBD, mcfEstandar]);

        if (resultado?.rowCount && resultado.rowCount > 0) {
          console.log(`✅ ÉXITO: Obra '${mcfEstandar}' actualizada con la imagen '${archivo}'`);
          contadorExitos++;
        } else {
          console.warn(`⚠️ AVISO: No se encontró la obra '${mcfEstandar}' en la base de datos.`);
          contadorFallos++;
        }
      } catch (error) {
        console.error(`❌ ERROR al procesar '${nombreSinExtension}':`, error);
        contadorFallos++;
      }
    }
    console.log('--- Script finalizado ---');
    console.log(`Resultados: ${contadorExitos} obras actualizadas, ${contadorFallos} fallos/avisos.`);

  } catch (error) {
    console.error('Ha ocurrido un grave error en el script:', error);
  } finally {
    if (cliente) {
      cliente.release();
      console.log('Conexión a la base de datos liberada.');
    }
    await pool.end();
  }
}

vincularImagenes();