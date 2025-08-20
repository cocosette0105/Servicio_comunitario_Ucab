// VISTA DEL DASHBOARD PRINCIPAL
// Vista de presentación pura que renderiza el layout principal del sistema
// Recibe props del controlador y delega la renderización a componentes específicos

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
  works: Work[]; // Lista de obras del museo
  onLogout: () => void; // Función para cerrar sesión
  onUpdateWorks: (works: Work[]) => void; // Función para actualizar obras
  systemUsers: SystemUser[]; // Lista de usuarios del sistema
  onUpdateSystemUsers: (users: SystemUser[]) => void; // Función para actualizar usuarios
  movementRecords: MovementRecord[]; // Registros de movimientos
  onUpdateMovementRecords: (records: MovementRecord[]) => void; // Función para actualizar movimientos
  maintenanceRecords: MaintenanceRecord[]; // Registros de mantenimiento
  onUpdateMaintenanceRecords: (records: MaintenanceRecord[]) => void; // Función para actualizar mantenimiento
  activeView: string; // Vista activa actual
  onViewChange: (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => void; // Función para cambiar vista
}

// Componente de vista pura para el dashboard principal
const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, 
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
    switch (activeView) {
      case 'overview':
        return <OverviewView works={works} />;
      case 'works':
        return <WorksManagementView works={works} onUpdateWorks={onUpdateWorks} />;
      case 'reports':
        return <ReportsView works={works} />;
      case 'users':
        return <UserManagementView users={systemUsers} onUpdateUsers={onUpdateSystemUsers} />;
      case 'movements':
        return <MovementHistoryView 
          records={movementRecords} 
          works={works}
          onUpdateRecords={onUpdateMovementRecords} 
        />;
      case 'maintenance':
        return <MaintenanceHistoryView 
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
      {/* Sidebar de navegación */}
      <Sidebar 
        user={user}
        activeView={activeView}
        onViewChange={onViewChange}
        onLogout={onLogout}
      />
      {/* Área de contenido principal */}
      <div className="flex-1 overflow-auto">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default DashboardView;