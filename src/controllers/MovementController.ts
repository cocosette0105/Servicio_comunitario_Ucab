// frontend/src/controllers/MovementController.ts

// Se importa el modelo 'MovementRecord' que define la estructura de datos en el frontend.
import { MovementRecord } from '../models';

// URL base de la API para los movimientos.
const API_URL = 'http://localhost:5000/api/historial-movimiento';

/**
 * Interfaz para los datos necesarios al crear un nuevo movimiento.
 * Se envían los objetos completos de 'receiver' y 'deliverer'.
 */
export interface NewMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    his_mov_obr_id_fk: number;
    his_mov_usu_id_fk: number;
    receiver?: { nombre: string; cedula: string; telefono: string; };
    deliverer?: { nombre: string; cedula: string; telefono: string; };
}

/**
 * Interfaz para los datos al actualizar un movimiento.
 * También puede incluir los objetos de persona externa si se permite su edición.
 */
export interface UpdateMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    receiver?: { nombre: string; cedula: string; telefono: string; };
    deliverer?: { nombre: string; cedula: string; telefono: string; };
}

/**
 * Clase que gestiona todas las operaciones CRUD para el historial de movimientos.
 */
export class MovementController {

    /**
     * Función auxiliar privada para mapear la respuesta de la API al modelo del frontend.
     * @param data - Un objeto de movimiento proveniente del backend.
     * @returns Un objeto con el formato `MovementRecord` que usa el frontend.
     */
    private static mapDataToMovementRecord(data: any): MovementRecord {
        // --- ¡NUEVO! ---
        // Función auxiliar para construir el string de dimensiones de forma limpia.
        const formatDimensions = () => {
            const parts = [
                data.obr_alto_cm && `${data.obr_alto_cm}cm alto`,
                data.obr_ancho_cm && `${data.obr_ancho_cm}cm ancho`,
                data.obr_profundidad_cm && `${data.obr_profundidad_cm}cm prof.`,
                data.obr_diametro_cm && `${data.obr_diametro_cm}cm diám.`
            ].filter(Boolean); // Elimina valores nulos o vacíos

            return parts.join(' × ') || 'No especificado';
        };

        return {
            id: String(data.his_mov_id),
            workId: String(data.his_mov_obr_id_fk),
            workName: data.obra_titulo || 'Sin título',
            date: new Date(data.his_mov_fecha).toISOString(),
            type: data.his_tip_movimiento,
            reason: data.his_mov_motiv,
            notes: data.his_mov_notas,
            // *** CORRECCIÓN CLAVE AQUÍ ***
            workDetails: {
                author: data.autor_nombre || 'N/A',
                title: data.obra_titulo || 'N/A',
                technique: data.obra_tecnicas || 'No especificado', // Campo de técnicas
                dimensions: formatDimensions(), // Campo de dimensiones formateado
                collection: 'N/A' 
            },
            conservationState: 'N/A',
            receiver: {
                name: data.recibe_nombre || 'N/A',
                idCard: data.recibe_cedula || 'N/A',
                phone: data.recibe_telefono || 'N/A'
            },
            deliverer: {
                name: data.envia_nombre || 'N/A',
                idCard: data.envia_cedula || 'N/A',
                phone: data.envia_telefono || 'N/A'
            }
        };
    }

     /**
     * Obtiene todos los registros de movimiento.
     * @param token - El token de autenticación.
     * @returns Una promesa que se resuelve en un array de `MovementRecord`.
     */
    static async getAllMovements(token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener todos los movimientos.');
            
            const rawData: any[] = await response.json();
            return rawData.map(this.mapDataToMovementRecord);
        } catch (error) {
            console.error('Error en getAllMovements:', error);
            return [];
        }
    }
    /**
     * Obtiene los movimientos de una obra específica.
     * @param workId - El ID de la obra.
     * @param token - El token de autenticación.
     * @returns Un array de registros de movimiento para esa obra.
     */
    static async getMovementsByWorkId(workId: number, token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(`${API_URL}/obra/${workId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener los movimientos de la obra.');
            
            const rawData: any[] = await response.json();
            return rawData.map(this.mapDataToMovementRecord);
        } catch (error) {
            console.error('Error en getMovementsByWorkId:', error);
            return [];
        }
    }

    /**
     * Crea un nuevo registro de movimiento.
     * @param movementData - Los datos del nuevo movimiento según la interfaz `NewMovementData`.
     * @param token - El token de autenticación.
     * @returns El nuevo registro de movimiento creado.
     */
    static async createMovement(movementData: NewMovementData, token: string): Promise<MovementRecord> {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(movementData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo registrar el movimiento.');
            }
            const rawData = await response.json();
            return this.mapDataToMovementRecord(rawData);
        } catch (error) {
            console.error('Error en createMovement:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de movimiento existente.
     * @param movementId - El ID del movimiento a actualizar.
     * @param movementData - Los datos actualizados.
     * @param token - El token de autenticación.
     * @returns El registro de movimiento actualizado.
     */
    static async updateMovement(movementId: number, movementData: UpdateMovementData, token: string): Promise<MovementRecord> {
        try {
            const response = await fetch(`${API_URL}/${movementId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(movementData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el movimiento.');
            }
            const rawData = await response.json();
            return this.mapDataToMovementRecord(rawData);
        } catch (error) {
            console.error('Error en updateMovement:', error);
            throw error;
        }
    }
    
    /**
     * Elimina un registro de movimiento.
     * @param movementId - El ID del movimiento a eliminar.
     * @param token - El token de autenticación.
     * @returns Una promesa que se resuelve a `true` si la eliminación fue exitosa.
     */
    static async deleteMovement(movementId: number, token: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/${movementId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al eliminar el movimiento.');
            return true;
        } catch (error) {
            console.error('Error en deleteMovement:', error);
            return false;
        }
    }
}
