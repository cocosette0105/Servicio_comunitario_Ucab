import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, Calendar, User, MapPin, ChevronDown } from 'lucide-react';
import { Work, ReportFilters } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '/logoblanco_negro.jpg';

// Define las props que recibe el componente Reports
interface ReportsProps {
  works: Work[]; // Lista de obras a mostrar y filtrar
}

// Componente principal Reports
const Reports: React.FC<ReportsProps> = ({ works }) => {
  // Estado para los filtros aplicados en el reporte
  const [filters, setFilters] = useState<ReportFilters>({});
  // Estado para mostrar u ocultar los filtros
  const [showFilters, setShowFilters] = useState(false);

  // Memoiza la lista de obras filtradas según los filtros aplicados
  const filteredWorks = useMemo(() => {
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
  }, [works, filters]);

  // Maneja el cambio de los filtros, actualizando el estado correspondiente
  const handleFilterChange = (field: keyof ReportFilters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Limpia todos los filtros aplicados
  const clearFilters = () => {
    setFilters({});
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const MARGIN = 14; // Margen para el contenido

    // Se eliminó el título de aquí, porque ahora irá en el encabezado de cada página.
    // doc.text('Reporte de Obras del Museo', 14, 15); 

    const headers = [['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación']];

    // Se quita la descripción para que la tabla no sea demasiado ancha
    const data = filteredWorks.map(work => [
      work.inventoryNumber,
      work.name,
      work.artist,
      work.realizationDate ? new Date(work.realizationDate).toLocaleDateString('es-ES') : 'N/A',
      work.collection?.entryDate ? new Date(work.collection.entryDate).toLocaleDateString('es-ES') : 'N/A',
      work.storageLocation || 'N/A',
    ]);

    autoTable(doc, {
      // 1. Se aumenta el startY para dejar espacio al nuevo encabezado.
      startY: 30, 
      head: headers,
      body: data,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [12, 57, 102], textColor: 255, fontStyle: 'bold' },

      // 2. Se añade el hook didDrawPage para dibujar el encabezado en CADA PÁGINA.
      didDrawPage: (data) => {
        // --- Encabezado ---
        const LOGO_WIDTH = 30;
        const LOGO_HEIGHT = 12;

        // Añadir logo en la esquina superior izquierda
        doc.addImage(logoSrc, 'JPEG', MARGIN, MARGIN - 5, LOGO_WIDTH, LOGO_HEIGHT);

        // Añadir título del reporte
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de Obras del Museo', MARGIN + LOGO_WIDTH + 5, MARGIN + 2);

        // Añadir fecha de generación
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, doc.internal.pageSize.getWidth() - MARGIN, MARGIN + 2, { align: 'right' });
      },
    });

    doc.save(`reporte_obras_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Exporta los resultados filtrados a un archivo CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación', 'Descripción'];

    const csvContent = [
      headers.join(';'), // Usar punto y coma para compatibilidad con Excel en español
      ...filteredWorks.map(work => [
        work.inventoryNumber,
        `"${work.name.replace(/"/g, '""')}"`,
        `"${work.artist.replace(/"/g, '""')}"`,
        work.realizationDate ? new Date(work.realizationDate).toLocaleDateString('es-ES') : 'N/A',
        work.collection?.entryDate ? new Date(work.collection.entryDate).toLocaleDateString('es-ES') : 'N/A',
        `"${(work.storageLocation || 'N/A').replace(/"/g, '""')}"`,
        `"${work.description.replace(/"/g, '""')}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_obras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcula estadísticas de las obras filtradas
  const stats = {
    totalFiltered: filteredWorks.length,
    artistsCount: new Set(filteredWorks.map(work => work.artist)).size,
    locationsCount: new Set(filteredWorks.map(work => work.storageLocation)).size,
    averageAge: filteredWorks.length > 0 ?
      Math.round(filteredWorks.reduce((sum, work) => {
        if (!work.realizationDate) return sum;
        const realizationYear = new Date(work.realizationDate).getFullYear();
        if (isNaN(realizationYear)) return sum; // Evitar NaN si la fecha es inválida
        return sum + (new Date().getFullYear() - realizationYear);
      }, 0) / filteredWorks.length) : 0
  };

  // Renderizado del componente
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">Reportes de Obras</h1>
          <p className="text-[#192d71] text-lg">Genere reportes detallados de las obras del museo</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-[#192d71]/10 border-[#192d71]/30 text-[#192d71] font-semibold'
                : 'bg-white border-[#192d71]/30 text-[#192d71] hover:bg-[#192d71]/5 font-medium'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Download className="h-5 w-5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Download className="h-5 w-5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#192d71]">Filtros de Búsqueda</h2>
            <button
              onClick={clearFilters}
              className="text-[#192d71] hover:text-[#1e3a8a] text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Artista</label>
              <input
                type="text"
                value={filters.artist || ''}
                onChange={handleFilterChange('artist')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Buscar por artista..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Ubicación Física</label>
              <input
                type="text"
                value={filters.storageLocation || ''}
                onChange={handleFilterChange('storageLocation')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Buscar por ubicación..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Realización (Desde)</label>
              <input
                type="date"
                value={filters.realizationDateFrom || ''}
                onChange={handleFilterChange('realizationDateFrom')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Realización (Hasta)</label>
              <input
                type="date"
                value={filters.realizationDateTo || ''}
                onChange={handleFilterChange('realizationDateTo')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Ingreso (Desde)</label>
              <input
                type="date"
                value={filters.entryDateFrom || ''}
                onChange={handleFilterChange('entryDateFrom')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Ingreso (Hasta)</label>
              <input
                type="date"
                value={filters.entryDateTo || ''}
                onChange={handleFilterChange('entryDateTo')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Obras Filtradas</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.totalFiltered}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-[#192d71]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Artistas</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.artistsCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-7 w-7 text-[#192d71]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Ubicaciones</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.locationsCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="h-7 w-7 text-[#192d71]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Edad Promedio</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.averageAge} años</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-[#192d71]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        <div className="p-8 border-b border-[#192d71]/20">
          <h2 className="text-2xl font-bold text-[#192d71]">Resultados del Reporte</h2>
          <p className="text-[#192d71]/80 font-medium">Mostrando {filteredWorks.length} obras de {works.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">ID</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Artista</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha Realización</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha Ingreso</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <span className="font-mono text-sm bg-[#192d71]/10 px-2 py-1 rounded text-[#192d71]">
                      {work.inventoryNumber}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{work.name}</p>
                      <p className="text-sm text-[#192d71]/70 truncate max-w-xs font-medium">{work.description}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[#192d71] font-semibold">{work.artist}</td>
                  <td className="px-8 py-6 text-amber-700 font-medium">
                    {work.realizationDate ? new Date(work.realizationDate).toLocaleDateString('es-ES') : 'N/A'}
                  </td>
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {work.collection?.entryDate ? new Date(work.collection.entryDate).toLocaleDateString('es-ES') : 'N/A'}
                  </td>
                  <td className="px-8 py-6 text-[#192d71]/80">{work.storageLocation || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWorks.length === 0 && (
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            No hay obras que coincidan con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;