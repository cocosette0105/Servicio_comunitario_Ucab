// VISTA DE HISTORIAL DE MANTENIMIENTO
// Vista de presentación para la gestión de registros de mantenimiento y conservación
// Permite crear, consultar, editar y generar reportes de intervenciones realizadas

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, FileDown,
  Palette, Hammer, Calendar, DollarSign, FileText, Wrench, X
} from 'lucide-react';
import { MaintenanceRecord, Work, User } from '../models';
import { PDFUtils } from '../utils/pdfUtils';
// Importación de componentes de paginación para manejo responsive
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { MaintenanceController } from '../controllers/MaintenanceController';

// Define las propiedades que recibe la vista de historial de mantenimiento
interface MaintenanceHistoryViewProps {
  user: User;
  token: string;
  records: MaintenanceRecord[];
  works: Work[];
  onUpdateRecords: (records: MaintenanceRecord[]) => void;
}


// Define la estructura de datos para el formulario de mantenimiento
interface MaintenanceFormData {
  workType: MaintenanceRecord['workType']; // Tipo de obra
  workId: string; // ID de la obra seleccionada
  author: string; // Autor (autocompletado)
  workName: string; // Nombre (autocompletado)
  dimensions: string; // Medidas (autocompletado)
  technique: string; // Técnica (autocompletado)
  year: string; // Año (autocompletado)
  currentPrice: string; // Precio actual
  maintenanceCategory: MaintenanceRecord['maintenanceCategory']; // Categoría de mantenimiento
  interventionDescription: string; // Descripción de la intervención
  date: string; // Fecha del mantenimiento
}

