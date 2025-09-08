import React from 'react';
import Sidebar from '../components/Sidebar';
import WorksManagementView from './WorksManagementView';
import ReportsView from './ReportsView';
import OverviewView from './OverviewView';
import UserManagementView from './UserManagementView';
import MovementHistoryView from './MovementHistoryView';
import MaintenanceHistoryView from './MaintenanceHistoryView';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from '../models';

// Define las propiedades que recibe la vista del dashboard
interface DashboardViewProps {
  user: User; // Usuario actual autenticado
  // **NUEVO**: Añadimos el token a las propiedades
  token: string;
  works: Work[]; // Lista de obras del museo
  onLogout: () => void; // Función para cerrar sesión
   onUpdateWorks: () => Promise<void>;
  systemUsers: SystemUser[]; // Lista de usuarios del sistema
  onUpdateSystemUsers: (users: SystemUser[]) => void; // Función para actualizar usuarios
  movementRecords: MovementRecord[]; // Registros de movimientos
  onUpdateMovementRecords: (records: MovementRecord[]) => void; // Función para actualizar movimientos
  maintenanceRecords: MaintenanceRecord[]; // Registros de mantenimiento
  onUpdateMaintenanceRecords: (records: MaintenanceRecord[]) => void; // Función para actualizar mantenimiento
  activeView: string; // Vista activa actual
  onViewChange: (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => void; // Función para cambiar vista
}

// **ACTUALIZADO**: Recibimos 'token' en las props
const DashboardView: React.FC<DashboardViewProps> = ({ 
  user,
  token,
  works, 
  onLogout, 
  onUpdateWorks,
  systemUsers,
  onUpdateSystemUsers,
  movementRecords,
  onUpdateMovementRecords,
  maintenanceRecords,
  onUpdateMaintenanceRecords,
  activeView,
  onViewChange
}) => {
  // Función que renderiza la vista activa según la selección del usuario
  const renderActiveView = () => {
    // ... (Lógica de permisos sin cambios)

    switch (activeView) {
      case 'overview':
        return <OverviewView works={works} />;
      case 'works':
        return <WorksManagementView user={user} works={works} onUpdateWorks={onUpdateWorks} />;
      case 'reports':
        return <ReportsView works={works} />;
      case 'users':
        return <UserManagementView user={user} users={systemUsers} onUpdateUsers={onUpdateSystemUsers} />;
      
      // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
      case 'movements':
        // Renderizamos el componente SOLO SI el token existe.
        // Y le pasamos el token como prop.
        // También eliminamos las props 'records' y 'onUpdateRecords' que ya no se usan.
        return token && (
          <MovementHistoryView 
            user={user}
            works={works}
            token={token}
          />
        );

      case 'maintenance':
       return <MaintenanceHistoryView 
    user={user}
    token={token} // ✅ Añadir token aquí
    records={maintenanceRecords} 
    works={works}
    onUpdateRecords={onUpdateMaintenanceRecords} 
        />;
      default:
        return <OverviewView works={works} />;
    }
  };

  // Renderizado del layout principal con sidebar y contenido
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#192d71]/5 to-white">
      <Sidebar 
        user={user}
        activeView={activeView}
        onViewChange={onViewChange}
        onLogout={onLogout}
      />
      <div className="flex-1 overflow-auto">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default DashboardView;