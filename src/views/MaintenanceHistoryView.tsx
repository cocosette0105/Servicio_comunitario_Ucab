// VISTA DE HISTORIAL DE MANTENIMIENTO
// Vista de presentación para la gestión de registros de mantenimiento y conservación
// Permite crear, consultar, editar y generar reportes de intervenciones realizadas

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, FileDown,
  Palette, Hammer, Calendar, DollarSign, FileText, Wrench
} from 'lucide-react';
import { MaintenanceRecord, Work } from '../models';
import { PDFUtils } from '../utils/pdfUtils';

// Define las propiedades que recibe la vista de historial de mantenimiento
interface MaintenanceHistoryViewProps {
  records: MaintenanceRecord[]; // Lista de registros de mantenimiento
  works: Work[]; // Lista de obras disponibles
  onUpdateRecords: (records: MaintenanceRecord[]) => void; // Función para actualizar registros
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
const MaintenanceHistoryView: React.FC<MaintenanceHistoryViewProps> = ({ records, works, onUpdateRecords }) => {
  // Estados locales para controlar la interfaz de usuario
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario
  const [showFilters, setShowFilters] = useState(false); // Controla la visibilidad de filtros
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null); // Registro en vista detallada
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null); // Registro en edición
  
  // Estados para filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda general
  const [workTypeFilter, setWorkTypeFilter] = useState<'all' | MaintenanceRecord['workType']>('all'); // Filtro por tipo
  const [categoryFilter, setCategoryFilter] = useState<'all' | MaintenanceRecord['maintenanceCategory']>('all'); // Filtro por categoría
  const [dateFilter, setDateFilter] = useState(''); // Filtro por fecha

  // Estado para los datos del formulario con valores iniciales
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

  // Filtra los registros según los criterios de búsqueda y filtros
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.interventionDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWorkType = workTypeFilter === 'all' || record.workType === workTypeFilter;
    const matchesCategory = categoryFilter === 'all' || record.maintenanceCategory === categoryFilter;
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    
    return matchesSearch && matchesWorkType && matchesCategory && matchesDate;
  });

  // Maneja la selección de una obra y autocompleta los campos relacionados
  const handleWorkSelection = (workId: string) => {
    const selectedWork = works.find(work => work.inventoryNumber === workId);
    
    if (selectedWork) {
      // Autocompleta los campos con la información de la obra seleccionada
      setFormData(prev => ({
        ...prev,
        workId: workId,
        author: selectedWork.artist,
        workName: selectedWork.name,
        // Construye las dimensiones combinando las medidas disponibles
        dimensions: [
          selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm alto`,
          selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm ancho`,
          selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm prof.`,
          selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm diám.`
        ].filter(Boolean).join(' × ') || 'No especificado',
        technique: selectedWork.technique || 'No especificado',
        year: selectedWork.realizationDate || 'No especificado'
      }));
    } else {
      // Limpia los campos autocompletados si no se encuentra la obra
      setFormData(prev => ({
        ...prev,
        workId: '',
        author: '',
        workName: '',
        dimensions: '',
        technique: '',
        year: ''
      }));
    }
  };

  // Maneja el envío del formulario para crear o editar un registro
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del mantenimiento no puede ser posterior a la fecha actual');
      return;
    }

    if (editingRecord) {
      // Modo edición: actualiza el registro existente
      const updatedRecords = records.map(record =>
        record.id === editingRecord.id
          ? { ...formData, id: editingRecord.id } as MaintenanceRecord
          : record
      );
      onUpdateRecords(updatedRecords);
      setEditingRecord(null);
    } else {
      // Modo creación: crea un nuevo registro
      const newRecord: MaintenanceRecord = {
        ...formData,
        id: Date.now().toString()
      };
      onUpdateRecords([...records, newRecord]);
    }

    // Reinicia el formulario y lo oculta
    resetForm();
    setShowForm(false);
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
    setEditingRecord(record);
    setShowForm(true);
  };

  // Maneja la eliminación de un registro con confirmación
  const handleDelete = (recordId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro de mantenimiento?')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateRecords(updatedRecords);
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
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Historial de Mantenimiento
          </h1>
          <p className="text-[#192d71] text-lg">Gestione el mantenimiento y conservación de las obras</p>
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
            title="Consultar historial con filtros"
          >
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Botón para agregar nuevo registro */}
          <button
            onClick={() => {
              resetForm();
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            title="Agregar nuevo historial"
          >
            <Plus className="h-6 w-6" />
            <span>Nuevo Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros (mostrado condicionalmente) */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#192d71]">Filtros de Consulta</h2>
            <button
              onClick={clearFilters}
              className="text-[#192d71] hover:text-[#1e3a8a] text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por tipo de obra */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Tipo de Obra</label>
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              >
                <option value="all">Todos los tipos</option>
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Filtro por categoría de mantenimiento */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              >
                <option value="all">Todas las categorías</option>
                <option value="Conservación preventiva">Conservación preventiva</option>
                <option value="Conservación curativa">Conservación curativa</option>
              </select>
            </div>

            {/* Filtro por fecha */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Fecha</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulario para crear/editar registro (mostrado condicionalmente) */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-8">
          <h2 className="text-2xl font-bold text-[#192d71] mb-6">
            {editingRecord ? 'Modificar Registro de Mantenimiento' : 'Nuevo Registro de Mantenimiento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección: Tipo de Obra */}
            <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
              <h3 className="text-lg font-bold text-[#192d71] mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2" />
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
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71]"
                required
              >
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sección: Selección de Pieza */}
            <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
              <h3 className="text-lg font-bold text-[#192d71] mb-4 flex items-center">
                <Hammer className="h-5 w-5 mr-2" />
                Selección de Pieza
              </h3>
              <select
                value={formData.workId}
                onChange={(e) => handleWorkSelection(e.target.value)}
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71]"
                required
              >
                <option value="">Seleccionar obra...</option>
                {filteredWorks.map(work => (
                 <option key={work.inventoryNumber} value={work.inventoryNumber}>
                    {work.name} - {work.artist}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección: Información Autocompletada de la Obra (mostrada condicionalmente) */}
            {formData.workId && (
              <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
                <h3 className="text-lg font-bold text-[#192d71] mb-4">Información de la Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campos autocompletados (solo lectura) */}
                  <div>
                    <label className="block text-sm font-bold text-[#192d71] mb-2">Autor</label>
                    <input
                      type="text"
                      value={formData.author}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#192d71] mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.workName}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#192d71] mb-2">Medidas</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#192d71] mb-2">Técnica</label>
                    <input
                      type="text"
                      value={formData.technique}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#192d71] mb-2">Año</label>
                    <input
                      type="text"
                      value={formData.year}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl bg-gray-100 text-[#192d71]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Información del Mantenimiento */}
            <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
              <h3 className="text-lg font-bold text-[#192d71] mb-4 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Información del Mantenimiento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campo precio actual */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Precio Actual (Bs.) *
                  </label>
                  <input
                    type="text"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71]"
                    placeholder="Ej: Bs. 50.000,00"
                    required
                  />
                </div>

                {/* Selector categoría de mantenimiento */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Categoría de Mantenimiento *</label>
                  <select
                    value={formData.maintenanceCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceCategory: e.target.value as MaintenanceRecord['maintenanceCategory'] }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71]"
                    required
                  >
                    <option value="Conservación preventiva">Conservación preventiva</option>
                    <option value="Conservación curativa">Conservación curativa</option>
                  </select>
                </div>

                {/* Campo fecha */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Fecha del Mantenimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71]"
                    required
                  />
                </div>
              </div>

              {/* Campo descripción de la intervención */}
              <div className="mt-6">
                <label className="block text-sm font-bold text-[#192d71] mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Descripción de la Intervención *
                </label>
                <textarea
                  value={formData.interventionDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, interventionDescription: e.target.value }))}
                  rows={6}
                  className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] resize-none"
                  placeholder="Describa detalladamente la intervención realizada, materiales utilizados, técnicas aplicadas, resultados obtenidos..."
                  required
                />
              </div>
            </div>

            {/* Botones de acción del formulario */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="px-6 py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#192d71]">Detalles del Mantenimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="text-[#192d71] hover:text-[#1e3a8a] text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Información de la obra */}
                <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
                  <h3 className="text-lg font-bold text-[#192d71] mb-4">Información de la Obra</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong className="text-[#192d71]">Tipo:</strong> {viewingRecord.workType}</div>
                    <div><strong className="text-[#192d71]">Nombre:</strong> {viewingRecord.workName}</div>
                    <div><strong className="text-[#192d71]">Autor:</strong> {viewingRecord.author}</div>
                    <div><strong className="text-[#192d71]">Técnica:</strong> {viewingRecord.technique}</div>
                    <div><strong className="text-[#192d71]">Medidas:</strong> {viewingRecord.dimensions}</div>
                    <div><strong className="text-[#192d71]">Año:</strong> {viewingRecord.year}</div>
                  </div>
                </div>

                {/* Información del mantenimiento */}
                <div className="bg-[#192d71]/5 rounded-xl p-6 border border-[#192d71]/20">
                  <h3 className="text-lg font-bold text-[#192d71] mb-4">Detalles del Mantenimiento</h3>
                  <div className="space-y-3">
                    <div><strong className="text-[#192d71]">Fecha:</strong> {new Date(viewingRecord.date).toLocaleDateString('es-ES')}</div>
                    <div><strong className="text-[#192d71]">Precio Actual:</strong> {viewingRecord.currentPrice}</div>
                    <div><strong className="text-[#192d71]">Categoría:</strong> {viewingRecord.maintenanceCategory}</div>
                    <div>
                      <strong className="text-[#192d71]">Descripción de la Intervención:</strong>
                      <div className="mt-2 p-4 bg-white rounded-lg border border-[#192d71]/20 whitespace-pre-wrap">
                        {viewingRecord.interventionDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setViewingRecord(null);
                    handleEdit(viewingRecord);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 font-semibold"
                >
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => generatePDF(viewingRecord)}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#192d71] hover:bg-[#1e3a8a] text-white rounded-xl transition-all duration-200 font-semibold"
                >
                  <FileDown className="h-5 w-5" />
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
        <div className="p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra, autor o descripción..."
              className="w-full pl-14 pr-6 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-lg"
            />
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Tipo</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Categoría</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Precio</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea cada registro filtrado */}
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{record.workName}</p>
                      <p className="text-sm text-[#192d71]/70 font-medium">{record.author}</p>
                      <p className="text-xs text-[#192d71]/60 mt-1">{record.technique}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-[#192d71]/10 text-[#192d71] rounded-full text-sm font-semibold">
                      {record.workType}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.maintenanceCategory === 'Conservación preventiva' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.maintenanceCategory}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-8 py-6 text-[#192d71] font-semibold">
                    {record.currentPrice}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón consultar */}
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Consultar detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Modificar registro"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      {/* Botón descargar PDF */}
                      <button
                        onClick={() => generatePDF(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Descargar PDF"
                      >
                        <FileDown className="h-5 w-5" />
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
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            {searchTerm || workTypeFilter !== 'all' || categoryFilter !== 'all' || dateFilter 
              ? 'No se encontraron registros que coincidan con los filtros' 
              : 'No hay registros de mantenimiento'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceHistoryView;