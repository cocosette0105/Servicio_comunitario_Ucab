// src/controllers/UserController.ts
import { SystemUser } from '../models';

// URL base de la API, asegúrate de que coincida con la de tu backend
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Clase para manejar todas las operaciones de la API relacionadas con los usuarios.
 * Centraliza la lógica de las llamadas a la red y el manejo de errores.
 */
export class UserController {

  /**
   * Obtiene la lista completa de usuarios del sistema.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<SystemUser[]>} Una promesa que resuelve con un array de usuarios.
   */
  static async getAllUsers(token: string): Promise<SystemUser[]> {
    try {
      // Se añade el token al encabezado de la solicitud.
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
   * @param {Omit<SystemUser, 'id' | 'createdAt' | 'isActive'>} userData - Datos del nuevo usuario.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<SystemUser>} Una promesa que resuelve con el usuario creado.
   */
  static async createUser(userData: Omit<SystemUser, 'id' | 'createdAt' | 'isActive'>, token: string): Promise<SystemUser> {
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
   * @param {Partial<Omit<SystemUser, 'id' | 'createdAt' | 'isActive'>>} userData - Los datos a actualizar.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<SystemUser>} Una promesa que resuelve con el usuario actualizado.
   */
  static async updateUser(userId: string, userData: Partial<Omit<SystemUser, 'id' | 'createdAt' | 'isActive'>>, token: string): Promise<SystemUser> {
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
   * @param {boolean} isActive - El nuevo estado activo/inactivo.
   * @param {string} token - El token de autenticación del usuario.
   * @returns {Promise<SystemUser>} Una promesa que resuelve con el usuario actualizado.
   */
  static async toggleUserStatus(userId: string, isActive: boolean, token: string): Promise<SystemUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/toggle-status/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
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
