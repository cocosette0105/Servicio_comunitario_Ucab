// src/App.tsx
import { useState, useEffect } from 'react';
import { LoginView, DashboardView } from './views';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';
import { AuthController, WorkController, UserController, MovementController, MaintenanceController } from './controllers';

function App() {
  // Estado para el usuario autenticado (null si no ha iniciado sesión)
  const [user, setUser] = useState<User | null>(null);
   
  // Estado para controlar la vista activa del dashboard
  const [activeView, setActiveView] = useState<'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'>('overview');

  // Estado que contiene las obras registradas en el museo
  const [works, setWorks] = useState<Work[]>([]);

  // Estado que contiene los usuarios registrados en el sistema
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Estado que contiene los registros de movimientos de obras
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);

  // Estado que contiene los registros de mantenimiento realizados a las obras
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // useEffect con dependencias vacías → se ejecuta una única vez al montar el componente
  useEffect(() => {
    // Utiliza el controlador de autenticación para recuperar la sesión
    const savedUser = AuthController.getUserSession();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Función que gestiona el login utilizando el controlador de autenticación
  const handleLogin = (userData: User) => {
    setUser(userData);
    AuthController.saveUserSession(userData);
  };

  // Función para cerrar sesión utilizando el controlador de autenticación
  const handleLogout = () => {
    setUser(null);
    AuthController.logout();
  };

  // Función para actualizar obras utilizando el controlador
  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    WorkController.saveWorks(newWorks);
  };

  // Función para actualizar usuarios utilizando el controlador
  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
    // La siguiente línea causaba el error y se ha eliminado,
    // ya que la responsabilidad de guardar los datos recae en las
    // funciones asíncronas de la API en el UserController.
    // UserController.saveUsers(newUsers);
  };

  // Función para actualizar movimientos utilizando el controlador
  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
    MovementController.saveMovements(newRecords);
  };

  // Función para actualizar mantenimiento utilizando el controlador
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    MaintenanceController.saveMaintenanceRecords(newRecords);
  };

  // Si no hay usuario autenticado, se renderiza la vista de login
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Si hay usuario, se renderiza el dashboard principal
  return (
    <DashboardView 
      user={user} 
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

// Exporta el componente principal
export default App;
