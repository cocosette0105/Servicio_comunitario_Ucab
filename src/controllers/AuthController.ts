import { User } from '../models';

/**
 * URL base de tu API de backend.
 * Asegúrate de que coincida con la configuración de tu servidor.
 */
const API_BASE_URL = 'http://localhost:5000/api';

export class AuthController {
  /**
   * Realiza una solicitud de login al backend.
   * @param username - Nombre de usuario.
   * @param password - Contraseña.
   * @returns El objeto de usuario si el login es exitoso, de lo contrario null.
   */
  static async login(username: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // Si la respuesta no es 2xx, lanza un error con el mensaje del servidor
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error de autenticación');
      }

      const data = await response.json();

      // Guarda el token en localStorage para futuras peticiones
      localStorage.setItem('auth_token', data.token);

      // Retorna el objeto de usuario recibido del backend
      return data.user;
    } catch (error) {
      console.error('Error durante el login:', error);
      // Retorna null si hay algún error
      return null;
    }
  }

  /**
   * Recupera el token de autenticación de localStorage.
   * @returns El token JWT o null si no existe.
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Elimina el token y los datos de usuario de localStorage para cerrar la sesión.
   */
  static logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('museum_user'); // Opcional: si también guardas el usuario
  }

  /**
   * Recupera el usuario guardado en localStorage.
   * @returns Objeto de usuario si existe, de lo contrario null.
   */
  static getUserSession(): User | null {
    const savedUser = localStorage.getItem('museum_user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  }

  /**
   * Guarda la sesión del usuario en localStorage.
   * @param user - Objeto de usuario.
   */
  static saveUserSession(user: User): void {
    localStorage.setItem('museum_user', JSON.stringify(user));
  }
}
