// VISTA DE HISTORIAL DE MOVIMIENTOS
// Vista de presentación para la gestión de registros de entrada y salida de obras
// Permite crear, consultar, editar y generar reportes de movimientos realizados

import React, { useState } from 'react';
import { 
  Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, FileDown,
  ArrowUpDown, Calendar, User, Phone, FileText, Package, X
} from 'lucide-react';
import { MovementRecord, Work } from '../models';
import { User as UserType } from '../types';
import { PDFUtils } from '../utils/pdfUtils';
// Importación de componentes de paginación para manejo responsive
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

// Define las propiedades que recibe la vista de historial de movimientos
interface MovementHistoryViewProps {
  user: UserType;
  records: MovementRecord[];
  works: Work[];
  onUpdateRecords: (records: MovementRecord[]) => void;
}

// Define la estructura de datos para el formulario de movimientos
interface MovementFormData {
  workId: string; // ID de la obra seleccionada
  workName: string; // Nombre (autocompletado)
  date: string; // Fecha del movimiento
  type: 'entrada' | 'salida'; // Tipo de movimiento
  reason: string; // Motivo del movimiento
  notes: string; // Notas adicionales
  // Detalles de la obra (autocompletados)
  workDetails: {
    author: string;
    title: string;
    technique: string;
    dimensions: string;
    collection: string;
  };
  conservationState: string; // Estado de conservación
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

// Componente de vista para el historial de movimientos
const MovementHistoryView: React.FC<MovementHistoryViewProps> = ({ user, records, works, onUpdateRecords }) => {
  // Estados locales para controlar la interfaz de usuario
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario
  const [showFilters, setShowFilters] = useState(false); // Controla la visibilidad de filtros
  const [viewingRecord, setViewingRecord] = useState<MovementRecord | null>(null); // Registro en vista detallada
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null); // Registro en edición
  
  // Estados para filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda general
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all'); // Filtro por tipo
  const [dateFilter, setDateFilter] = useState(''); // Filtro por fecha

  // NUEVOS ESTADOS PARA EL BUSCADOR DE OBRAS
  // Estados para el buscador de obras en el formulario
  const [workSearchTerm, setWorkSearchTerm] = useState(''); // Término de búsqueda para obras
  const [showWorkDropdown, setShowWorkDropdown] = useState(false); // Controla la visibilidad del dropdown
  const [selectedWorkForSearch, setSelectedWorkForSearch] = useState<Work | null>(null); // Obra seleccionada desde el buscador

  // Estado para los datos del formulario con valores iniciales
  const [formData, setFormData] = useState<MovementFormData>({
    workId: '',
    workName: '',
    date: '',
    type: 'entrada',
    reason: '',
    notes: '',
    workDetails: {
      author: '',
      title: '',
      technique: '',
      dimensions: '',
      collection: ''
    },
    conservationState: '',
    receiver: {
      name: '',
      idCard: '',
      phone: ''
    },
    deliverer: {
      name: '',
      idCard: '',
      phone: ''
    }
  });

  // NUEVA FUNCIÓN: Filtra las obras para el buscador basado en el término de búsqueda
  // Busca coincidencias en nombre, artista, número de inventario y técnica
  const searchFilteredWorks = (works || []).filter(work => {
    if (!workSearchTerm) return true; // Si no hay término de búsqueda, muestra todas las obras
    const searchLower = workSearchTerm.toLowerCase();
    return (
      work.name.toLowerCase().includes(searchLower) ||
      work.artist.toLowerCase().includes(searchLower) ||
      work.inventoryNumber.toLowerCase().includes(searchLower) ||
      work.technique.toLowerCase().includes(searchLower)
    );
  });

