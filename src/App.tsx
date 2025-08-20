// Importa funciones esenciales de React
import { useState, useEffect } from 'react';

// Importa las vistas desde la nueva estructura MVC
import { LoginView, DashboardView } from './views';

// Importa los modelos desde la nueva estructura MVC
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';

// Importa los controladores para manejar la lógica de negocio
import { AuthController, WorkController, UserController, MovementController, MaintenanceController } from './controllers';

// Importa controladores individuales
import { AuthController as Auth } from './controllers/AuthController';
import { WorkController as Works } from './controllers/WorkController';
import { UserController as Users } from './controllers/UserController';
import { MovementController as Movements } from './controllers/MovementController';
import { MaintenanceController as Maintenance } from './controllers/MaintenanceController';

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
    const savedUser = Auth.getUserSession();
    if (savedUser) {
      setUser(savedUser);
    }

    // Inicializa datos de ejemplo utilizando los controladores
    Works.initializeSampleData();
    Users.initializeSampleData();
    Movements.initializeSampleData();
    Maintenance.initializeSampleData();

    // Carga los datos desde los controladores
    setWorks(Works.getAllWorks());
    setSystemUsers(Users.getAllUsers());
    setMovementRecords(Movements.getAllMovements());
    setMaintenanceRecords(Maintenance.getAllMaintenanceRecords());
  }, []);

  // Función que gestiona el login utilizando el controlador de autenticación
  const handleLogin = (userData: User) => {
    setUser(userData);
    Auth.saveUserSession(userData);
  };

  // Función para cerrar sesión utilizando el controlador de autenticación
  const handleLogout = () => {
    setUser(null);
    Auth.clearUserSession();
  };

  // Función para actualizar obras utilizando el controlador
  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    Works.saveWorks(newWorks);
  };

  // Función para actualizar usuarios utilizando el controlador
  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
    Users.saveUsers(newUsers);
  };

  // Función para actualizar movimientos utilizando el controlador
  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
    Movements.saveMovements(newRecords);
  };

  // Función para actualizar mantenimiento utilizando el controlador
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    Maintenance.saveMaintenanceRecords(newRecords);
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