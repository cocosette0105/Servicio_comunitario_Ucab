// frontend/src/controllers/MaintenanceController.ts

import { MaintenanceRecord } from '../models';
import { AuthController } from './AuthController'; // Para obtener el token

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/maintenance`;

// Tipo para los datos que se envían al crear/actualizar
type MaintenanceApiData = Omit<MaintenanceRecord, 'id' | 'workName' | 'userName'>;

export class MaintenanceController {

    private static getAuthHeaders() {
        const token = AuthController.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    static async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
        const response = await fetch(API_URL, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Error al obtener los registros de mantenimiento');
        }
        return response.json();
    }

    static async addMaintenanceRecord(recordData: MaintenanceApiData): Promise<any> {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(recordData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al agregar el registro');
        }
        return response.json();
    }

    static async updateMaintenanceRecord(id: string, recordData: MaintenanceApiData): Promise<any> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(recordData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el registro');
        }
        return response.json();
    }

    static async deleteMaintenanceRecord(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        if (!response.ok && response.status !== 204) {
             const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el registro');
        }
    }
}