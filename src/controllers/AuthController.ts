// frontend/src/controllers/AuthController.ts
import { User } from '../models';

// Interfaz para la respuesta esperada de la API de login
interface LoginResponse {
  user: User;
  token: string;
}

export class AuthController {
  
  /**
   * Realiza la llamada a la API para iniciar sesión.
   * Si tiene éxito, guarda la sesión y devuelve los datos.
   * Si falla, lanza un error.
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      // Asegúrate de que la URL y el puerto son correctos
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error en el inicio de sesión');
      }
      
      // Si el login es exitoso, guardamos la sesión en el navegador
      this.saveSession(responseData.user, responseData.token);

      return responseData;

    } catch (error) {
      console.error("Error en AuthController.login:", error);
      throw error; // Lanzamos el error para que la vista (LoginView) lo pueda capturar y mostrar
    }
  }

  /**
   * Guarda los datos del usuario y el token en el almacenamiento local.
   */
  static saveSession(user: User, token: string): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      console.error("Error al guardar la sesión:", error);
    }
  }

  /**
   * Recupera los datos del usuario desde el almacenamiento local.
   */
  static getUserSession(): User | null {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Error al obtener la sesión del usuario:", error);
      return null;
    }
  }

  /**
   * Recupera el token de autenticación desde el almacenamiento local.
   */
  static getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error("Error al obtener el token:", error);
      return null;
    }
  }

  /**
   * Elimina la sesión del usuario y el token del almacenamiento local.
   */
  static logout(): void {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }
}
