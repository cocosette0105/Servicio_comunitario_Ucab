// Importa funciones esenciales de React
import React, { useState, useEffect } from 'react';

// Importa el formulario de inicio de sesión
import LoginForm from './components/LoginForm';

// Importa el componente del panel principal
import Dashboard from './components/Dashboard';

// Importa los tipos utilizados en el estado de la aplicación
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './types';

function App() {
  // Estado para el usuario autenticado (null si no ha iniciado sesión)
  const [user, setUser] = useState<User | null>(null);

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
    // Verifica si hay un usuario previamente guardado en localStorage
    const savedUser = localStorage.getItem('museum_user');
    if (savedUser) {
      // Si existe, se carga al estado
      setUser(JSON.parse(savedUser));
    }

    // Verifica si hay obras guardadas previamente
    const savedWorks = localStorage.getItem('museum_works');
    if (savedWorks) {
      setWorks(JSON.parse(savedWorks)); // Se cargan las obras guardadas
    } else {
      // Si no hay obras guardadas, se inicializa con datos de ejemplo
      const sampleWorks: Work[] = [
        {
          id: '1',
          name: 'La Dama de Azul',
          realizationDate: '1890-03-15',
          artist: 'Carmen Vásquez',
          museumEntryDate: '1920-06-10',
          description: 'Óleo sobre lienzo que representa una dama de la alta sociedad colonial vestida de azul cobalto.',
          observations: 'Obra en excelente estado de conservación',
          physicalLocation: 'Sala A - Estante 1 - Posición 3'
        },
        {
          id: '2',
          name: 'Paisaje Andino',
          realizationDate: '1925-08-22',
          artist: 'Roberto Martínez',
          museumEntryDate: '1935-12-05',
          description: 'Acuarela que captura la majestuosidad de los Andes durante el amanecer.',
          observations: 'Requiere cuidado especial por la técnica de acuarela',
          physicalLocation: 'Sala B - Estante 2 - Posición 1'
        }
      ];
      setWorks(sampleWorks); // Se asignan obras de ejemplo
      localStorage.setItem('museum_works', JSON.stringify(sampleWorks)); // Se guardan en localStorage
    }

    // Verifica si hay usuarios del sistema guardados
    const savedSystemUsers = localStorage.getItem('museum_system_users');
    if (savedSystemUsers) {
      setSystemUsers(JSON.parse(savedSystemUsers)); // Se cargan los usuarios guardados
    } else {
      // Si no hay usuarios, se inicializa con datos de ejemplo
      const sampleUsers: SystemUser[] = [
        {
          id: '1',
          fullName: 'María González',
          username: 'mgonzalez',
          password: 'curador123',
          role: 'curador',
          createdAt: '2024-01-15',
          isActive: true
        },
        {
          id: '2',
          fullName: 'Carlos Mendoza',
          username: 'cmendoza',
          password: 'mant456',
          role: 'mantenimiento',
          createdAt: '2024-02-10',
          isActive: true
        }
      ];
      setSystemUsers(sampleUsers); // Se asignan usuarios de ejemplo
      localStorage.setItem('museum_system_users', JSON.stringify(sampleUsers)); // Se guardan en localStorage
    }

    // Verifica si hay registros de movimiento guardados
    const savedMovements = localStorage.getItem('museum_movements');
    if (savedMovements) {
      setMovementRecords(JSON.parse(savedMovements)); // Se cargan los movimientos guardados
    } else {
      // Si no existen, se inicializa con un registro de ejemplo
      const sampleMovements: MovementRecord[] = [
        {
          id: '1',
          workId: '1',
          workName: 'La Dama de Azul',
          date: '2024-01-20',
          type: 'salida',
          reason: 'Exposición temporal en Museo Nacional',
          responsible: 'María González',
          notes: 'Préstamo por 3 meses'
        }
      ];
      setMovementRecords(sampleMovements); // Se asigna el movimiento de ejemplo
      localStorage.setItem('museum_movements', JSON.stringify(sampleMovements)); // Se guarda en localStorage
    }

    // Verifica si hay registros de mantenimiento guardados
    const savedMaintenance = localStorage.getItem('museum_maintenance');
    if (savedMaintenance) {
      setMaintenanceRecords(JSON.parse(savedMaintenance)); // Se cargan los registros guardados
    } else {
      // Se inicializa con un mantenimiento de ejemplo
      const sampleMaintenance: MaintenanceRecord[] = [
        {
          id: '1',
          workId: '2',
          workName: 'Paisaje Andino',
          date: '2024-01-25',
          maintenanceType: 'Limpieza y conservación',
          observations: 'Se realizó limpieza superficial y aplicación de barniz protector',
          responsible: 'Carlos Mendoza',
          status: 'completado'
        }
      ];
      setMaintenanceRecords(sampleMaintenance); // Se asigna al estado
      localStorage.setItem('museum_maintenance', JSON.stringify(sampleMaintenance)); // Se guarda en localStorage
    }
  }, []);

  // Función que gestiona el login, actualiza estado y guarda el usuario en localStorage
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('museum_user', JSON.stringify(userData));
  };

  // Función para cerrar sesión y limpiar usuario en localStorage
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('museum_user');
  };

  // Función para actualizar obras y sincronizar con localStorage
  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    localStorage.setItem('museum_works', JSON.stringify(newWorks));
  };

  // Función para actualizar usuarios del sistema y sincronizar con localStorage
  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
    localStorage.setItem('museum_system_users', JSON.stringify(newUsers));
  };

  // Función para actualizar registros de movimiento y sincronizar con localStorage
  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
    localStorage.setItem('museum_movements', JSON.stringify(newRecords));
  };

  // Función para actualizar registros de mantenimiento y sincronizar con localStorage
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    localStorage.setItem('museum_maintenance', JSON.stringify(newRecords));
  };

  // Si no hay usuario autenticado, se renderiza el formulario de login
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Si hay usuario, se renderiza el dashboard principal con todas las propiedades necesarias
  return (
    <Dashboard 
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
    />
  );
}

// Exporta el componente principal para ser usado en otras partes de la app
export default App;