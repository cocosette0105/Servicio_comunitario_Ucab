// models/ORA.model.ts
export interface Obra {
  id?: number;              // PK en la DB
  inventoryNumber: string;  // Número de inventario
  previousNumbers?: string;
  name: string;
  artist: string;

  // Datos técnicos
  classification: string;
  realizationDate: string;
  technique: string;
  materials: string;
  dimensions: {
    height?: string;
    width?: string;
    depth?: string;
    diameter?: string;
  };

  // Descripción
  description: string;
  signatureDetails?: string;
  observations?: string;

  // Fotografía
  photoUrl?: string;

  // Estado de conservación
  conservationState: {
    condition: 'Bueno' | 'Regular' | 'Malo' | '';
    integrity: 'Completo' | 'Incompleto' | 'Fragmento' | '';
  };

  // Datos técnicos adicionales
  technicalData: {
    provenance?: string;
    culture?: string;
    eraStyle?: string;
    value?: string;
    appraiser?: string;
    appraisalDate?: string;
    originalOwner?: string;
  };

  // Referencias
  references: {
    documents?: string;
    bibliography?: string;
    exhibitions?: string;
    treatments?: string;
  };

  storageLocation?: string;

  // Colección
  collection: {
    acquisitionSource?: string;
    acquisitionMethod?: string;
    entryDate?: string;
  };

  // Responsable
  responsibleEntity: {
    name?: string;
    address?: string;
  };

  // Inventario
  inventory: {
    responsible?: string;
    date?: string;
    supervisor?: string;
    supervisorDate?: string;
  };
}
