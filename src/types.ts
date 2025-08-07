export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface Work {
  id: string; // ID interno de la base de datos
  
  // SECCIÓN: IDENTIFICACIÓN
  inventoryNumber: string; // N° de Identificación (ej. MCF-219)
  previousNumbers?: string; // N°s anteriores
  name: string; // Nombre del Objeto / Título de la Obra
  artist: string; // Autor/Artesano/Taller
  
  // SECCIÓN: DATOS TÉCNICOS
  classification: string; // Clasificación Genérica (ej. OBRA GRAFICA)
  realizationDate: string; // Corresponde a "Epoca / Estilo / Movim. / Escuela"
  technique: string; // Técnica (ej. AGUAFUERTE)
  materials: string; // Materiales
  dimensions: {
    height?: string;
    width?: string;
    depth?: string;
    diameter?: string;
  };
  
  // SECCIÓN: DESCRIPCIÓN Y OBSERVACIONES
  description: string; // Descripción formal
  signatureDetails?: string; // Ubicación y detalles de la firma
  observations?: string; // Otras observaciones generales
  
  // SECCIÓN: FOTOGRAFÍA
  photo?: File; // Para la carga de un nuevo archivo de imagen
  photoUrl?: string; // URL de la foto ya existente
  
  // SECCIÓN: ESTADO DE CONSERVACIÓN
  conservationState: {
    condition: 'Bueno' | 'Regular' | 'Malo' | '';
    integrity: 'Completo' | 'Incompleto' | 'Fragmento' | '';
  };
  
  // SECCIÓN: DATOS TÉCNICOS
  technicalData: {
    provenance?: string;       // Procedencia
    culture?: string;          // Cultura/Tradición
    eraStyle?: string;         // Epoca /Estilo...
    value?: string;            // Valor / Moneda
    appraiser?: string;        // Responsable de avalúo
    appraisalDate?: string;    // Fecha de avalúo
    originalOwner?: string;    // Propietario Original
  };
  
  // SECCIÓN: REFERENCIAS
  references: {
    documents?: string; // Documentos relacionados
    bibliography?: string; // Bibliografía
    exhibitions?: string; // Exposiciones
    treatments?: string; // Tratamientos realizados
  };
  
  storageLocation?: string; // Ubicación en Depósito
  
  // SECCIÓN: COLECCIÓN
  collection: {
    acquisitionSource?: string; // Fuente de adquisición
    acquisitionMethod?: string; // Forma de adquisición
    entryDate?: string;         // Fecha de Ingreso
  };
  
  // SECCIÓN: RESPONSABLE DE LA OBRA
  responsibleEntity: {
    name?: string; // Nombre de la entidad responsable
    address?: string; // Dirección de la entidad responsable
  };
  
  // SECCIÓN: INVENTARIO
  inventory: {
    responsible?: string; // Responsable del inventario
    date?: string; // Fecha de inventario
    supervisor?: string; // Supervisor del inventario
    supervisorDate?: string; // Fecha de supervisión
  };
}

export interface ReportFilters {
  artist?: string;
  realizationDateFrom?: string;
  realizationDateTo?: string;
  storageLocation?: string;
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
  notes?: string;
  // Nuevos campos para detalles de la obra
  workDetails: {
    author: string;
    title: string;
    technique: string;
    dimensions: string;
    collection: string;
  };
  // Nuevo campo para estado de conservación
  conservationState: string;
  // Información de quien recibe la obra
  receiver: {
    name: string;
    idCard: string;
    phone: string;
  };
  // Información de quien entrega la obra
  deliverer: {
    name: string;
    idCard: string;
    phone: string;
  };
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