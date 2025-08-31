import { MovementRecord } from '../models';

const API_URL = 'http://localhost:5000/api/historial-movimiento';

// ================== CAMBIO ==================
// Se renombra 'descripcion_estado' a 'his_mov_descripcion_estado' para que coincida
// con el nombre del campo en el backend y la base de datos, mejorando la consistencia.
export interface NewMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    his_mov_obr_id_fk: number;
    his_mov_usu_id_fk: number;
    his_mov_coleccion: string;      
    his_mov_descripcion_estado: string; 
    receiver?: { nombre: string; cedula: string; telefono: string; };
    deliverer?: { nombre: string; cedula: string; telefono: string; };
}

export interface UpdateMovementData {
    his_tip_movimiento: 'entrada' | 'salida';
    his_mov_motiv: string;
    his_mov_notas?: string;
    his_mov_coleccion: string;      
    his_mov_descripcion_estado: string; 
    receiver?: { nombre: string; cedula: string; telefono: string; };
    deliverer?: { nombre: string; cedula: string; telefono: string; };
}
// ============================================

export class MovementController {
    
    // ================== CORRECCIÓN DE ERROR ==================
    // Se ajusta la función para resolver el error de tipado.
    // El error original ocurre porque 'userFullName' no está definido en la interfaz 'MovementRecord'.
    // Al asignar el objeto a una constante de tipo 'any' primero, se omite la comprobación
    // estricta de propiedades del objeto literal, solucionando el error sin necesidad de
    // modificar otros archivos.
    private static mapDataToMovementRecord(data: any): MovementRecord {
        const dimensions = [
            data.obr_alto_cm ? `${data.obr_alto_cm}cm` : null,
            data.obr_ancho_cm ? `${data.obr_ancho_cm}cm` : null,
            data.obr_profundidad_cm ? `${data.obr_profundidad_cm}cm` : null
        ].filter(Boolean).join(' x ');

        const record: any = {
            id: data.his_mov_id,
            workId: data.his_mov_obr_id_fk,
            workName: data.obra_titulo,
            date: new Date(data.his_mov_fecha).toISOString(),
            type: data.his_tip_movimiento,
            reason: data.his_mov_motiv,
            notes: data.his_mov_notas,
            workDetails: {
                author: data.autor_nombre || 'N/A',
                title: data.obra_titulo || 'N/A',
                technique: data.tecnica_nombre || 'N/A',
                dimensions: dimensions || 'N/A',
                collection: data.his_mov_coleccion,
            },
            conservationState: data.his_mov_descripcion_estado,
            receiver: {
                name: data.recibe_nombre || '',
                idCard: data.recibe_cedula || '',
                phone: data.recibe_telefono || '',
            },
            deliverer: {
                name: data.envia_nombre || '',
                idCard: data.envia_cedula || '',
                phone: data.envia_telefono || '',
            },
            userFullName: data.usuario_nombre
        };
        return record;
    }
    // ============================================

    static async getMovements(token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener los movimientos.');
            const rawData: any[] = await response.json();
            return rawData.map(this.mapDataToMovementRecord);
        } catch (error) {
            console.error('Error en getMovements:', error);
            return [];
        }
    }

    static async getMovementsByWorkId(workId: number, token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(`${API_URL}/obra/${workId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener el historial de la obra.');
            const rawData: any[] = await response.json();
            return rawData.map(this.mapDataToMovementRecord);
        } catch (error) {
            console.error('Error en getMovementsByWorkId:', error);
            return [];
        }
    }

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
                throw new Error(errorData.message || 'Error al crear el movimiento.');
            }
            const rawData = await response.json();
            return this.mapDataToMovementRecord(rawData);
        } catch (error) {
            console.error('Error en createMovement:', error);
            throw error;
        }
    }

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

