// CONTROLADOR DE AUTENTICACIÓN
// Maneja toda la lógica relacionada con el login y logout de usuarios

import { User } from '../models';

export class AuthController {
  /**
   * Valida las credenciales del usuario y retorna el objeto User si son correctas
   * @param username - Nombre de usuario ingresado
   * @param password - Contraseña ingresada
   * @returns User object si las credenciales son válidas, null si no
   */
  static validateCredentials(username: string, password: string): User | null {
    // Autenticación simple (en una app real, esto se haría en el backend)
    if (username === 'admin' && password === 'museo2024') {
      const user: User = {
        id: '1',
        username: 'admin',
        name: 'Administrador del Museo',
        role: 'Curador Principal'
      };
      return user;
    }
    return null;
  }

  /**
   * Guarda el usuario en localStorage para persistir la sesión
   * @param user - Usuario a guardar
   */
  static saveUserSession(user: User): void {
    localStorage.setItem('museum_user', JSON.stringify(user));
  }

  /**
   * Recupera el usuario guardado en localStorage
   * @returns User object si existe sesión, null si no
   */
  static getUserSession(): User | null {
    const savedUser = localStorage.getItem('museum_user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  }

  /**
   * Elimina la sesión del usuario del localStorage
   */
  static clearUserSession(): void {
    localStorage.removeItem('museum_user');
  }
}