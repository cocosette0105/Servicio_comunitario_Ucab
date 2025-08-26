// frontend/src/controllers/MovementController.ts
import { MovementRecord, User } from '../models';

// URL base de tu API. Asegúrate de que el puerto sea el correcto.
const API_URL = 'http://localhost:5000/api/historial-movimiento';

export interface NewMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    his_mov_obr_id_fk: number;
    his_mov_usu_id_fk: number;
    his_mov_recibe_fk?: number;
    his_mov_envia_fk?: number;
}

export interface UpdateMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    his_mov_recibe_fk?: number;
}

export class MovementController {

    // --- ¡NUEVA FUNCIÓN! ---
    static async getAllMovements(token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(API_URL, { // Llama a la nueva ruta raíz
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener todos los movimientos.');
            
            const rawData: any[] = await response.json();
            return this.mapData(rawData); // Usamos una función helper para mapear

        } catch (error) {
            console.error('Error en getAllMovements:', error);
            return [];
        }
    }

    static async getMovementsByWorkId(workId: number, token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(`${API_URL}/obra/${workId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener los movimientos.');
            
            const rawData: any[] = await response.json();
            return this.mapData(rawData);

        } catch (error) {
            console.error('Error en getMovementsByWorkId:', error);
            return [];
        }
    }

    // --- ¡NUEVA FUNCIÓN HELPER! ---
    // Centralizamos la lógica de mapeo para no repetir código.
    private static mapData(rawData: any[]): MovementRecord[] {
        return rawData.map(item => ({
            id: String(item.his_mov_id || `${item.his_mov_fecha}-${item.his_mov_obr_id_fk}`),
            workId: String(item.his_mov_obr_id_fk),
            workName: item.obra_titulo,
            date: new Date(item.his_mov_fecha).toLocaleDateString('es-VE'),
            type: item.his_tip_movimiento,
            reason: item.his_mov_motiv,
            notes: item.his_mov_notas,
            workDetails: {
                author: item.autor_nombre || 'No disponible',
                title: item.obra_titulo,
                technique: 'No disponible',
                dimensions: 'No disponible',
                collection: 'No disponible',
            },
            conservationState: 'No disponible',
            receiver: { name: item.recibe_nombre || 'N/A', idCard: 'N/A', phone: 'N/A' },
            deliverer: { name: item.envia_nombre || 'N/A', idCard: 'N/A', phone: 'N/A' },
        }));
    }

    static async addMovement(movementData: NewMovementData, token: string): Promise<any> {
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
            return await response.json();
        } catch (error) {
            console.error('Error en addMovement:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de movimiento existente.
     * @param movementId - El ID del movimiento a actualizar.
     * @param movementData - Los datos actualizados del movimiento.
     * @param token - El token de autenticación.
     * @returns Una promesa que se resuelve con los datos del movimiento actualizado.
     */
    static async updateMovement(movementId: number, movementData: UpdateMovementData, token: string): Promise<any> {
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
            return await response.json();
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
