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
    const savedUser = AuthController.getUserSession();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Ya no necesitas guardar la sesión aquí, el AuthController lo hace por ti
    // AuthController.saveUserSession(userData);
  };

  const handleLogout = () => {
    setUser(null);
    AuthController.logout();
  };

  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    WorkController.saveWorks(newWorks);
  };

  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
  };

  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
    MovementController.saveMovements(newRecords);
  };

  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    MaintenanceController.saveMaintenanceRecords(newRecords);
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

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

export default App;