// VISTA DE REPORTES
// Vista de presentación para la generación y visualización de reportes de obras
// Permite filtrar, exportar y mostrar estadísticas de la colección

import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, Calendar, User, MapPin, ChevronDown } from 'lucide-react';
import { Work, ReportFilters } from '../models';
import { ReportUtils } from '../utils/reportUtils';

// Define las propiedades que recibe la vista de reportes
interface ReportsViewProps {
  works: Work[]; // Lista de obras para generar reportes
}

// Componente de vista para la generación de reportes
const ReportsView: React.FC<ReportsViewProps> = ({ works }) => {
  // Estados locales para controlar filtros y interfaz
  const [filters, setFilters] = useState<ReportFilters>({}); // Filtros aplicados
  const [showFilters, setShowFilters] = useState(false); // Visibilidad del panel de filtros

  // Memoiza las obras filtradas para optimizar rendimiento
  const filteredWorks = useMemo(() => {
    return ReportUtils.filterWorksForReport(works, filters);
  }, [works, filters]);

  // Maneja los cambios en los filtros
  const handleFilterChange = (field: keyof ReportFilters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Limpia todos los filtros aplicados
  const clearFilters = () => {
    setFilters({});
  };

  // Funciones para exportar reportes
  const exportToPDF = () => {
    ReportUtils.exportToPDF(filteredWorks);
  };

  const exportToCSV = () => {
    ReportUtils.exportToCSV(filteredWorks);
  };

  // Calcula estadísticas de las obras filtradas
  const stats = ReportUtils.calculateStats(filteredWorks);

  // Renderizado de la vista de reportes
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Reportes de Obras
          </h1>
          <p className="text-[#192d71] text-lg">Genere reportes detallados de las obras del museo</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Botón para mostrar/ocultar filtros */}
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
          {/* Botón exportar CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Download className="h-5 w-5" />
            <span>Exportar CSV</span>
          </button>
          {/* Botón exportar PDF */}
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Download className="h-5 w-5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros (mostrado condicionalmente) */}
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
          {/* Grid de campos de filtro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por artista */}
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
            {/* Filtro por ubicación */}
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
            {/* Filtro por fecha de realización desde */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Realización (Desde)</label>
              <input
                type="date"
                value={filters.realizationDateFrom || ''}
                onChange={handleFilterChange('realizationDateFrom')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            {/* Filtro por fecha de realización hasta */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Realización (Hasta)</label>
              <input
                type="date"
                value={filters.realizationDateTo || ''}
                onChange={handleFilterChange('realizationDateTo')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            {/* Filtro por fecha de ingreso desde */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Ingreso (Desde)</label>
              <input
                type="date"
                value={filters.entryDateFrom || ''}
                onChange={handleFilterChange('entryDateFrom')}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
            {/* Filtro por fecha de ingreso hasta */}
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

      {/* Grid de tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta: Obras filtradas */}
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
        {/* Tarjeta: Artistas */}
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
        {/* Tarjeta: Ubicaciones */}
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
        {/* Tarjeta: Edad promedio */}
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

      {/* Tabla de resultados del reporte */}
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
              {/* Mapea cada obra filtrada */}
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
        {/* Mensaje cuando no hay resultados */}
        {filteredWorks.length === 0 && (
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            No hay obras que coincidan con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;