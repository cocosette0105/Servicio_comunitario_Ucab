import { useState, useEffect } from 'react';
import { LoginView, DashboardView } from './views';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';
// Se elimina 'UserController' que no se usaba. Se mantiene el resto.
import { AuthController, WorkController, MovementController, MaintenanceController } from './controllers';

function App() {
  // Estado para el usuario autenticado
  const [user, setUser] = useState<User | null>(null);
  
  // NUEVO: Estado para el token de autenticación
  const [token, setToken] = useState<string | null>(null);
    
  // Estado para la vista activa del dashboard
  const [activeView, setActiveView] = useState<'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'>('overview');

  // Estados para los datos de la aplicación
  const [works, setWorks] = useState<Work[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Se ejecuta una vez al montar para verificar si hay una sesión guardada
  useEffect(() => {
    const savedUser = AuthController.getUserSession();
    const savedToken = AuthController.getToken(); // Obtenemos el token

    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
  }, []);

  // ACTUALIZADO: handleLogin ahora recibe y guarda el token
  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    // AuthController se encarga de guardar en localStorage
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null); // Limpiamos el token del estado
    AuthController.logout();
  };

  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    WorkController.saveWorks(newWorks);
  };

  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
  };

  // CORREGIDO: Se elimina la llamada a 'saveMovements' que no existe
  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
  };

  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    MaintenanceController.saveMaintenanceRecords(newRecords);
  };

  // Si no hay usuario O no hay token, mostramos la vista de login
  if (!user || !token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <DashboardView 
      user={user} 
      token={token} // Pasamos el token como prop al Dashboard
      works={works} 
      onLogout={handleLogout}
      onUpdateWorks={updateWorks}
      systemUsers={systemUsers}
      onUpdateSystemUsers={updateSystemUsers}
      movementRecords={movementRecords}
      onUpdateMovementRecords={updateMovementRecords}
      maintenanceRecords={maintenanceRecords}
      onUpdateMaintenanceRecords={updateMaintenanceRecords}
      activeView={activeView}
      onViewChange={setActiveView}
    />
  );
}

export default App;