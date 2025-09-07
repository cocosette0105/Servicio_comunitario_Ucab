// SERVICIO PARA PERSONAS EXTERNAS
const API_URL = 'http://localhost:5000/api/external-persons';

export interface ExternalPerson {
  per_ext_id: number;
  per_ext_nombre: string;
  per_ext_cedula: string;
  per_ext_telefono: string;
  per_ext_agregado_directorio: boolean; // <-- Se añade el nuevo campo
}

export class ExternalPersonsService {
  /**
   * Obtiene TODAS las personas externas registradas.
   */
  static async getAllExternalPersons(token: string): Promise<ExternalPerson[]> {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al obtener personas externas');
      return await response.json();
    } catch (error) {
      console.error('Error en getAllExternalPersons:', error);
      return [];
    }
  }

  /**
   * Obtiene solo los contactos guardados en el directorio.
   */
  static async getDirectoryContacts(token: string): Promise<ExternalPerson[]> {
    try {
      const response = await fetch(`${API_URL}/directory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al obtener los contactos del directorio');
      return await response.json();
    } catch (error) {
      console.error('Error en getDirectoryContacts:', error);
      return [];
    }
  }
  
  /**
   * ========================================================================
   * NUEVA FUNCIÓN
   * Cambia el estado (agrega/quita) de una persona en el directorio.
   * Esta función reemplaza la antigua 'removeFromDirectory'.
   * ========================================================================
   */
  static async toggleDirectoryStatus(personId: number, token: string): Promise<{ newStatus: boolean }> {
    try {
      const response = await fetch(`${API_URL}/${personId}/toggle-directory`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Error al cambiar el estado del directorio de la persona.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en toggleDirectoryStatus:', error);
      throw error; // Lanzamos el error para que el componente que llama pueda manejarlo
    }
  }
}