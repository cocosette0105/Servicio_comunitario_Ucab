// CONTROLADOR DE MOVIMIENTOS
// Maneja toda la lógica de negocio relacionada con los movimientos de obras

import { MovementRecord } from '../models';

export class MovementController {
  /**
   * Obtiene todos los registros de movimiento del localStorage
   * @returns Array de registros de movimiento
   */
  static getAllMovements(): MovementRecord[] {
    const savedMovements = localStorage.getItem('museum_movements');
    if (savedMovements) {
      return JSON.parse(savedMovements);
    }
    return [];
  }

  /**
   * Guarda los registros de movimiento en localStorage
   * @param movements - Array de registros a guardar
   */
  static saveMovements(movements: MovementRecord[]): void {
    localStorage.setItem('museum_movements', JSON.stringify(movements));
  }

  /**
   * Busca un registro de movimiento por su ID
   * @param id - ID del registro
   * @returns Registro encontrado o undefined
   */
  static findMovementById(id: string): MovementRecord | undefined {
    const movements = this.getAllMovements();
    return movements.find(movement => movement.id === id);
  }

  /**
   * Agrega un nuevo registro de movimiento
   * @param movement - Registro a agregar
   * @returns true si se agregó exitosamente
   */
  static addMovement(movement: MovementRecord): boolean {
    const movements = this.getAllMovements();
    movements.push(movement);
    this.saveMovements(movements);
    return true;
  }

  /**
   * Actualiza un registro de movimiento existente
   * @param updatedMovement - Registro con los datos actualizados
   * @returns true si se actualizó exitosamente, false si no se encontró
   */
  static updateMovement(updatedMovement: MovementRecord): boolean {
    const movements = this.getAllMovements();
    const index = movements.findIndex(movement => movement.id === updatedMovement.id);
    
    if (index === -1) {
      return false; // No se encontró el registro
    }
    
    movements[index] = updatedMovement;
    this.saveMovements(movements);
    return true;
  }

  /**
   * Elimina un registro de movimiento por su ID
   * @param id - ID del registro a eliminar
   * @returns true si se eliminó exitosamente, false si no se encontró
   */
  static deleteMovement(id: string): boolean {
    const movements = this.getAllMovements();
    const filteredMovements = movements.filter(movement => movement.id !== id);
    
    if (filteredMovements.length === movements.length) {
      return false; // No se encontró el registro
    }
    
    this.saveMovements(filteredMovements);
    return true;
  }

  /**
   * Filtra registros de movimiento según criterios
   * @param movements - Array de registros a filtrar
   * @param searchTerm - Término de búsqueda
   * @param typeFilter - Filtro por tipo de movimiento
   * @param dateFilter - Filtro por fecha
   * @returns Array de registros filtrados
   */
  static filterMovements(
    movements: MovementRecord[], 
    searchTerm: string, 
    typeFilter: 'all' | 'entrada' | 'salida', 
    dateFilter: string
  ): MovementRecord[] {
    return movements.filter(record => {
      const matchesSearch = !searchTerm || (
        record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.workDetails.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.deliverer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      const matchesDate = !dateFilter || record.date.includes(dateFilter);
      
      return matchesSearch && matchesType && matchesDate;
    });
  }

  /**
   * Inicializa datos de ejemplo si no existen registros
   */
  static initializeSampleData(): void {
    const existingMovements = this.getAllMovements();
    if (existingMovements.length === 0) {
      const sampleMovements: MovementRecord[] = [
        {
          id: '1',
          workId: '1',
          workName: 'La Dama de Azul',
          date: '2024-01-20',
          type: 'salida',
          reason: 'Exposición temporal en Museo Nacional',
          notes: 'Préstamo por 3 meses',
          workDetails: {
            author: 'Carmen Vásquez',
            title: 'La Dama de Azul',
            technique: 'Óleo sobre lienzo',
            dimensions: '80 x 60 cm',
            collection: 'Colección Permanente'
          },
          conservationState: 'Excelente estado, sin daños visibles',
          receiver: {
            name: 'Dr. Carlos Mendoza',
            idCard: '12.345.678',
            phone: '+58 212-555-0123'
          },
          deliverer: {
            name: 'María González',
            idCard: '87.654.321',
            phone: '+58 212-555-0456'
          }
        }
      ];
      
      this.saveMovements(sampleMovements);
    }
  }
}