  // Filtra los registros según los criterios de búsqueda y filtros
  const filteredRecords = (records || []).filter(record => {
    const matchesSearch = record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.workDetails.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.deliverer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Implementación del hook de paginación personalizado para registros de movimientos
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

  // NUEVA FUNCIÓN: Maneja la selección de una obra y autocompleta los campos relacionados
  const handleWorkSelection = (workId: string) => {
    const selectedWork = works.find(work => work.inventoryNumber === workId);
    
    if (selectedWork) {
      // Autocompleta los campos con la información de la obra seleccionada
      setFormData(prev => ({
        ...prev,
        workId: workId,
        workName: selectedWork.name,
        workDetails: {
          author: selectedWork.artist,
          title: selectedWork.name,
          technique: selectedWork.technique || 'No especificado',
          // Construye las dimensiones combinando las medidas disponibles
          dimensions: [
            selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm alto`,
            selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm ancho`,
            selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm prof.`,
            selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm diám.`
          ].filter(Boolean).join(' × ') || 'No especificado',
          collection: selectedWork.collection.acquisitionSource || 'Colección general'
        }
      }));
      
      // Actualiza el estado del buscador con la obra seleccionada
      setSelectedWorkForSearch(selectedWork);
      setWorkSearchTerm(`${selectedWork.name} - ${selectedWork.artist}`);
      setShowWorkDropdown(false);
    } else {
      // Limpia los campos autocompletados si no se encuentra la obra
      setFormData(prev => ({
        ...prev,
        workId: '',
        workName: '',
        workDetails: {
          author: '',
          title: '',
          technique: '',
          dimensions: '',
          collection: ''
        }
      }));
      
      // Limpia el estado del buscador
      setSelectedWorkForSearch(null);
      setWorkSearchTerm('');
    }
  };

  // NUEVA FUNCIÓN: Maneja la selección de una obra desde el buscador
  // Esta función se ejecuta cuando el usuario hace clic en una obra del dropdown
  const handleWorkSearchSelection = (work: Work) => {
    handleWorkSelection(work.inventoryNumber);
  };

  // NUEVA FUNCIÓN: Maneja el cambio en el campo de búsqueda de obras
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

  // NUEVA FUNCIÓN: Limpia la selección de obra desde el buscador
  // Resetea todos los campos relacionados con la obra seleccionada
  const clearWorkSelection = () => {
    setWorkSearchTerm('');
    setSelectedWorkForSearch(null);
    setShowWorkDropdown(false);
    handleWorkSelection(''); // Limpia el formulario
  };

  // Maneja el envío del formulario para crear o editar un registro
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }

    if (editingRecord) {
      // Modo edición: actualiza el registro existente
      const updatedRecords = records.map(record =>
        record.id === editingRecord.id
          ? { ...formData, id: editingRecord.id } as MovementRecord
          : record
      );
      onUpdateRecords(updatedRecords);
      setEditingRecord(null);
    } else {
      // Modo creación: crea un nuevo registro
      const newRecord: MovementRecord = {
        ...formData,
        id: Date.now().toString()
      };
      onUpdateRecords([...records, newRecord]);
    }

    // Reinicia el formulario y lo oculta
    resetForm();
    setShowForm(false);
  };

  // FUNCIÓN ACTUALIZADA: Reinicia todos los campos del formulario a sus valores por defecto
  const resetForm = () => {
    setFormData({
      workId: '',
      workName: '',
      date: '',
      type: 'entrada',
      reason: '',
      notes: '',
      workDetails: {
        author: '',
        title: '',
        technique: '',
        dimensions: '',
        collection: ''
      },
      conservationState: '',
      receiver: {
        name: '',
        idCard: '',
        phone: ''
      },
      deliverer: {
        name: '',
        idCard: '',
        phone: ''
      }
    });
    
    // NUEVO: Reinicia también los estados del buscador de obras
    setWorkSearchTerm('');
    setSelectedWorkForSearch(null);
    setShowWorkDropdown(false);
  };

  // FUNCIÓN ACTUALIZADA: Prepara el formulario para editar un registro existente
  const handleEdit = (record: MovementRecord) => {
    setFormData({
      workId: record.workId,
      workName: record.workName,
      date: record.date,
      type: record.type,
      reason: record.reason,
      notes: record.notes || '',
      workDetails: record.workDetails,
      conservationState: record.conservationState,
      receiver: record.receiver,
      deliverer: record.deliverer
    });
    
    // NUEVO: Configura el buscador con la obra del registro en edición
    const workInEdit = works.find(work => work.inventoryNumber === record.workId);
    if (workInEdit) {
      setSelectedWorkForSearch(workInEdit);
      setWorkSearchTerm(`${workInEdit.name} - ${workInEdit.artist}`);
    }
    
    setEditingRecord(record);
    setShowForm(true);
  };

