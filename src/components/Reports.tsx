import React, { useState, useMemo } from 'react'; // Importa React y hooks necesarios
import { FileText, Download, Filter, Calendar, User, MapPin, ChevronDown } from 'lucide-react'; // Importa íconos de la librería lucide-react
import { Work, ReportFilters } from '../types'; // Importa los tipos Work y ReportFilters
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
      if (filters.realizationDateFrom && work.realizationDate < filters.realizationDateFrom) {
        return false;
      }
      // Filtra por fecha de realización hasta
      if (filters.realizationDateTo && work.realizationDate > filters.realizationDateTo) {
        return false;
      }
      // Filtra por ubicación física si está definida en los filtros
      if (filters.physicalLocation && !work.physicalLocation.toLowerCase().includes(filters.physicalLocation.toLowerCase())) {
        return false;
      }
      // Filtra por fecha de ingreso al museo desde
      if (filters.entryDateFrom && work.museumEntryDate < filters.entryDateFrom) {
        return false;
      }
      // Filtra por fecha de ingreso al museo hasta
      if (filters.entryDateTo && work.museumEntryDate > filters.entryDateTo) {
        return false;
      }
      // Si pasa todos los filtros, se incluye la obra
      return true;
    });
  }, [works, filters]); // Solo recalcula si cambian las obras o los filtros

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

  doc.setFontSize(14);
  doc.text('Reporte de Obras del Museo', 14, 15);

  const headers = [['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación', 'Descripción']];

  const data = filteredWorks.map(work => [
    work.id,
    work.name,
    work.artist,
    new Date(work.realizationDate).toLocaleDateString('es-ES'),
    new Date(work.museumEntryDate).toLocaleDateString('es-ES'),
    work.physicalLocation,
    work.description.replace(/\n/g, ' ') // quita saltos de línea
  ]);

  autoTable(doc, {
    startY: 20,
    head: headers,
    body: data,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185], // azul UCAB
      textColor: 255,
      fontStyle: 'bold',
    },
  });

  doc.save(`reporte_obras_${new Date().toISOString().split('T')[0]}.pdf`);
};


  // Exporta los resultados filtrados a un archivo CSV
  const exportToCSV = () => {
  const headers = ['ID', 'Nombre', 'Artista', 'Fecha Realización', 'Fecha Ingreso', 'Ubicación', 'Descripción'];

  const csvContent = [
    headers.join(';'), // <-- Cambia a punto y coma
    ...filteredWorks.map(work => [
      work.id,
      `"${work.name}"`,
      `"${work.artist}"`,
      new Date(work.realizationDate).toLocaleDateString('es-ES'), // <-- Formato legible
      new Date(work.museumEntryDate).toLocaleDateString('es-ES'),
      `"${work.physicalLocation}"`,
      `"${work.description.replace(/"/g, '""')}"`
    ].join(';'))
  ].join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // <-- BOM para Excel
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
    totalFiltered: filteredWorks.length, // Total de obras filtradas
    artistsCount: new Set(filteredWorks.map(work => work.artist)).size, // Cantidad de artistas únicos
    locationsCount: new Set(filteredWorks.map(work => work.physicalLocation)).size, // Cantidad de ubicaciones únicas
    averageAge: filteredWorks.length > 0 ? 
      Math.round(filteredWorks.reduce((sum, work) => {
        const realizationYear = new Date(work.realizationDate).getFullYear();
        return sum + (new Date().getFullYear() - realizationYear);
      }, 0) / filteredWorks.length) : 0 // Edad promedio de las obras
  };

  // Renderizado del componente
  return (
    // Contenedor principal con estilos de padding y fondo
    <div className="p-8 space-y-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      {/* Encabezado y botones de filtros/exportar */}
      <div className="flex items-center justify-between">
        <div>
          {/* Título principal */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-3">Reportes</h1>
          {/* Descripción */}
          <p className="text-amber-700 text-lg">Genere reportes detallados de las obras del museo</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Botón para mostrar/ocultar filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold' 
                : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50 font-medium'
            }`}
          >
            <Filter className="h-5 w-5" /> {/* Ícono de filtro */}
            <span>Filtros</span>
            {/* Flecha que rota según el estado de los filtros */}
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {/* Botón para exportar a CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Download className="h-5 w-5" /> {/* Ícono de descarga */}
            <span>Exportar CSV</span>
          </button>
          
          <button
              onClick={exportToPDF}
               className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
             <Download className="h-5 w-5" />
              <span>Exportar PDF</span>
              </button>

        </div>
      </div>

      {/* Sección de filtros, visible solo si showFilters es true */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-900">Filtros de Búsqueda</h2>
            {/* Botón para limpiar filtros */}
            <button
              onClick={clearFilters}
              className="text-amber-700 hover:text-amber-900 text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          {/* Campos de filtro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Artista
              </label>
              {/* Input para filtrar por artista */}
              <input
                type="text"
                value={filters.artist || ''}
                onChange={handleFilterChange('artist')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                placeholder="Buscar por artista..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Ubicación Física
              </label>
              {/* Input para filtrar por ubicación física */}
              <input
                type="text"
                value={filters.physicalLocation || ''}
                onChange={handleFilterChange('physicalLocation')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                placeholder="Buscar por ubicación..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Realización (Desde)
              </label>
              {/* Input para filtrar por fecha de realización desde */}
              <input
                type="date"
                value={filters.realizationDateFrom || ''}
                onChange={handleFilterChange('realizationDateFrom')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Realización (Hasta)
              </label>
              {/* Input para filtrar por fecha de realización hasta */}
              <input
                type="date"
                value={filters.realizationDateTo || ''}
                onChange={handleFilterChange('realizationDateTo')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Ingreso (Desde)
              </label>
              {/* Input para filtrar por fecha de ingreso desde */}
              <input
                type="date"
                value={filters.entryDateFrom || ''}
                onChange={handleFilterChange('entryDateFrom')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Ingreso (Hasta)
              </label>
              {/* Input para filtrar por fecha de ingreso hasta */}
              <input
                type="date"
                value={filters.entryDateTo || ''}
                onChange={handleFilterChange('entryDateTo')}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta: Obras filtradas */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Obras Filtradas</p>
              <p className="text-3xl font-bold text-amber-900">{stats.totalFiltered}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-amber-800" />
            </div>
          </div>
        </div>

        {/* Tarjeta: Artistas únicos */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Artistas</p>
              <p className="text-3xl font-bold text-amber-900">{stats.artistsCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-7 w-7 text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Tarjeta: Ubicaciones únicas */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Ubicaciones</p>
              <p className="text-3xl font-bold text-amber-900">{stats.locationsCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="h-7 w-7 text-orange-800" />
            </div>
          </div>
        </div>

        {/* Tarjeta: Edad promedio de las obras */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Edad Promedio</p>
              <p className="text-3xl font-bold text-amber-900">{stats.averageAge} años</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-200 to-red-300 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-red-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de resultados del reporte */}
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
        <div className="p-8 border-b border-amber-200">
          {/* Título de la sección de resultados */}
          <h2 className="text-2xl font-bold text-amber-900">Resultados del Reporte</h2>
          {/* Muestra cuántas obras se están mostrando */}
          <p className="text-amber-700 font-medium">Mostrando {filteredWorks.length} obras de {works.length} total</p>
        </div>

        {/* Contenedor para hacer la tabla desplazable horizontalmente */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-100 to-amber-50">
              <tr>
                {/* Encabezados de la tabla */}
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Obra
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Artista
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Fecha Realización
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Fecha Ingreso
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Ubicación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {/* Renderiza cada obra filtrada como una fila de la tabla */}
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    {/* Muestra el ID de la obra */}
                    <span className="font-mono text-sm bg-amber-100 px-2 py-1 rounded text-amber-800">
                      #{work.id}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      {/* Nombre de la obra */}
                      <p className="font-bold text-amber-900 text-lg">{work.name}</p>
                      {/* Descripción de la obra, truncada si es muy larga */}
                      <p className="text-sm text-amber-600 truncate max-w-xs font-medium">{work.description}</p>
                    </div>
                  </td>
                  {/* Artista de la obra */}
                  <td className="px-8 py-6 text-amber-900 font-semibold">{work.artist}</td>
                  {/* Fecha de realización, formateada */}
                  <td className="px-8 py-6 text-amber-700 font-medium">
                    {new Date(work.realizationDate).toLocaleDateString('es-ES')}
                  </td>
                  {/* Fecha de ingreso al museo, formateada */}
                  <td className="px-8 py-6 text-amber-700 font-medium">
                    {new Date(work.museumEntryDate).toLocaleDateString('es-ES')}
                  </td>
                  {/* Ubicación física de la obra */}
                  <td className="px-8 py-6 text-amber-700">{work.physicalLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje si no hay obras que coincidan con los filtros */}
        {filteredWorks.length === 0 && (
          <div className="p-12 text-center text-amber-600 font-medium text-lg">
            No hay obras que coincidan con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
};

// Exporta el componente Reports para ser usado en otras partes de la aplicación
export default Reports;