// CONTROLADOR DE MANTENIMIENTO
// Maneja toda la lógica de negocio relacionada con el mantenimiento de obras

import { MaintenanceRecord } from '../models';

export class MaintenanceController {
  /**
   * Obtiene todos los registros de mantenimiento del localStorage
   * @returns Array de registros de mantenimiento
   */
  static getAllMaintenanceRecords(): MaintenanceRecord[] {
    const savedMaintenance = localStorage.getItem('museum_maintenance');
    if (savedMaintenance) {
      return JSON.parse(savedMaintenance);
    }
    return [];
  }

  /**
   * Guarda los registros de mantenimiento en localStorage
   * @param records - Array de registros a guardar
   */
  static saveMaintenanceRecords(records: MaintenanceRecord[]): void {
    localStorage.setItem('museum_maintenance', JSON.stringify(records));
  }

  /**
   * Busca un registro de mantenimiento por su ID
   * @param id - ID del registro
   * @returns Registro encontrado o undefined
   */
  static findMaintenanceRecordById(id: string): MaintenanceRecord | undefined {
    const records = this.getAllMaintenanceRecords();
    return records.find(record => record.id === id);
  }

  /**
   * Agrega un nuevo registro de mantenimiento
   * @param record - Registro a agregar
   * @returns true si se agregó exitosamente
   */
  static addMaintenanceRecord(record: MaintenanceRecord): boolean {
    const records = this.getAllMaintenanceRecords();
    records.push(record);
    this.saveMaintenanceRecords(records);
    return true;
  }

  /**
   * Actualiza un registro de mantenimiento existente
   * @param updatedRecord - Registro con los datos actualizados
   * @returns true si se actualizó exitosamente, false si no se encontró
   */
  static updateMaintenanceRecord(updatedRecord: MaintenanceRecord): boolean {
    const records = this.getAllMaintenanceRecords();
    const index = records.findIndex(record => record.id === updatedRecord.id);
    
    if (index === -1) {
      return false; // No se encontró el registro
    }
    
    records[index] = updatedRecord;
    this.saveMaintenanceRecords(records);
    return true;
  }

  /**
   * Elimina un registro de mantenimiento por su ID
   * @param id - ID del registro a eliminar
   * @returns true si se eliminó exitosamente, false si no se encontró
   */
  static deleteMaintenanceRecord(id: string): boolean {
    const records = this.getAllMaintenanceRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) {
      return false; // No se encontró el registro
    }
    
    this.saveMaintenanceRecords(filteredRecords);
    return true;
  }

  /**
   * Filtra registros de mantenimiento según criterios
   * @param records - Array de registros a filtrar
   * @param searchTerm - Término de búsqueda
   * @param workTypeFilter - Filtro por tipo de obra
   * @param categoryFilter - Filtro por categoría de mantenimiento
   * @param dateFilter - Filtro por fecha
   * @returns Array de registros filtrados
   */
  static filterMaintenanceRecords(
    records: MaintenanceRecord[],
    searchTerm: string,
    workTypeFilter: 'all' | MaintenanceRecord['workType'],
    categoryFilter: 'all' | MaintenanceRecord['maintenanceCategory'],
    dateFilter: string
  ): MaintenanceRecord[] {
    return records.filter(record => {
      const matchesSearch = !searchTerm || (
        record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.interventionDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesWorkType = workTypeFilter === 'all' || record.workType === workTypeFilter;
      const matchesCategory = categoryFilter === 'all' || record.maintenanceCategory === categoryFilter;
      const matchesDate = !dateFilter || record.date.includes(dateFilter);
      
      return matchesSearch && matchesWorkType && matchesCategory && matchesDate;
    });
  }

  /**
   * Inicializa datos de ejemplo si no existen registros
   */
  static initializeSampleData(): void {
    const existingRecords = this.getAllMaintenanceRecords();
    if (existingRecords.length === 0) {
      const sampleMaintenance: MaintenanceRecord[] = [
        {
          id: '1',
          workId: 'INV-001',
          workName: 'Retrato de Simón Bolívar',
          workType: 'Pintura',
          author: 'Martín Tovar y Tovar',
          dimensions: '120 x 90 cm',
          technique: 'Óleo sobre lienzo',
          year: '1883',
          currentPrice: 'Bs. 150.000,00',
          maintenanceCategory: 'Conservación preventiva',
          interventionDescription: 'Se realizó limpieza superficial con técnicas especializadas y aplicación de barniz protector para preservar los colores originales.',
          date: '2024-01-25'
        }
      ];
      
      this.saveMaintenanceRecords(sampleMaintenance);
    }
  }
}