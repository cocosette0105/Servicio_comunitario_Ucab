import { MovementRecord, Person } from '../models';

const API_URL = 'http://localhost:5000/api/historial-movimiento';

export interface NewMovementData {
    his_mov_fecha: string;
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

export class MovementController {

    // ========================================================================
    // FUNCIÓN CORREGIDA
    // Este "traductor" ahora lee correctamente el estado del directorio de cada persona.
    // ========================================================================
    private static mapToMovementRecord(item: any): MovementRecord {
        const dimensions = [
            item.obr_alto_cm && `${item.obr_alto_cm}cm alto`,
            item.obr_ancho_cm && `${item.obr_ancho_cm}cm ancho`,
            item.obr_profundidad_cm && `${item.obr_profundidad_cm}cm prof.`,
            item.obr_diametro_cm && `${item.obr_diametro_cm}cm diám.`
        ].filter(Boolean).join(' × ') || 'No especificado';

        const deliverer: Person | null = item.envia_id ? {
            id: item.envia_id,
            name: item.envia_nombre,
            idCard: item.envia_cedula,
            phone: item.envia_telefono,
            agregado_directorio: item.envia_agregado_directorio // <-- ¡CORRECCIÓN CLAVE!
        } : null;

        const receiver: Person | null = item.recibe_id ? {
            id: item.recibe_id,
            name: item.recibe_nombre,
            idCard: item.recibe_cedula,
            phone: item.recibe_telefono,
            agregado_directorio: item.recibe_agregado_directorio // <-- ¡CORRECCIÓN CLAVE!
        } : null;

        return {
            id: item.his_mov_id.toString(),
            workId: item.his_mov_obr_id_fk.toString(),
            workName: item.obra_titulo,
            date: item.his_mov_fecha,
            type: item.his_tip_movimiento,
            reason: item.his_mov_motiv,
            notes: item.his_mov_notas,
            userName: item.usuario_nombre,
            conservationState: item.his_mov_descripcion_estado,
            workDetails: {
                author: item.autor_nombre,
                title: item.obra_titulo,
                technique: item.tecnicas || 'No especificado',
                dimensions: dimensions,
                collection: item.his_mov_coleccion
            },
            deliverer,
            receiver
        };
    }
    
    static async getAllMovements(token: string): Promise<MovementRecord[]> {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al obtener los movimientos.');
            const data = await response.json();
            return data.map(this.mapToMovementRecord); // Usa el mapeador corregido
        } catch (error) {
            console.error('Error en getAllMovements:', error);
            throw error;
        }
    }

    static async createMovement(movementData: NewMovementData, token: string): Promise<MovementRecord> {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(movementData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear el movimiento.');
            }
            const data = await response.json();
            return this.mapToMovementRecord(data); // Usa el mapeador corregido
        } catch (error) {
            console.error('Error en createMovement:', error);
            throw error;
        }
    }

    static async updateMovement(movementId: number, movementData: UpdateMovementData, token: string): Promise<MovementRecord> {
        try {
            const response = await fetch(`${API_URL}/${movementId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(movementData)
            });
            if (!response.ok) throw new Error('Error al actualizar el movimiento.');
            const data = await response.json();
            return this.mapToMovementRecord(data); // Usa el mapeador corregido
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
            return response.ok;
        } catch (error) {
            console.error('Error en deleteMovement:', error);
            return false;
        }
    }
}