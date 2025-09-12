// frontend/src/hooks/useSessionManager.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../models';
import { AuthController } from '../controllers/AuthController';

interface SessionManagerReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  showInactivityWarning: boolean;
  timeUntilExpiration: number;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  extendSession: () => Promise<boolean>;
  dismissWarning: () => void;
}

export const useSessionManager = (): SessionManagerReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Limpiar el intervalo del countdown
  const clearCountdown = useCallback(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  }, []);

  // LOGOUT DEFINITIVO - ejecutado por AuthController
  const handleSessionExpired = useCallback(() => {
    console.log('🚪 SESIÓN EXPIRADA - Redirigiendo a login');
    clearCountdown();
    setUser(null);
    setToken(null);
    setShowInactivityWarning(false);
    setTimeUntilExpiration(0);
  }, [clearCountdown]);

  // Mostrar warning y comenzar countdown
  const handleShowWarning = useCallback((minutesLeft: number) => {
    console.log(`⚠️ WARNING: ${minutesLeft} minutos hasta logout`);
    setShowInactivityWarning(true);
    setTimeUntilExpiration(minutesLeft);
    
    // Limpiar intervalo anterior si existe
    clearCountdown();
    
    // Crear countdown en segundos para mostrar tiempo restante
    let secondsLeft = minutesLeft * 60;
    
    countdownInterval.current = setInterval(() => {
      secondsLeft -= 1;
      
      if (secondsLeft <= 0) {
        clearCountdown();
        setTimeUntilExpiration(0);
      } else {
        setTimeUntilExpiration(secondsLeft / 60); // Convertir a minutos
      }
    }, 1000); // Actualizar cada segundo
  }, [clearCountdown]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      const loginData = await AuthController.login(username, password);
      
      if (loginData) {
        setUser(loginData.user);
        setToken(loginData.token);
        return { success: true };
      }
      
      return { success: false, message: 'Error desconocido en el login' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Credenciales incorrectas. Verifique su usuario y contraseña.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('👤 Logout manual del usuario');
    clearCountdown();
    AuthController.logout();
    setUser(null);
    setToken(null);
    setShowInactivityWarning(false);
    setTimeUntilExpiration(0);
  }, [clearCountdown]);

  // EXTENDER SESIÓN - se llama cuando el usuario mueve el mouse con el warning visible
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Extendiendo sesión por actividad del usuario...');
      const success = await AuthController.extendSession();
      
      if (success) {
        // Ocultar warning y limpiar countdown
        clearCountdown();
        setShowInactivityWarning(false);
        setTimeUntilExpiration(0);
        console.log('✅ Sesión extendida - warning ocultado');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error al extender sesión:', error);
      return false;
    }
  }, [clearCountdown]);

  // Dismiss warning (mantenido por compatibilidad pero no se usa con el nuevo comportamiento)
  const dismissWarning = useCallback(() => {
    console.log('Warning descartado');
    clearCountdown();
    setShowInactivityWarning(false);
    AuthController.dismissWarning();
  }, [clearCountdown]);

  // Inicialización al montar el componente
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const savedUser = AuthController.getUserSession();
        const savedToken = AuthController.getToken();

        if (savedUser && savedToken) {
          const isValid = AuthController.checkSessionValidity();
          
          if (isValid) {
            const serverValid = await AuthController.verifyToken();
            
            if (serverValid) {
              setUser(savedUser);
              setToken(savedToken);
              
              // Configurar callbacks para warning y expiración
              AuthController.setSessionCallbacks(handleSessionExpired, handleShowWarning);
              
              // Iniciar tracking de actividad
              AuthController.startActivityTracking();
              
              console.log('✅ Sesión restaurada exitosamente');
            } else {
              console.log('❌ Token inválido en el servidor');
              AuthController.logout();
            }
          } else {
            console.log('❌ Sesión inválida localmente');
            AuthController.logout();
          }
        } else {
          console.log('ℹ️ No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ Error al inicializar sesión:', error);
        AuthController.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [handleSessionExpired, handleShowWarning]);

  // Configurar callbacks cuando hay usuario autenticado
  useEffect(() => {
    if (user && token) {
      AuthController.setSessionCallbacks(handleSessionExpired, handleShowWarning);
      console.log('✅ Callbacks de sesión configurados');
    }
  }, [user, token, handleSessionExpired, handleShowWarning]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando SessionManager...');
      clearCountdown();
      AuthController.stopActivityTracking();
    };
  }, [clearCountdown]);

  const isAuthenticated = Boolean(user && token);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    showInactivityWarning,
    timeUntilExpiration,
    login,
    logout,
    extendSession,
    dismissWarning
  };
};