  // Maneja la eliminación de un registro con confirmación
  const handleDelete = (recordId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro de movimiento?')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateRecords(updatedRecords);
    }
  };

  // Limpia todos los filtros aplicados
  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  // Genera y descarga un PDF del registro seleccionado
  const generatePDF = async (record: MovementRecord) => {
    await PDFUtils.generateMovementPDF(record);
  };

  // Renderizado de la vista de historial de movimientos
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Historial de Movimientos
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Gestione las entradas y salidas de obras del museo</p>
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
            title="Registrar nuevo movimiento"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Nuevo Movimiento</span>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por tipo de movimiento */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Tipo de Movimiento</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
              >
                <option value="all">Todos los tipos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
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
            {editingRecord ? 'Modificar Registro de Movimiento' : 'Nuevo Registro de Movimiento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Sección: Información General */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4 flex items-center">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Información General
              </h3>
              
              {/* NUEVO COMPONENTE: Buscador de obras con autocompletado */}
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
                      placeholder="Buscar por nombre, artista, código o técnica..."
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
              
              {/* Selector tradicional de obras (mantiene funcionalidad existente) */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3">
                  Seleccionar Obra *
                </label>
                <select
                  value={formData.workId}
                  onChange={(e) => handleWorkSelection(e.target.value)}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                  required
                >
                  <option value="">Seleccionar obra...</option>
                  {works.map(work => (
                    <option key={work.inventoryNumber} value={work.inventoryNumber}>
                      {work.name} - {work.artist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Campo fecha */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Fecha del Movimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                    required
                  />
                </div>

                {/* Selector tipo de movimiento */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Tipo de Movimiento *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'salida' }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
              </div>

              {/* Campo motivo */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3">
                  Motivo del Movimiento *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                  placeholder="Ej: Exposición temporal, restauración, préstamo..."
                  required
                />
              </div>

              {/* Campo notas */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] resize-none text-sm sm:text-base"
                  placeholder="Observaciones adicionales sobre el movimiento..."
                />
              </div>
            </div>

            {/* Sección: Información Autocompletada de la Obra (mostrada condicionalmente) */}
            {formData.workId && (
              <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Detalles de la Obra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Campos autocompletados (solo lectura) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Autor</label>
                    <input
                      type="text"
                      value={formData.workDetails.author}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Título</label>
                    <input
                      type="text"
                      value={formData.workDetails.title}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Técnica</label>
                    <input
                      type="text"
                      value={formData.workDetails.technique}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Dimensiones</label>
                    <input
                      type="text"
                      value={formData.workDetails.dimensions}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Colección</label>
                    <input
                      type="text"
                      value={formData.workDetails.collection}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71] text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Estado de Conservación */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Estado de Conservación</h3>
              <textarea
                value={formData.conservationState}
                onChange={(e) => setFormData(prev => ({ ...prev, conservationState: e.target.value }))}
                rows={3}
                className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] resize-none text-sm sm:text-base"
                placeholder="Describa el estado actual de conservación de la obra..."
                required
              />
            </div>

            {/* Sección: Información de Personas */}
            <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Información de Personas
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Información de quien recibe */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#192d71] mb-3 sm:mb-4">Quien Recibe la Obra</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Nombre Completo *</label>
                      <input
                        type="text"
                        value={formData.receiver.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          receiver: { ...prev.receiver, name: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Cédula de Identidad *</label>
                      <input
                        type="text"
                        value={formData.receiver.idCard}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          receiver: { ...prev.receiver, idCard: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        placeholder="Ej: V-12.345.678"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 flex items-center">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.receiver.phone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          receiver: { ...prev.receiver, phone: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        placeholder="Ej: +58 212-555-0123"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Información de quien entrega */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#192d71] mb-3 sm:mb-4">Quien Entrega la Obra</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Nombre Completo *</label>
                      <input
                        type="text"
                        value={formData.deliverer.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deliverer: { ...prev.deliverer, name: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2">Cédula de Identidad *</label>
                      <input
                        type="text"
                        value={formData.deliverer.idCard}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deliverer: { ...prev.deliverer, idCard: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        placeholder="Ej: V-87.654.321"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 flex items-center">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.deliverer.phone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deliverer: { ...prev.deliverer, phone: e.target.value }
                        }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                        placeholder="Ej: +58 212-555-0456"
                        required
                      />
                    </div>
                  </div>
                </div>
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
                <h2 className="text-xl sm:text-2xl font-bold text-[#192d71]">Detalles del Movimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="text-[#192d71] hover:text-[#1e3a8a] text-xl sm:text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Información general */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información General</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                    <div><strong className="text-[#192d71]">Obra:</strong> <span className="ml-1">{viewingRecord.workName}</span></div>
                    <div><strong className="text-[#192d71]">Fecha:</strong> <span className="ml-1">{new Date(viewingRecord.date).toLocaleDateString('es-ES')}</span></div>
                    <div><strong className="text-[#192d71]">Tipo:</strong> <span className="ml-1 capitalize">{viewingRecord.type}</span></div>
                    <div><strong className="text-[#192d71]">Motivo:</strong> <span className="ml-1">{viewingRecord.reason}</span></div>
                  </div>
                  {viewingRecord.notes && (
                    <div className="mt-3">
                      <strong className="text-[#192d71]">Notas:</strong>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-[#192d71]/20 text-sm sm:text-base">
                        {viewingRecord.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Detalles de la obra */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Detalles de la Obra</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                    <div><strong className="text-[#192d71]">Autor:</strong> <span className="ml-1">{viewingRecord.workDetails.author}</span></div>
                    <div><strong className="text-[#192d71]">Título:</strong> <span className="ml-1">{viewingRecord.workDetails.title}</span></div>
                    <div><strong className="text-[#192d71]">Técnica:</strong> <span className="ml-1">{viewingRecord.workDetails.technique}</span></div>
                    <div><strong className="text-[#192d71]">Dimensiones:</strong> <span className="ml-1">{viewingRecord.workDetails.dimensions}</span></div>
                    <div className="sm:col-span-2"><strong className="text-[#192d71]">Colección:</strong> <span className="ml-1">{viewingRecord.workDetails.collection}</span></div>
                  </div>
                </div>

                {/* Estado de conservación */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Estado de Conservación</h3>
                  <div className="p-3 sm:p-4 bg-white rounded-lg border border-[#192d71]/20 whitespace-pre-wrap text-sm sm:text-base">
                    {viewingRecord.conservationState}
                  </div>
                </div>

                {/* Información de personas */}
                <div className="bg-[#192d71]/5 rounded-xl p-4 sm:p-6 border border-[#192d71]/20">
                  <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información de Personas</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-bold text-[#192d71] mb-2">Quien Recibe:</h4>
                      <div className="space-y-1 text-sm sm:text-base">
                        <div><strong>Nombre:</strong> {viewingRecord.receiver.name}</div>
                        <div><strong>C.I.:</strong> {viewingRecord.receiver.idCard}</div>
                        <div><strong>Teléfono:</strong> {viewingRecord.receiver.phone}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#192d71] mb-2">Quien Entrega:</h4>
                      <div className="space-y-1 text-sm sm:text-base">
                        <div><strong>Nombre:</strong> {viewingRecord.deliverer.name}</div>
                        <div><strong>C.I.:</strong> {viewingRecord.deliverer.idCard}</div>
                        <div><strong>Teléfono:</strong> {viewingRecord.deliverer.phone}</div>
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
              placeholder="Buscar por obra, autor, persona o motivo..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        {/* Tabla responsive de registros de movimientos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Motivo</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Personas</th>
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
                      <p className="text-xs sm:text-sm text-[#192d71]/70 font-medium">{record.workDetails.author}</p>
                      <p className="text-xs text-[#192d71]/60 mt-1">{record.workDetails.technique}</p>
                      {/* Información adicional visible solo en móviles */}
                      <div className="sm:hidden mt-2 space-y-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          record.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                        </span>
                        <p className="text-xs text-[#192d71]/60">
                          {new Date(record.date).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-[#192d71]/60 truncate">
                          {record.reason}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 font-medium hidden md:table-cell">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71] hidden lg:table-cell">
                    <p className="truncate max-w-xs">{record.reason}</p>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 text-sm hidden lg:table-cell">
                    <div>
                      <p><strong>Recibe:</strong> {record.receiver.name}</p>
                      <p><strong>Entrega:</strong> {record.deliverer.name}</p>
                    </div>
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
        {filteredRecords.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {searchTerm || typeFilter !== 'all' || dateFilter 
              ? 'No se encontraron registros que coincidan con los filtros' 
              : 'No hay registros de movimientos'}
          </div>
        )}

        {/* Componente de paginación responsive para registros de movimientos */}
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

export default MovementHistoryView;