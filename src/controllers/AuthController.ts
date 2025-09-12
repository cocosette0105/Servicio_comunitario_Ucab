// frontend/src/controllers/AuthController.ts
import { User } from '../models';

interface LoginResponse {
  user: User;
  token: string;
  sessionConfig?: {
    inactivityTimeout: number;
    maxSessionDuration: number;
    warningTime: number;
  };
}

interface SessionData {
  user: User;
  token: string;
  lastActivity: number;
  sessionConfig: {
    inactivityTimeout: number;
    maxSessionDuration: number;
    warningTime: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Eventos que detectan actividad del usuario
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove', 
  'keypress',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
  'wheel'
];

export class AuthController {
  private static activityListenersActive = false;
  private static warningTimer: NodeJS.Timeout | null = null;
  private static expirationTimer: NodeJS.Timeout | null = null;
  private static onSessionExpired: (() => void) | null = null;
  private static onShowWarning: ((minutesLeft: number) => void) | null = null;
  private static isWarningShown = false;
  private static lastActivityTime = Date.now();
  
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error en el inicio de sesión');
      }
      
      this.saveSession(responseData.user, responseData.token, responseData.sessionConfig);
      this.startActivityTracking();

      return responseData;

    } catch (error) {
      console.error("Error en AuthController.login:", error);
      throw error;
    }
  }

  static saveSession(user: User, token: string, sessionConfig?: any): void {
    try {
      const sessionData: SessionData = {
        user,
        token,
        lastActivity: Date.now(),
        sessionConfig: sessionConfig || {
          inactivityTimeout: 20,
          maxSessionDuration: 8,
          warningTime: 3
        }
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      this.lastActivityTime = Date.now();
    } catch (error) {
      console.error("Error al guardar la sesión:", error);
    }
  }

  static getSessionData(): SessionData | null {
    try {
      const sessionDataJson = localStorage.getItem('sessionData');
      return sessionDataJson ? JSON.parse(sessionDataJson) : null;
    } catch (error) {
      console.error("Error al obtener los datos de sesión:", error);
      return null;
    }
  }

  static getUserSession(): User | null {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Error al obtener la sesión del usuario:", error);
      return null;
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error("Error al obtener el token:", error);
      return null;
    }
  }

  static setSessionCallbacks(
    onExpired: () => void,
    onWarning?: (minutesLeft: number) => void
  ): void {
    this.onSessionExpired = onExpired;
    this.onShowWarning = onWarning || null;
  }

  // Limpiar todos los timers
  private static clearAllTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.isWarningShown = false;
    console.log('✅ Timers limpiados y warning ocultado');
  }

  // Actualizar actividad y reiniciar timers
  static updateActivity(): void {
    const sessionData = this.getSessionData();
    if (!sessionData) return;

    const now = Date.now();
    
    // Solo actualizar si ha pasado al menos 1 segundo desde la última actualización
    // para evitar demasiadas actualizaciones
    if (now - this.lastActivityTime < 1000) return;
    
    this.lastActivityTime = now;

    // Actualizar timestamp en localStorage
    sessionData.lastActivity = now;
    localStorage.setItem('sessionData', JSON.stringify(sessionData));

    // Si el warning está visible, ocultarlo
    if (this.isWarningShown) {
      this.isWarningShown = false;
      console.log('🔄 Actividad detectada - ocultando warning y reiniciando timers');
    }

    // Reiniciar todos los timers
    this.startSessionTimers(sessionData);
  }

  // Configurar timers para warning y expiración
  private static startSessionTimers(sessionData: SessionData): void {
    // Limpiar timers existentes
    this.clearAllTimers();

    const inactivityMs = sessionData.sessionConfig.inactivityTimeout * 60 * 1000;
    const warningMs = sessionData.sessionConfig.warningTime * 60 * 1000;
    const timeToWarning = inactivityMs - warningMs;
    
    console.log(`⏱️ Configurando timers:`);
    console.log(`   - Warning en: ${Math.floor(timeToWarning/1000/60)} minutos`);
    console.log(`   - Logout en: ${Math.floor(inactivityMs/1000/60)} minutos`);

    // Timer para mostrar warning
    this.warningTimer = setTimeout(() => {
      if (this.onShowWarning && !this.isWarningShown) {
        this.isWarningShown = true;
        console.log(`⚠️ Mostrando warning: ${sessionData.sessionConfig.warningTime} minutos restantes`);
        this.onShowWarning(sessionData.sessionConfig.warningTime);
      }
    }, timeToWarning);

    // Timer para logout definitivo
    this.expirationTimer = setTimeout(() => {
      console.log('🚪 LOGOUT AUTOMÁTICO - Tiempo de inactividad agotado');
      this.forceLogout();
    }, inactivityMs);
  }

  // Forzar logout
  private static forceLogout(): void {
    console.log('🔒 Ejecutando logout forzado');
    
    this.stopActivityTracking();
    this.logout();
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  static checkSessionValidity(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    const now = Date.now();
    const lastActivity = sessionData.lastActivity;
    const inactivityMs = sessionData.sessionConfig.inactivityTimeout * 60 * 1000;
    
    const timeSinceLastActivity = now - lastActivity;
    
    if (timeSinceLastActivity > inactivityMs) {
      console.log('❌ Sesión inválida por inactividad');
      this.forceLogout();
      return false;
    }

    return true;
  }

  static startActivityTracking(): void {
    if (this.activityListenersActive) return;

    const sessionData = this.getSessionData();
    if (!sessionData) return;

    // Manejador de actividad con throttling
    let activityTimeout: NodeJS.Timeout | null = null;
    const activityHandler = () => {
      // Cancelar timeout anterior si existe
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Programar actualización con un pequeño delay para evitar múltiples llamadas
      activityTimeout = setTimeout(() => {
        this.updateActivity();
      }, 500);
    };
    
    // Agregar listeners para todos los eventos
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });

    // Iniciar los timers
    this.startSessionTimers(sessionData);
    this.activityListenersActive = true;

    console.log('✅ Seguimiento de actividad iniciado');
  }

  static stopActivityTracking(): void {
    if (!this.activityListenersActive) return;

    // Remover todos los event listeners
    const activityHandler = () => this.updateActivity();
    
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, activityHandler);
    });

    // Limpiar todos los timers
    this.clearAllTimers();

    this.activityListenersActive = false;
    console.log('⏹️ Seguimiento de actividad detenido');
  }

  // Extender sesión manualmente (cuando se mueve el mouse con el warning visible)
  static async extendSession(): Promise<boolean> {
    try {
      console.log('🔄 Extendiendo sesión...');
      
      const token = this.getToken();
      if (!token) {
        console.log('❌ No hay token para extender');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = this.getUserSession();
        const sessionData = this.getSessionData();
        
        if (user && sessionData) {
          // Guardar el nuevo token
          this.saveSession(user, data.token, sessionData.sessionConfig);
          
          // Ocultar warning
          this.isWarningShown = false;
          
          // Reiniciar completamente la actividad
          this.updateActivity();
          
          console.log('✅ Sesión extendida exitosamente');
          return true;
        }
      } else {
        console.log('❌ Error al extender sesión:', response.status);
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error al extender sesión:', error);
      return false;
    }
  }

  // Dismiss warning (no usado ahora, pero mantenido por compatibilidad)
  static dismissWarning(): void {
    this.isWarningShown = false;
    console.log('Warning descartado');
  }

  static async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newToken = response.headers.get('x-new-token');
        if (newToken) {
          const user = this.getUserSession();
          const sessionData = this.getSessionData();
          if (user && sessionData) {
            this.saveSession(user, newToken, sessionData.sessionConfig);
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return false;
    }
  }

  static logout(): void {
    try {
      this.stopActivityTracking();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionData');
      console.log('🚪 Logout completado');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }
}
