// src/controllers/UserController.ts
import { ApiUser, SystemUser } from '../models/index';

// URL base de la API
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Clase para manejar todas las operaciones de la API relacionadas con los usuarios.
 * Centraliza la lógica de las llamadas a la red y el manejo de errores.
 */
export class UserController {
  /**
   * Obtiene la lista completa de usuarios del sistema.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<ApiUser[]>} Una promesa que resuelve con un array de usuarios en formato de la API.
   */
  static async getAllUsers(token: string): Promise<ApiUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener los usuarios del servidor.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * @param {Partial<ApiUser>} userData - Datos del nuevo usuario en formato de la API.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<ApiUser>} Una promesa que resuelve con el usuario creado.
   */
  static async createUser(userData: Partial<ApiUser>, token: string): Promise<ApiUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Error al crear el usuario en el servidor.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente por su ID.
   * @param {string} userId - El ID del usuario a actualizar.
   * @param {Partial<ApiUser>} userData - Los datos a actualizar en formato de la API.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<ApiUser>} Una promesa que resuelve con el usuario actualizado.
   */
  static async updateUser(userId: string, userData: Partial<ApiUser>, token: string): Promise<ApiUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Error al actualizar el usuario en el servidor.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en updateUser:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario por su ID.
   * @param {string} userId - El ID del usuario a eliminar.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<void>} Una promesa que resuelve al completarse la eliminación.
   */
  static async deleteUser(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al eliminar el usuario del servidor.');
      }
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw error;
    }
  }

  /**
   * Alterna el estado activo/inactivo de un usuario.
   * @param {string} userId - El ID del usuario.
   * @param {boolean} usu_activo - El nuevo estado activo/inactivo en formato de la API.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<ApiUser>} Una promesa que resuelve con el usuario actualizado.
   */
  static async toggleUserStatus(userId: string, usu_activo: boolean, token: string): Promise<ApiUser> {
    try {
      // Se corrige la URL para que coincida con la ruta del backend
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: usu_activo }),
      });
      if (!response.ok) {
        throw new Error('Error al cambiar el estado del usuario en el servidor.');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en toggleUserStatus:', error);
      throw error;
    }
  }
}
