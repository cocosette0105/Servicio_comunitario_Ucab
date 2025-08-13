import React, { useState } from 'react'; // Importa React y el hook useState para manejar el estado local del componente.
import Sidebar from './Sidebar'; // Importa el componente Sidebar, que probablemente muestra el menú lateral.
import WorksManagement from './WorksManagement'; // Importa el componente para la gestión de obras.
import Reports from './Reports'; // Importa el componente para la visualización de reportes.
import Overview from './Overview'; // Importa el componente para la vista general del sistema.
import UserManagement from './UserManagement'; // Importa el componente para la gestión de usuarios del sistema.
import MovementHistory from './MovementHistory'; // Importa el componente para el historial de movimientos.
import MaintenanceHistory from './MaintenanceHistory'; // Importa el componente para el historial de mantenimientos.
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from '../types'; // Importa los tipos utilizados en las props y estados.

interface DashboardProps { // Define las propiedades que recibe el componente Dashboard.
  user: User; // Usuario actual que ha iniciado sesión.
  works: Work[]; // Lista de obras gestionadas.
  onLogout: () => void; // Función para cerrar sesión.
  onUpdateWorks: (works: Work[]) => void; // Función para actualizar la lista de obras.
  systemUsers: SystemUser[]; // Lista de usuarios del sistema.
  onUpdateSystemUsers: (users: SystemUser[]) => void; // Función para actualizar los usuarios del sistema.
  movementRecords: MovementRecord[]; // Lista de registros de movimientos.
  onUpdateMovementRecords: (records: MovementRecord[]) => void; // Función para actualizar los registros de movimientos.
  maintenanceRecords: MaintenanceRecord[]; // Lista de registros de mantenimiento.
  onUpdateMaintenanceRecords: (records: MaintenanceRecord[]) => void; // Función para actualizar los registros de mantenimiento.
}

type ActiveView = 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'; // Define los posibles valores para la vista activa del dashboard.

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  works, 
  onLogout, 
  onUpdateWorks,
  systemUsers,
  onUpdateSystemUsers,
  movementRecords,
  onUpdateMovementRecords,
  maintenanceRecords,
  onUpdateMaintenanceRecords
}) => { // Componente funcional principal que representa el dashboard.
  const [activeView, setActiveView] = useState<ActiveView>('overview'); // Estado local para controlar la vista activa, inicializada en 'overview'.

  const renderActiveView = () => { // Función que retorna el componente correspondiente según la vista activa.
    switch (activeView) { // Evalúa el valor de activeView.
      case 'overview':
        return <Overview works={works} />; // Muestra la vista general con las obras.
      case 'works':
        return <WorksManagement works={works} onUpdateWorks={onUpdateWorks} />; // Muestra la gestión de obras.
      case 'reports':
        return <Reports works={works} />; // Muestra los reportes relacionados con las obras.
      case 'users':
        return <UserManagement users={systemUsers} onUpdateUsers={onUpdateSystemUsers} />; // Muestra la gestión de usuarios.
      case 'movements':
        return <MovementHistory 
          records={movementRecords} 
          works={works}
          onUpdateRecords={onUpdateMovementRecords} 
        />; // Muestra el historial de movimientos, pasando registros y obras.
      case 'maintenance':
        return <MaintenanceHistory 
          records={maintenanceRecords} 
          works={works}
          onUpdateRecords={onUpdateMaintenanceRecords} 
        />; // Muestra el historial de mantenimientos, pasando registros y obras.
      default:
        return <Overview works={works} />; // Si el valor no coincide, muestra la vista general por defecto.
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#192d71]/5 to-white"> {/* Contenedor principal con estilos de flexbox y fondo degradado. */}
      <Sidebar 
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={onLogout}
      /> {/* Renderiza el menú lateral, pasando usuario, vista activa, función para cambiar la vista y función de logout. */}
      <div className="flex-1 overflow-auto">
        {renderActiveView()} {/* Renderiza el componente correspondiente a la vista activa. */}
      </div>
    </div>
  );
};

export default Dashboard; // Exporta el componente Dashboard para su uso en  otras partes de la aplicación.