// Componente de vista para el historial de mantenimiento
const MaintenanceHistoryView: React.FC<MaintenanceHistoryViewProps> = ({ user, token, records, works, onUpdateRecords }) => {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para filtros y búsqueda (igual que antes)
  const [searchTerm, setSearchTerm] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState<'all' | MaintenanceRecord['workType']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MaintenanceRecord['maintenanceCategory']>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Estados para formulario
  const [workSearchTerm, setWorkSearchTerm] = useState('');
  const [showWorkDropdown, setShowWorkDropdown] = useState(false);
  const [selectedWorkForSearch, setSelectedWorkForSearch] = useState<Work | null>(null);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    workType: 'Pintura',
    workId: '',
    author: '',
    workName: '',
    dimensions: '',
    technique: '',
    year: '',
    currentPrice: '',
    maintenanceCategory: 'Conservación preventiva',
    interventionDescription: '',
    date: ''
  });


   useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const data = await MaintenanceController.getAllMaintenanceRecords();

        onUpdateRecords(data);
      } catch (error) {
        console.error('Error al cargar registros de mantenimiento:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [token]);

  // Opciones disponibles para el tipo de obra
  const workTypes: MaintenanceRecord['workType'][] = [
    'Pintura', 'Escultura', 'Instalación', 'Cerámica', 'Fotografía', 'Artes gráficas', 'Otros'
  ];

  // Filtra las obras disponibles según el tipo seleccionado
  const filteredWorks = works.filter(work => {
    if (formData.workType === 'Otros') {
      // Para "Otros", muestra obras que no coincidan con tipos específicos
      return !['Pintura', 'Escultura', 'Instalación', 'Cerámica', 'Fotografía', 'Artes gráficas'].includes(work.classification);
    }
    // Para otros tipos, filtra por clasificación
    return work.classification.toLowerCase().includes(formData.workType.toLowerCase());
  });

  // Filtra las obras para el buscador basado en el término de búsqueda
  // Busca coincidencias en nombre, artista y número de inventario
  const searchFilteredWorks = filteredWorks.filter(work => {
    if (!workSearchTerm) return true; // Si no hay término de búsqueda, muestra todas las obras filtradas por tipo
    const searchLower = workSearchTerm.toLowerCase();
    return (
      work.name.toLowerCase().includes(searchLower) ||
      work.artist.toLowerCase().includes(searchLower) ||
      work.inventoryNumber.toLowerCase().includes(searchLower)
    );
  });
  // Filtra los registros según los criterios de búsqueda y filtros
  const filteredRecords = records.filter(record => {
  const searchLower = searchTerm.toLowerCase();
  const matchesSearch =
    (record.workName || '').toLowerCase().includes(searchLower) ||
    (record.author || '').toLowerCase().includes(searchLower) ||
    (record.interventionDescription || '').toLowerCase().includes(searchLower);

  const matchesWorkType = workTypeFilter === 'all' || record.workType === workTypeFilter;
  const matchesCategory = categoryFilter === 'all' || record.maintenanceCategory === categoryFilter;
  const matchesDate = !dateFilter || record.date.includes(dateFilter);

  return matchesSearch && matchesWorkType && matchesCategory && matchesDate;
});


  // Implementación del hook de paginación personalizado para registros de mantenimiento
  // Configurado para mostrar 6 registros por página optimizado para contenido detallado
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedRecords,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage
  } = usePagination(filteredRecords, {
    itemsPerPage: 6, // Número de registros por página optimizado para información detallada
    initialPage: 1
  });
  // Maneja la selección de una obra y autocompleta los campos relacionados
  const handleWorkSelection = (id: string) => {
  const selectedWork = works.find(work => String(work.id) === id);

  if (selectedWork) {
    setFormData(prev => ({
      ...prev,
      workId: String(selectedWork.id), // ✅ guarda el ID interno
      author: selectedWork.artist,
      workName: selectedWork.name,
      dimensions: [
        selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm alto`,
        selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm ancho`,
        selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm prof.`,
        selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm diám.`
      ].filter(Boolean).join(' × ') || 'No especificado',
      technique: selectedWork.technique || 'No especificado',
      year: selectedWork.realizationDate || 'No especificado'
    }));

    setSelectedWorkForSearch(selectedWork);
    setWorkSearchTerm(`${selectedWork.name} - ${selectedWork.artist}`);
    setShowWorkDropdown(false);
  } else {
    resetForm();
  }
};

  // Maneja la selección de una obra desde el buscador
  // Esta función se ejecuta cuando el usuario hace clic en una obra del dropdown
  const handleWorkSearchSelection = (work: Work) => {
     handleWorkSelection(String(work.id));
  };

  // Maneja el cambio en el campo de búsqueda de obras
  // Actualiza el término de búsqueda y muestra el dropdown si hay texto
  const handleWorkSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkSearchTerm(value);
    setShowWorkDropdown(value.length > 0);
    
    // Si el usuario borra el texto, limpia la selección
    if (value === '') {
      setSelectedWorkForSearch(null);
      handleWorkSelection(''); // Limpia el formulario
    }
  };

  // Limpia la selección de obra desde el buscador
  // Resetea todos los campos relacionados con la obra seleccionada
  const clearWorkSelection = () => {
    setWorkSearchTerm('');
    setSelectedWorkForSearch(null);
    setShowWorkDropdown(false);
    handleWorkSelection(''); // Limpia el formulario
  };
  // Maneja el envío del formulario para crear o editar un registro
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);

    if (editingRecord) {
      // Actualizar registro existente
      await MaintenanceController.updateMaintenanceRecord(editingRecord.id, formData);
    } else {
      // Crear nuevo registro
      await MaintenanceController.addMaintenanceRecord(formData);
    }

    // 🔄 Vuelvo a cargar todos los registros desde el servidor
    const freshRecords = await MaintenanceController.getAllMaintenanceRecords();
    onUpdateRecords(freshRecords);

    resetForm();
    setShowForm(false);
    setEditingRecord(null);
  } catch (error) {
    console.error('Error al guardar registro:', error);
    alert('No se pudo guardar el registro');
  } finally {
    setLoading(false);
  }
};



  // Reinicia todos los campos del formulario a sus valores por defecto
  const resetForm = () => {
    setFormData({
      workType: 'Pintura',
      workId: '',
      author: '',
      workName: '',
      dimensions: '',
      technique: '',
      year: '',
      currentPrice: '',
      maintenanceCategory: 'Conservación preventiva',
      interventionDescription: '',
      date: ''
    });
    
    // Reinicia también los estados del buscador de obras
    setWorkSearchTerm('');
    setSelectedWorkForSearch(null);
    setShowWorkDropdown(false);
  };

  // Prepara el formulario para editar un registro existente
  const handleEdit = (record: MaintenanceRecord) => {
     setFormData({
      workType: record.workType,
      workId: record.workId,
      author: record.author,
      workName: record.workName,
      dimensions: record.dimensions,
      technique: record.technique,
      year: record.year,
      currentPrice: record.currentPrice, 
      maintenanceCategory: record.maintenanceCategory,
      interventionDescription: record.interventionDescription,
      date: record.date
    });
    // Configura el buscador con la obra del registro en edición
    const workInEdit = works.find(work => work.inventoryNumber === record.workId);
    if (workInEdit) {
      setSelectedWorkForSearch(workInEdit);
      setWorkSearchTerm(`${workInEdit.name} - ${workInEdit.artist}`);
    }
    
    setEditingRecord(record);
    setShowForm(true);
  };

  // Maneja la eliminación de un registro con confirmación
   const handleDelete = async (recordId: string) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      setLoading(true);
      await MaintenanceController.deleteMaintenanceRecord(recordId);
      const updated = records.filter(r => r.id !== recordId);
      onUpdateRecords(updated);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('No se pudo eliminar el registro');
    } finally {
      setLoading(false);
    }
  };
  // Limpia todos los filtros aplicados
  const clearFilters = () => {
    setWorkTypeFilter('all');
    setCategoryFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  // Genera y descarga un PDF del registro seleccionado
  const generatePDF = async (record: MaintenanceRecord) => {
    await PDFUtils.generateMaintenancePDF(record);
  };

  // Renderizado de la vista de historial de mantenimiento
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Historial de Mantenimiento
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Gestione el mantenimiento y conservación de las obras</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Botón para mostrar/ocultar filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center sm:justify-start space-x-2 px-4 py-2 sm:py-2 border rounded-lg transition-colors text-sm sm:text-base ${
              showFilters 
                ? 'bg-[#192d71]/10 border-[#192d71]/30 text-[#192d71] font-semibold' 
                : 'bg-white border-[#192d71]/30 text-[#192d71] hover:bg-[#192d71]/5 font-medium'
            }`}
            title="Consultar historial con filtros"
          >
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Filtros</span>
            <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Botón para agregar nuevo registro */}
          <button
            onClick={() => {
              resetForm();
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
            title="Agregar nuevo historial"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Nuevo Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros (mostrado condicionalmente) */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#192d71]">Filtros de Consulta</h2>
            <button
              onClick={clearFilters}
              className="text-[#192d71] hover:text-[#1e3a8a] text-sm sm:text-base font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por tipo de obra */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Tipo de Obra</label>
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
              >
                <option value="all">Todos los tipos</option>
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Filtro por categoría de mantenimiento */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
              >
                <option value="all">Todas las categorías</option>
                <option value="Conservación preventiva">Conservación preventiva</option>
                <option value="Conservación curativa">Conservación curativa</option>
              </select>
            </div>

            {/* Filtro por fecha */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Fecha</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulario para crear/editar registro (mostrado condicionalmente) */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#192d71] mb-4 sm:mb-6">
            {editingRecord ? 'Modificar Registro de Mantenimiento' : 'Nuevo Registro de Mantenimiento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Sección: Tipo de Obra */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4 flex items-center">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Tipo de Obra
              </h3>
              <select
                value={formData.workType}
                onChange={(e) => {
                  const newWorkType = e.target.value as MaintenanceRecord['workType'];
                  setFormData(prev => ({ 
                    ...prev, 
                    workType: newWorkType,
                    // Limpia la selección de obra cuando cambia el tipo
                    workId: '',
                    author: '',
                    workName: '',
                    dimensions: '',
                    technique: '',
                    year: ''
                  }));
                }}
                className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                required
              >
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sección: Selección de Pieza */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4 flex items-center">
                <Hammer className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Selección de Pieza
              </h3>
              
              {/* Buscador de obras con autocompletado */}
              <div className="mb-4 relative">
                <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3">
                  Buscar Obra
                </label>
                <div className="relative">
                  {/* Campo de búsqueda con icono de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#192d71]/60" />
                    <input
                      type="text"
                      value={workSearchTerm}
                      onChange={handleWorkSearchChange}
                      onFocus={() => workSearchTerm && setShowWorkDropdown(true)}
                      className="w-full pl-10 pr-10 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                      placeholder="Buscar por nombre, artista o código..."
                    />
                    {/* Botón para limpiar la búsqueda */}
                    {workSearchTerm && (
                      <button
                        type="button"
                        onClick={clearWorkSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#192d71]/60 hover:text-[#192d71] transition-colors"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown con resultados de búsqueda */}
                  {showWorkDropdown && searchFilteredWorks.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#192d71]/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {searchFilteredWorks.slice(0, 10).map(work => (
                        <button
                          key={work.inventoryNumber}
                          type="button"
                          onClick={() => handleWorkSearchSelection(work)}
                          className="w-full px-4 py-3 text-left hover:bg-[#192d71]/5 transition-colors border-b border-[#192d71]/10 last:border-b-0"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#192d71] text-sm sm:text-base">
                              {work.name}
                            </span>
                            <span className="text-xs sm:text-sm text-[#192d71]/70">
                              {work.artist} • {work.inventoryNumber}
                            </span>
                            <span className="text-xs text-[#192d71]/50">
                              {work.technique} • {work.realizationDate}
                            </span>
                          </div>
                        </button>
                      ))}
                      {/* Mensaje si no hay resultados */}
                      {searchFilteredWorks.length === 0 && workSearchTerm && (
                        <div className="px-4 py-3 text-center text-[#192d71]/60 text-sm">
                          No se encontraron obras que coincidan con "{workSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selector tradicional (mantiene funcionalidad existente) */}
              <select
                value={formData.workId}
                onChange={(e) => handleWorkSelection(e.target.value)}
                className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                required
              >
                <option value="">Seleccionar obra...</option>
                {filteredWorks.map(work => (
                 <option key={work.id} value={String(work.id)}>
                    {work.name} - {work.artist}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección: Información Autocompletada de la Obra (mostrada condicionalmente) */}
            {formData.workId && (
              <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información de la Obra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Campos autocompletados (solo lectura) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Autor</label>
                    <input
                      type="text"
                      value={formData.author}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.workName}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Medidas</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Técnica</label>
                    <input
                      type="text"
                      value={formData.technique}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Año</label>
                    <input
                      type="text"
                      value={formData.year}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Información del Mantenimiento */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4 flex items-center">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Información del Mantenimiento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Campo precio actual */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Precio Actual (Bs.) *
                  </label>
                  <input
                    type="text"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                    placeholder="Ej: Bs. 50.000,00"
                    required
                  />
                </div>

                {/* Selector categoría de mantenimiento */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Categoría de Mantenimiento *</label>
                  <select
                    value={formData.maintenanceCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceCategory: e.target.value as MaintenanceRecord['maintenanceCategory'] }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                    required
                  >
                    <option value="Conservación preventiva">Conservación preventiva</option>
                    <option value="Conservación curativa">Conservación curativa</option>
                  </select>
                </div>

                {/* Campo fecha */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Fecha del Mantenimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Campo descripción de la intervención */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Descripción de la Intervención *
                </label>
                <textarea
                  value={formData.interventionDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, interventionDescription: e.target.value }))}
                  rows={4}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] resize-none text-sm sm:text-base"
                  placeholder="Describa detalladamente la intervención realizada, materiales utilizados, técnicas aplicadas, resultados obtenidos..."
                  required
                />
              </div>
            </div>

            {/* Botones de acción del formulario */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
              >
                {editingRecord ? 'Actualizar Registro' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de consulta detallada (mostrado condicionalmente) */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#192d71]">Detalles del Mantenimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="text-[#192d71] hover:text-[#1e3a8a] text-xl sm:text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Información de la obra */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información de la Obra</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                    <div><strong className="text-[#192d71]">Tipo:</strong> <span className="ml-1">{viewingRecord.workType}</span></div>
                    <div><strong className="text-[#192d71]">Nombre:</strong> <span className="ml-1">{viewingRecord.workName}</span></div>
                    <div><strong className="text-[#192d71]">Autor:</strong> <span className="ml-1">{viewingRecord.author}</span></div>
                    <div><strong className="text-[#192d71]">Técnica:</strong> <span className="ml-1">{viewingRecord.technique}</span></div>
                    <div><strong className="text-[#192d71]">Medidas:</strong> <span className="ml-1">{viewingRecord.dimensions}</span></div>
                    <div><strong className="text-[#192d71]">Año:</strong> <span className="ml-1">{viewingRecord.year}</span></div>
                  </div>
                </div>

                {/* Información del mantenimiento */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Detalles del Mantenimiento</h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div><strong className="text-[#192d71]">Fecha:</strong> <span className="ml-1">{new Date(viewingRecord.date).toLocaleDateString('es-ES')}</span></div>
                    <div><strong className="text-[#192d71]">Precio Actual:</strong> <span className="ml-1">{viewingRecord.currentPrice}</span></div>
                    <div><strong className="text-[#192d71]">Categoría:</strong> <span className="ml-1">{viewingRecord.maintenanceCategory}</span></div>
                    <div>
                      <strong className="text-[#192d71]">Descripción de la Intervención:</strong>
                      <div className="mt-2 p-3 sm:p-4 bg-white rounded-lg border border-[#192d71]/20 whitespace-pre-wrap text-sm sm:text-base">
                        {viewingRecord.interventionDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setViewingRecord(null);
                    handleEdit(viewingRecord);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base"
                >
                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => generatePDF(viewingRecord)}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#192d71] hover:bg-[#1e3a8a] text-white rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base"
                >
                  <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla principal de registros */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Barra de búsqueda */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra, autor o descripción..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        {/* Tabla de registros */}
        {/* Tabla responsive de registros de mantenimiento */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Precio</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Renderizado de registros paginados con diseño responsive */}
              {paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-sm sm:text-base lg:text-lg">{record.workName}</p>
                      <p className="text-xs sm:text-sm text-[#192d71]/70 font-medium">{record.author}</p>
                      <p className="text-xs text-[#192d71]/60 mt-1">{record.technique}</p>
                      {/* Información adicional visible solo en móviles */}
                      <div className="sm:hidden mt-2 space-y-1">
                        <span className="inline-block px-2 py-1 bg-[#192d71]/10 text-[#192d71] rounded-full text-xs font-semibold">
                          {record.workType}
                        </span>
                        <p className="text-xs text-[#192d71]/60">
                          {new Date(record.date).toLocaleDateString('es-ES')} - {record.currentPrice}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                    <span className="px-3 py-1 bg-[#192d71]/10 text-[#192d71] rounded-full text-sm font-semibold">
                      {record.workType}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden md:table-cell">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.maintenanceCategory === 'Conservación preventiva' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.maintenanceCategory}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 font-medium hidden lg:table-cell">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71] font-semibold hidden lg:table-cell">
                    {record.currentPrice}
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {/* Botones de acción responsive */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                      {/* Botón consultar */}
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Consultar detalles"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-2 sm:p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Modificar registro"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 sm:p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón descargar PDF */}
                      <button
                        onClick={() => generatePDF(record)}
                        className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Descargar PDF"
                      >
                        <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay registros */}
        {/* Mensaje condicional cuando no hay registros que mostrar */}
        {filteredRecords.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {searchTerm || workTypeFilter !== 'all' || categoryFilter !== 'all' || dateFilter 
              ? 'No se encontraron registros que coincidan con los filtros' 
              : 'No hay registros de mantenimiento'}
          </div>
        )}

        {/* Componente de paginación responsive para registros de mantenimiento */}
        {filteredRecords.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            itemsPerPage={6}
            onPageChange={goToPage}
            className="border-t border-[#192d71]/20"
          />
        )}
      </div>
    </div>
  );
};

export default MaintenanceHistoryView;