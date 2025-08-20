// CONTROLADOR DE OBRAS
// Maneja toda la lógica de negocio relacionada con las obras del museo

import { Work } from '../models';

export class WorkController {
  /**
   * Obtiene todas las obras del localStorage
   * @returns Array de obras
   */
  static getAllWorks(): Work[] {
    const savedWorks = localStorage.getItem('museum_works');
    if (savedWorks) {
      return JSON.parse(savedWorks);
    }
    return [];
  }

  /**
   * Guarda las obras en localStorage
   * @param works - Array de obras a guardar
   */
  static saveWorks(works: Work[]): void {
    localStorage.setItem('museum_works', JSON.stringify(works));
  }

  /**
   * Busca una obra por su número de inventario
   * @param inventoryNumber - Número de inventario de la obra
   * @returns Obra encontrada o undefined
   */
  static findWorkByInventoryNumber(inventoryNumber: string): Work | undefined {
    const works = this.getAllWorks();
    return works.find(work => work.inventoryNumber === inventoryNumber);
  }

  /**
   * Busca una obra por su ID
   * @param id - ID de la obra
   * @returns Obra encontrada o undefined
   */
  static findWorkById(id: string): Work | undefined {
    const works = this.getAllWorks();
    return works.find(work => work.id === id);
  }

  /**
   * Agrega una nueva obra
   * @param work - Obra a agregar
   * @returns true si se agregó exitosamente, false si ya existe
   */
  static addWork(work: Work): boolean {
    const works = this.getAllWorks();
    const existingWork = works.find(w => w.id === work.id);
    
    if (existingWork) {
      return false; // Ya existe una obra con este ID
    }
    
    works.push(work);
    this.saveWorks(works);
    return true;
  }

  /**
   * Actualiza una obra existente
   * @param updatedWork - Obra con los datos actualizados
   * @returns true si se actualizó exitosamente, false si no se encontró
   */
  static updateWork(updatedWork: Work): boolean {
    const works = this.getAllWorks();
    const index = works.findIndex(work => work.id === updatedWork.id);
    
    if (index === -1) {
      return false; // No se encontró la obra
    }
    
    works[index] = updatedWork;
    this.saveWorks(works);
    return true;
  }

  /**
   * Elimina una obra por su ID
   * @param id - ID de la obra a eliminar
   * @returns true si se eliminó exitosamente, false si no se encontró
   */
  static deleteWork(id: string): boolean {
    const works = this.getAllWorks();
    const filteredWorks = works.filter(work => work.id !== id);
    
    if (filteredWorks.length === works.length) {
      return false; // No se encontró la obra
    }
    
    this.saveWorks(filteredWorks);
    return true;
  }

  /**
   * Filtra obras según criterios de búsqueda
   * @param works - Array de obras a filtrar
   * @param searchTerm - Término de búsqueda
   * @returns Array de obras filtradas
   */
  static filterWorks(works: Work[], searchTerm: string): Work[] {
    if (!searchTerm) return works;
    
    const term = searchTerm.toLowerCase();
    return works.filter(work =>
      work.name.toLowerCase().includes(term) ||
      work.artist.toLowerCase().includes(term) ||
      (work.storageLocation ?? '').toLowerCase().includes(term)
    );
  }

  /**
   * Inicializa datos de ejemplo si no existen obras
   */
  static initializeSampleData(): void {
    const existingWorks = this.getAllWorks();
    if (existingWorks.length === 0) {
      const sampleWorks: Work[] = [
        {
          id: "INV-001",
          inventoryNumber: "INV-001",
          name: "Retrato de Simón Bolívar",
          artist: "Martín Tovar y Tovar",
          classification: "Pintura al óleo",
          technique: "Óleo",
          materials: "Lienzo",
          realizationDate: "1883",
          dimensions: {
            height: "120",
            width: "90",
            depth: undefined,
            diameter: undefined,
          },
          description: "Retrato clásico del Libertador Simón Bolívar, representado con uniforme militar y mirada firme hacia el horizonte. Pintado con trazos suaves y detallados.",
          observations: "Obra en excelente estado, recientemente restaurada.",
          photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Mart%C3%ADn_Tovar_y_Tovar_-_Sim%C3%B3n_Bol%C3%ADvar_1883.jpg/800px-Mart%C3%ADn_Tovar_y_Tovar_-_Sim%C3%B3n_Bol%C3%ADvar_1883.jpg",
          conservationState: {
            condition: "Bueno",
            integrity: "Completo",
          },
          references: {
            documents: "Certificado de autenticidad emitido por el Museo Nacional.",
            bibliography: "Libro 'La pintura venezolana del siglo XIX', pág. 145.",
            exhibitions: "Expuesta en el Museo de Bellas Artes, 2019.",
            treatments: "Restauración superficial en 2022 para conservación del color.",
          },
          technicalData: {
            provenance: "Museo Nacional de Historia",
            culture: "Venezolana",
            value: "50000 USD",
            appraiser: "Ana Rodríguez",
            appraisalDate: "2023-11-15",
            originalOwner: "Colección privada de la familia Bolívar",
          },
          collection: {
            acquisitionSource: "Donación del Ministerio de Cultura",
            acquisitionMethod: "Donación",
            entryDate: "2023-12-01",
          },
          responsibleEntity: {
            name: "Museo Nacional de Historia",
            address: "Av. Universidad, Caracas, Venezuela",
          },
          inventory: {
            responsible: "Carlos Pérez",
            date: "2024-01-05",
            supervisor: "Laura Mendoza",
            supervisorDate: "2024-01-06",
          },
          storageLocation: "Depósito A - Estantería 4, Nivel 2",
          previousNumbers: "CAT-2005-021, REG-1987-045",
        }
      ];
      
      this.saveWorks(sampleWorks);
    }
  }
}