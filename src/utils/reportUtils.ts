// UTILIDADES PARA REPORTES
// Funciones auxiliares para la generación de reportes y exportación de datos

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Work, ReportFilters } from '../models';

export class ReportUtils {
  /**
   * Filtra obras según los criterios especificados
   * @param works - Array de obras a filtrar
   * @param filters - Filtros a aplicar
   * @returns Array de obras filtradas
   */
  static filterWorksForReport(works: Work[], filters: ReportFilters): Work[] {
    return works.filter(work => {
      // Filtra por artista si está definido en los filtros
      if (filters.artist && !work.artist.toLowerCase().includes(filters.artist.toLowerCase())) {
        return false;
      }
      // Filtra por fecha de realización desde
      if (filters.realizationDateFrom && work.realizationDate && work.realizationDate < filters.realizationDateFrom) {
        return false;
      }
      // Filtra por fecha de realización hasta
      if (filters.realizationDateTo && work.realizationDate && work.realizationDate > filters.realizationDateTo) {
        return false;
      }
      // Filtra por ubicación física (storageLocation)
      if (filters.storageLocation && !work.storageLocation?.toLowerCase().includes(filters.storageLocation.toLowerCase())) {
        return false;
      }
      // Filtra por fecha de ingreso al museo desde (collection.entryDate)
      if (filters.entryDateFrom && work.collection?.entryDate && work.collection.entryDate < filters.entryDateFrom) {
        return false;
      }
      // Filtra por fecha de ingreso al museo hasta (collection.entryDate)
      if (filters.entryDateTo && work.collection?.entryDate && work.collection.entryDate > filters.entryDateTo) {
        return false;
      }
      // Si pasa todos los filtros, se incluye la obra
      return true;
    });
  }

  /**
   * Exporta obras a PDF
   * @param works - Array de obras a exportar
   */
  static exportToPDF(works: Work[]): void {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Reporte de Obras del Museo', 14, 15);

    const headers = [['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación', 'Descripción']];

    const data = works.map(work => [
      work.inventoryNumber,
      work.name,
      work.artist,
      work.realizationDate ? new Date(work.realizationDate).toLocaleDateString('es-ES') : 'N/A',
      work.collection?.entryDate ? new Date(work.collection.entryDate).toLocaleDateString('es-ES') : 'N/A',
      work.storageLocation || 'N/A',
      work.description.replace(/\n/g, ' ')
    ]);

    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 45, 113], textColor: 255, fontStyle: 'bold' },
    });

    doc.save(`reporte_obras_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Exporta obras a CSV
   * @param works - Array de obras a exportar
   */
  static exportToCSV(works: Work[]): void {
    const headers = ['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación', 'Descripción'];

    const csvContent = [
      headers.join(';'),
      ...works.map(work => [
        work.inventoryNumber,
        `"${work.name.replace(/"/g, '""')}"`,
        `"${work.artist.replace(/"/g, '""')}"`,
        work.realizationDate ? new Date(work.realizationDate).toLocaleDateString('es-ES') : 'N/A',
        work.collection?.entryDate ? new Date(work.collection.entryDate).toLocaleDateString('es-ES') : 'N/A',
        `"${(work.storageLocation || 'N/A').replace(/"/g, '""')}"`,
        `"${work.description.replace(/"/g, '""')}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_obras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calcula estadísticas de las obras
   * @param works - Array de obras para calcular estadísticas
   * @returns Objeto con estadísticas calculadas
   */
  static calculateStats(works: Work[]) {
    return {
      totalFiltered: works.length,
      artistsCount: new Set(works.map(work => work.artist)).size,
      locationsCount: new Set(works.map(work => work.storageLocation)).size,
      averageAge: works.length > 0 ?
        Math.round(works.reduce((sum, work) => {
          if (!work.realizationDate) return sum;
          const realizationYear = new Date(work.realizationDate).getFullYear();
          if (isNaN(realizationYear)) return sum;
          return sum + (new Date().getFullYear() - realizationYear);
        }, 0) / works.length) : 0
    };
  }
}