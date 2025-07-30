export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface Work {
  id: string;
  name: string;
  realizationDate: string;
  artist: string;
  museumEntryDate: string;
  description: string;
  observations?: string; // Nuevo campo para observaciones
  physicalLocation: string;
}

export interface ReportFilters {
  artist?: string;
  realizationDateFrom?: string;
  realizationDateTo?: string;
  physicalLocation?: string;
  entryDateFrom?: string;
  entryDateTo?: string;
}

export interface SystemUser {
  id: string;
  fullName: string;
  username: string;
  password: string;
  role: 'administrador' | 'supervisor' | 'colaborador'; // Roles actualizados
  createdAt: string;
  isActive: boolean;
}

export interface MovementRecord {
  id: string;
  workId: string;
  workName: string;
  date: string;
  type: 'entrada' | 'salida';
  reason: string;
  responsible: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  workId: string;
  workName: string;
  date: string;
  maintenanceType: string;
  observations: string;
  responsible: string;
  status: 'completado' | 'en_proceso' | 'pendiente';
}