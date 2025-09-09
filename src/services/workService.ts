// frontend/src/services/workService.ts
import { Work } from "../models";

// URL base de la API para las obras
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// 2. Construyes la URL específica para este servicio
const API_URL = `${API_BASE_URL}/api/obras`;

/**
 * Obtiene todas las obras del backend.
 * Ya no realiza el mapeo aquí, eso se centralizó en App.tsx.
 */
export const getWorks = async (): Promise<any[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error('Error al obtener las obras');
  }
  return res.json();
};

/**
 * Guarda una obra (la crea si no tiene ID, la actualiza si lo tiene).
 * IMPORTANTE: Ahora acepta FormData para poder incluir archivos de imagen.
 *
 * @param workData - Los datos del formulario como FormData.
 * @param workId - El ID de la obra si se está editando.
 * @returns La obra creada o actualizada.
 */
export const saveWork = async (workData: FormData, workId?: string): Promise<Work> => {
  const method = workId ? 'PUT' : 'POST';
  const url = workId ? `${API_URL}/${workId}` : API_URL;

  const response = await fetch(url, {
    method: method,
    body: workData,
    // ¡OJO! No se establece 'Content-Type'. 
    // El navegador lo hace automáticamente por nosotros cuando el body es FormData,
    // incluyendo el 'boundary' necesario para la subida de archivos.
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al guardar la obra');
  }

  return response.json();
};


/**
 * Elimina una obra por su ID.
 * @param workId - El ID de la obra a eliminar.
 */
export const deleteWork = async (workId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${workId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al eliminar la obra');
  }
};