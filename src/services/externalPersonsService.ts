// SERVICIO PARA PERSONAS EXTERNAS
// Maneja las llamadas a la API para obtener personas externas registradas

const API_URL = 'http://localhost:5000/api/external-persons';


export interface ExternalPerson {
  per_ext_id: number;
  per_ext_nombre: string;
  per_ext_cedula: string;
  per_ext_telefono: string;
}

export class ExternalPersonsService {
  /**
   * Obtiene todas las personas externas registradas
   * @param token - Token de autenticación
   * @returns Array de personas externas
   */
  static async getAllExternalPersons(token: string): Promise<ExternalPerson[]> {
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener personas externas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getAllExternalPersons:', error);
      return [];
    }
  }


  
  /**
   * Elimina una persona externa por su ID
   * @param personId - ID de la persona a eliminar
   * @param token - Token de autenticación
   * @returns boolean - true si tuvo éxito, false si no
   */
  static async deleteExternalPerson(personId: number, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/${personId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la persona');
      }
      return true;
    } catch (error) {
      console.error('Error en deleteExternalPerson:', error);
      return false;
    }
  }
  

}