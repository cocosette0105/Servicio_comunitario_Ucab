// backend/src/scripts/vincularImagenes.ts

import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool';

const directorioDeImagenes = path.join(__dirname, '..', '..', 'uploads', 'obras');

// Función que extrae el código MCF base de un nombre de archivo
const extraerMCFBase = (nombre: string): string | null => {
    // Normalizar el nombre: convertir a mayúsculas y limpiar espacios extra
    let normalizado = nombre.trim().toUpperCase();
    
    // Buscar diferentes patrones de MCF:
    // MCF-1059 CF (1), MCF-1098-A, MCF 0249 (1), MCF-7779 A, etc.
    const patrones = [
        /^MCF[-\s]*(\d+)(?:\s*CF\s*\(\d+\))?/,  // MCF-1059 CF (1), MCF-1059
        /^MCF[-\s]*(\d+)[-\s]*[A-Z]$/,          // MCF-1098-A, MCF-7779 A  
        /^MCF[-\s]*(\d+)\s*\(\d+\)$/,           // MCF 0249 (1)
        /^MCF[-\s]*(\d+)$/                      // MCF-1098, MCF 0249
    ];
    
    for (const patron of patrones) {
        const match = normalizado.match(patron);
        if (match) {
            const numeroStr = match[1];
            const numeroInt = parseInt(numeroStr, 10);
            return `MCF-${numeroInt}`;
        }
    }
    
    return null;
};

// Función para verificar si una imagen ya existe en la BD para una obra
const imagenYaExiste = async (cliente: any, obraId: number, rutaImagen: string): Promise<boolean> => {
    const query = 'SELECT 1 FROM Obra_Imagen WHERE img_obr_fk = $1 AND img_url = $2';
    const resultado = await cliente.query(query, [obraId, rutaImagen]);
    return resultado.rows.length > 0;
};

async function vincularImagenes() {
    console.log('--- Iniciando script de vinculación múltiple ---');
    let cliente;
    
    try {
        cliente = await pool.connect();
        console.log('Conexión a la base de datos exitosa.');

        const archivos = fs.readdirSync(directorioDeImagenes)
            .filter(archivo => /\.(jpg|jpeg|png|webp)$/i.test(archivo)); // Solo imágenes
        
        console.log(`Se encontraron ${archivos.length} imágenes en la carpeta.`);

        // Agrupar archivos por código MCF base
        const imagenesAgrupadas = new Map<string, string[]>();
        
        for (const archivo of archivos) {
            const nombreSinExtension = path.parse(archivo).name;
            const mcfBase = extraerMCFBase(nombreSinExtension);
            
            if (!mcfBase) {
                console.warn(`⚠️  SALTANDO: El archivo '${archivo}' no tiene un formato MCF válido.`);
                continue;
            }
            
            if (!imagenesAgrupadas.has(mcfBase)) {
                imagenesAgrupadas.set(mcfBase, []);
            }
            
            imagenesAgrupadas.get(mcfBase)!.push(archivo);
        }

        console.log(`\nSe encontraron ${imagenesAgrupadas.size} obras diferentes:`);
        for (const [mcf, imagenes] of imagenesAgrupadas) {
            console.log(`- ${mcf}: ${imagenes.length} imagen(es)`);
        }

        let contadorObrasActualizadas = 0;
        let contadorImagenesGuardadas = 0;
        let contadorFallos = 0;

        // Procesar cada grupo de imágenes
        for (const [mcfBase, imagenes] of imagenesAgrupadas) {
            try {
                // Buscar la obra en la BD
                const queryObra = 'SELECT obr_id FROM Obra WHERE obr_mcf = $1';
                const resultadoObra = await cliente.query(queryObra, [mcfBase]);

                if (resultadoObra.rows.length === 0) {
                    console.warn(`⚠️  No se encontró la obra '${mcfBase}' en la base de datos.`);
                    contadorFallos++;
                    continue;
                }

                const obraId = resultadoObra.rows[0].obr_id;
                let primeraImagen = true;

                // Procesar cada imagen de este grupo
                for (const archivo of imagenes) {
                    const rutaEnBD = `/uploads/obras/${archivo}`;
                    
                    // Verificar si la imagen ya existe
                    const yaExiste = await imagenYaExiste(cliente, obraId, rutaEnBD);
                    if (yaExiste) {
                        console.log(`ℹ️  La imagen '${archivo}' ya está vinculada a '${mcfBase}'`);
                        continue;
                    }

                    // Insertar en Obra_Imagen
                    const queryImagen = 'INSERT INTO Obra_Imagen (img_obr_fk, img_url) VALUES ($1, $2)';
                    await cliente.query(queryImagen, [obraId, rutaEnBD]);
                    
                    // Si es la primera imagen, también actualizar obr_url_foto para compatibilidad
                    if (primeraImagen) {
                        const queryUpdateFoto = 'UPDATE Obra SET obr_url_foto = $1 WHERE obr_id = $2';
                        await cliente.query(queryUpdateFoto, [rutaEnBD, obraId]);
                        primeraImagen = false;
                    }
                    
                    console.log(`✅ Imagen '${archivo}' vinculada a '${mcfBase}'`);
                    contadorImagenesGuardadas++;
                }
                
                contadorObrasActualizadas++;
                
            } catch (error) {
                console.error(`❌ ERROR al procesar '${mcfBase}':`, error);
                contadorFallos++;
            }
        }

        console.log('\n--- Script finalizado ---');
        console.log(`Resultados:`);
        console.log(`- ${contadorObrasActualizadas} obras procesadas`);
        console.log(`- ${contadorImagenesGuardadas} imágenes vinculadas`);
        console.log(`- ${contadorFallos} fallos/obras no encontradas`);

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