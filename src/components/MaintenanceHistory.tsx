import React, { useState } from 'react';
// Importa íconos específicos para las funcionalidades del módulo de mantenimiento
import { 
  Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, FileDown,
  Palette, Hammer, Calendar, DollarSign, FileText, Wrench
} from 'lucide-react';
// Importa tipos necesarios para el manejo de datos
import { MaintenanceRecord, Work } from '../types';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Define las propiedades que recibe el componente MaintenanceHistory
interface MaintenanceHistoryProps {
  records: MaintenanceRecord[]; // Lista de registros de mantenimiento existentes
  works: Work[]; // Lista de obras disponibles para seleccionar
  onUpdateRecords: (records: MaintenanceRecord[]) => void; // Función para actualizar los registros
}

// Define la estructura de datos para el formulario de mantenimiento
interface MaintenanceFormData {
  workType: MaintenanceRecord['workType']; // Tipo de obra seleccionado
  workId: string; // ID de la obra seleccionada
  author: string; // Autor de la obra (autocompletado)
  workName: string; // Nombre de la obra (autocompletado)
  dimensions: string; // Medidas de la obra (autocompletado)
  technique: string; // Técnica de la obra (autocompletado)
  year: string; // Año de la obra (autocompletado)
  currentPrice: string; // Precio actual de la obra
  maintenanceCategory: MaintenanceRecord['maintenanceCategory']; // Tipo de conservación
  interventionDescription: string; // Descripción de la intervención
  date: string; // Fecha del mantenimiento
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ records, works, onUpdateRecords }) => {
  // Estados para controlar la visibilidad de diferentes secciones de la interfaz
  const [showForm, setShowForm] = useState(false); // Controla si se muestra el formulario
  const [showFilters, setShowFilters] = useState(false); // Controla si se muestran los filtros
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null); // Registro que se está consultando
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null); // Registro que se está editando
  
  // Estados para filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda general
  const [workTypeFilter, setWorkTypeFilter] = useState<'all' | MaintenanceRecord['workType']>('all'); // Filtro por tipo de obra
  const [categoryFilter, setCategoryFilter] = useState<'all' | MaintenanceRecord['maintenanceCategory']>('all'); // Filtro por categoría
  const [dateFilter, setDateFilter] = useState(''); // Filtro por fecha

  // Estado para los datos del formulario, inicializado con valores por defecto
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
  // Esto permite mostrar solo las obras relevantes en el selector de pieza
  const filteredWorks = works.filter(work => {
    // Si el tipo es "Otros", muestra todas las obras que no coincidan con los tipos específicos
    if (formData.workType === 'Otros') {
      return !['Pintura', 'Escultura', 'Instalación', 'Cerámica', 'Fotografía', 'Artes gráficas'].includes(work.classification);
    }
    // Para otros tipos, filtra por clasificación exacta
    return work.classification.toLowerCase().includes(formData.workType.toLowerCase());
  });

  // Filtra los registros de mantenimiento según los criterios de búsqueda y filtros
  const filteredRecords = records.filter(record => {
    // Verifica si coincide con el término de búsqueda (nombre, autor o descripción)
    const matchesSearch = record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.interventionDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Verifica si coincide con el filtro de tipo de obra
    const matchesWorkType = workTypeFilter === 'all' || record.workType === workTypeFilter;
    // Verifica si coincide con el filtro de categoría de mantenimiento
    const matchesCategory = categoryFilter === 'all' || record.maintenanceCategory === categoryFilter;
    // Verifica si coincide con el filtro de fecha
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    
    return matchesSearch && matchesWorkType && matchesCategory && matchesDate;
  });

  /**
   * Maneja la selección de una obra en el formulario
   * Cuando se selecciona una obra, autocompleta los campos relacionados
   * @param workId - ID de la obra seleccionada
   */
  const handleWorkSelection = (workId: string) => {
    // Busca la obra seleccionada en la lista de obras disponibles
    const selectedWork = works.find(work => work.inventoryNumber === workId);

    
    if (selectedWork) {
      // Si se encuentra la obra, autocompleta los campos del formulario
      setFormData(prev => ({
        ...prev,
        workId: workId,
        author: selectedWork.artist, // Autocompleta el autor
        workName: selectedWork.name, // Autocompleta el nombre
        // Construye las dimensiones combinando alto, ancho, profundidad y diámetro
        dimensions: [
          selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm alto`,
          selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm ancho`,
          selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm prof.`,
          selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm diám.`
        ].filter(Boolean).join(' × ') || 'No especificado',
        technique: selectedWork.technique || 'No especificado', // Autocompleta la técnica
        year: selectedWork.realizationDate || 'No especificado' // Autocompleta el año
      }));
    } else {
      // Si no se encuentra la obra, limpia los campos autocompletados
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

  /**
   * Maneja el envío del formulario para crear o editar un registro
   * @param e - Evento del formulario
   */
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
      setEditingRecord(null); // Sale del modo edición
    } else {
      // Modo creación: crea un nuevo registro
      const newRecord: MaintenanceRecord = {
        ...formData,
        id: Date.now().toString() // Genera un ID único
      };
      onUpdateRecords([...records, newRecord]);
    }

    // Reinicia el formulario y lo oculta
    resetForm();
    setShowForm(false);
  };

  /**
   * Reinicia todos los campos del formulario a sus valores por defecto
   */
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

  /**
   * Prepara el formulario para editar un registro existente
   * @param record - Registro a editar
   */
  const handleEdit = (record: MaintenanceRecord) => {
    // Carga los datos del registro en el formulario
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
    setEditingRecord(record); // Marca el registro como en edición
    setShowForm(true); // Muestra el formulario
  };

  /**
   * Elimina un registro después de confirmación del usuario
   * @param recordId - ID del registro a eliminar
   */
  const handleDelete = (recordId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro de mantenimiento?')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateRecords(updatedRecords);
    }
  };

  /**
   * Limpia todos los filtros de búsqueda
   */
  const clearFilters = () => {
    setWorkTypeFilter('all');
    setCategoryFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  // Generar y descargar un reporte PDF real ya listo con formato
   const generatePDF = async (record: MaintenanceRecord) => {

  // Funciones para marcar con X
  // CÓDIGO CORREGIDO
const checkType = (type: MaintenanceRecord['workType']) =>
  record.workType?.toLowerCase() === type.toLowerCase() ? "X" : " ";
const checkConservation = (type: MaintenanceRecord['maintenanceCategory']) =>
  record.maintenanceCategory?.toLowerCase() === type.toLowerCase()
    ? "X"
    : " ";

  // HTML temporal con el formato
  const tempContainer = document.createElement("div");
  tempContainer.style.width = "800px";
  tempContainer.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.4; color: #000;">
      
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
       <img src="/logoblanco_negro.jpg" alt="Logo Museo" style="width: 80px; height: auto; margin-right: 15px;">
        <div style="flex: 1; text-align: center;">
          
        </div>
      </div>

      <div style="text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">
        TALLER DE CONSERVACIÓN Y RESTAURACIÓN
      </div>

      <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
        INFORME
      </div>

      <div style="border: 1px solid #000; padding: 4px; font-size: 11px;">
        Pintura (${checkType("Pintura")})  
        Escultura (${checkType("Escultura")})  
        Instalación (${checkType("Instalación")})  
        Cerámica (${checkType("Cerámica")})  
        Fotografía (${checkType("Fotografía")})  
        Artes Gráficas (${checkType("Artes gráficas")})  
        Otros (${checkType("Otros")})<br>
        N° de la obra: _______  Precio de la obra en Bs.: ${record.currentPrice}
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px;">
        <tr>
          <td style="border: 1px solid #000; padding: 4px;"><b>Autor:</b> ${record.author}</td>
          <td style="border: 1px solid #000; padding: 4px;"><b>Título:</b> ${record.workName}</td>
          <td style="border: 1px solid #000; padding: 4px;"><b>Medidas:</b> ${record.dimensions}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 4px;"><b>Técnica:</b> ${record.technique}</td>
          <td style="border: 1px solid #000; padding: 4px;"><b>Año:</b> ${record.year}</td>
          <td style="border: 1px solid #000; padding: 4px;"><b>Precio Actual:</b> ${record.currentPrice}</td>
        </tr>
      </table>

      <div style="border: 1px solid #000; padding: 4px; margin-top: 5px; min-height: 60px;">
        Conservación preventiva (${checkConservation("Conservación preventiva")})   
        Conservación curativa (${checkConservation("Conservación curativa")})
      </div>

      <div style="border: 1px solid #000; padding: 4px; margin-top: 5px; min-height: 80px;">
        <b>Intervención de la obra:</b><br>
        ${record.interventionDescription}
      </div>

      <div style="margin-top: 40px; font-size: 11px;">
        Lcdo. Ramón Caracas<br>
        Lcdo. Juan Carlos Martínez<br>
        Conservador y restaurador<br>
        Director del MUCAF
      </div>

      <div style="margin-top: 20px; font-size: 9px; border-top: 1px solid #000; padding-top: 5px; text-align: center;">
        Calle de servicio del Complejo Cultural Andrés Bello, 2da Av. Entre calles 13 y 14, San Felipe, Estado Yaracuy. 
        0254 - 232.57.91 / 0412 - 519.85.45<br>
        www.museocarmelofernandez.weebly.com / museocarmelofernandez@gmail.com
      </div>
    </div>
  `;

  document.body.appendChild(tempContainer);

  // Convertir a imagen
  const canvas = await html2canvas(tempContainer, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  // Crear PDF real
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`mantenimiento_${record.workName}_${record.date}.pdf`);

  // Limpiar el HTML temporal
  document.body.removeChild(tempContainer);
};

  // Renderizado principal del componente
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado principal con título y botones de acción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Historial de Mantenimiento
          </h1>
          <p className="text-[#192d71] text-lg">Gestione el mantenimiento y conservación de las obras</p>
        </div>
        
        {/* Botones de acción principales */}
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

      {/* Panel de filtros (se muestra condicionalmente) */}
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
          
          {/* Grid de filtros */}
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

      {/* Formulario para crear/editar registro (se muestra condicionalmente) */}
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

            {/* Sección: Información Autocompletada de la Obra */}
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
                {/* Campo para precio actual */}
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

                {/* Selector de categoría de mantenimiento */}
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

                {/* Campo de fecha */}
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

              {/* Campo de descripción de la intervención */}
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

      {/* Modal de consulta detallada */}
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

              {/* Información detallada del registro */}
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

export default MaintenanceHistory;