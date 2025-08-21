// VISTA DE HISTORIAL DE MOVIMIENTOS hola probando
// Vista de presentación para la gestión de movimientos de obras (entradas y salidas)
// Permite registrar, consultar, editar y generar reportes de movimientos

import React, { useState } from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown, Download, Edit, Eye, Trash2 } from 'lucide-react';
import { MovementRecord, Work } from '../models';
import { PDFUtils } from '../utils/pdfUtils';

// Define las propiedades que recibe la vista de historial de movimientos
interface MovementHistoryViewProps {
  records: MovementRecord[]; // Lista de registros de movimientos
  works: Work[]; // Lista de obras disponibles
  onUpdateRecords: (records: MovementRecord[]) => void; // Función para actualizar registros
}

// Define la estructura de datos para el formulario de movimiento
interface MovementFormData {
  workId: string; // ID de la obra seleccionada
  date: string; // Fecha del movimiento
  type: 'entrada' | 'salida'; // Tipo de movimiento
  reason: string; // Motivo del movimiento
  notes: string; // Notas adicionales
  workDetails: { // Detalles técnicos de la obra
    author: string;
    title: string;
    technique: string;
    dimensions: string;
    collection: string;
  };
  conservationState: string; // Estado de conservación
  receiver: { // Información del receptor
    name: string;
    idCard: string;
    phone: string;
  };
  deliverer: { // Información del entregador
    name: string;
    idCard: string;
    phone: string;
  };
}

// Componente de vista para el historial de movimientos
const MovementHistoryView: React.FC<MovementHistoryViewProps> = ({ records, works, onUpdateRecords }) => {
  // Estados locales para controlar la interfaz de usuario
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null); // Registro en edición
  const [viewingRecord, setViewingRecord] = useState<MovementRecord | null>(null); // Registro en vista detallada
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [showFilters, setShowFilters] = useState(false); // Visibilidad de filtros
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all'); // Filtro por tipo
  const [dateFilter, setDateFilter] = useState(''); // Filtro por fecha
  
  // Estado para los datos del formulario con valores iniciales
  const [formData, setFormData] = useState<MovementFormData>({
    workId: '',
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

  // Filtra los registros según los criterios de búsqueda y filtros
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.workDetails.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.deliverer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Maneja la selección de una obra y autocompleta los campos relacionados
  const handleWorkSelection = (workId: string) => {
    setFormData(prev => ({ ...prev, workId }));

    // Busca la obra seleccionada por su número de inventario
    const selectedWork = works.find(work => work.inventoryNumber === workId);
    if (selectedWork) {
      // Construye las dimensiones combinando las medidas disponibles
      const dimensions = [
        selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm`,
        selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm`,
        selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm`,
        selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm`,
      ].filter(Boolean).join(' x ');

      // Autocompleta los detalles de la obra
      setFormData(prev => ({
        ...prev,
        workDetails: {
          author: selectedWork.artist,
          title: selectedWork.name,
          technique: selectedWork.technique || 'No especificado',
          dimensions: dimensions || 'No especificado',
          collection: selectedWork.collection?.acquisitionMethod || 'Colección General'
        }
      }));
    } else {
      // Limpia los detalles si no se encuentra la obra
      setFormData(prev => ({
        ...prev,
        workDetails: {
          author: '',
          title: '',
          technique: '',
          dimensions: '',
          collection: ''
        }
      }));
    }
  };

  // Maneja el envío del formulario para crear un nuevo registro
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }
    
    const selectedWork = works.find(work => work.inventoryNumber === formData.workId);
    if (!selectedWork) return;

    // Crea el nuevo registro de movimiento
    const newRecord: MovementRecord = {
      id: Date.now().toString(),
      workId: formData.workId,
      workName: selectedWork.name,
      date: formData.date,
      type: formData.type,
      reason: formData.reason,
      notes: formData.notes,
      workDetails: formData.workDetails,
      conservationState: formData.conservationState,
      receiver: formData.receiver,
      deliverer: formData.deliverer
    };

    onUpdateRecords([...records, newRecord]);
    
    // Reinicia el formulario
    resetForm();
    setShowForm(false);
  };

  // Prepara el formulario para editar un registro existente
  const handleEdit = (record: MovementRecord) => {
    setFormData({
      workId: record.workId,
      date: record.date,
      type: record.type,
      reason: record.reason,
      notes: record.notes || '',
      workDetails: record.workDetails,
      conservationState: record.conservationState,
      receiver: record.receiver,
      deliverer: record.deliverer
    });
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

  // Maneja la actualización de un registro existente
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de fecha
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }
    
    const selectedWork = works.find(work => work.inventoryNumber === formData.workId);
    if (!selectedWork) return;

    if (editingRecord) {
      // Actualiza el registro existente
      const updatedRecord: MovementRecord = {
        ...editingRecord,
        workId: formData.workId,
        workName: selectedWork.name,
        date: formData.date,
        type: formData.type,
        reason: formData.reason,
        notes: formData.notes,
        workDetails: formData.workDetails,
        conservationState: formData.conservationState,
        receiver: formData.receiver,
        deliverer: formData.deliverer
      };

      const updatedRecords = records.map(record =>
        record.id === editingRecord.id ? updatedRecord : record
      );
      onUpdateRecords(updatedRecords);
      setEditingRecord(null);
    }
    
    // Reinicia el formulario
    resetForm();
    setShowForm(false);
  };

  // Reinicia todos los campos del formulario a sus valores por defecto
  const resetForm = () => {
    setFormData({
      workId: '',
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
  };

  // Genera y descarga un PDF del registro seleccionado
  const generatePDF = async (record: MovementRecord) => {
    await PDFUtils.generateMovementPDF(record);
  };

  // Limpia todos los filtros aplicados
  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  // Renderizado de la vista de historial de movimientos
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Historial de Movimientos
          </h1>
          <p className="text-[#192d71] text-lg">Registre y consulte el historial de entradas y salidas de obras</p>
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
          {/* Botón para agregar nuevo movimiento */}
          <button
            onClick={() => {
              resetForm();
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Plus className="h-6 w-6" />
            <span>Registrar Movimiento</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por tipo de movimiento */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Tipo de Movimiento</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
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

      {/* Formulario para crear/editar movimiento (mostrado condicionalmente) */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-8">
          <h2 className="text-2xl font-bold text-[#192d71] mb-6">
            {editingRecord ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
          </h2>
          <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-8">
            
            {/* Sección: Información General */}
            <div className="border-b border-[#192d71]/20 pb-6">
              <h3 className="text-lg font-bold text-[#192d71] mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selector de obra */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Obra *</label>
                  <select
                    value={formData.workId}
                    onChange={(e) => handleWorkSelection(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
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
                {/* Campo fecha */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Fecha del Movimiento *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    required
                  />
                </div>
                {/* Selector tipo de movimiento */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Tipo de Movimiento *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'salida' }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                {/* Campo motivo */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Motivo *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Motivo del movimiento"
                    required
                  />
                </div>
              </div>
              {/* Campo notas adicionales */}
              <div className="mt-6">
                <label className="block text-sm font-bold text-[#192d71] mb-3">Notas Adicionales</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Sección: Detalles de la Obra (autocompletados) */}
            <div className="border-b border-[#192d71]/20 pb-6">
              <h3 className="text-lg font-bold text-[#192d71] mb-4">Detalles de la Obra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Autor *</label>
                  <input
                    type="text"
                    value={formData.workDetails.author}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, author: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Nombre del autor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Título *</label>
                  <input
                    type="text"
                    value={formData.workDetails.title}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, title: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Título de la obra"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Técnica *</label>
                  <input
                    type="text"
                    value={formData.workDetails.technique}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, technique: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Ej: Óleo sobre lienzo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Medidas *</label>
                  <input
                    type="text"
                    value={formData.workDetails.dimensions}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, dimensions: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Ej: 80 x 60 cm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Colección *</label>
                  <input
                    type="text"
                    value={formData.workDetails.collection}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, collection: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Ej: Colección Permanente"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Estado de Conservación */}
            <div className="border-b border-[#192d71]/20 pb-6">
              <h3 className="text-lg font-bold text-[#192d71] mb-4">Estado de Conservación</h3>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-3">Descripción del Estado *</label>
                <textarea
                  value={formData.conservationState}
                  onChange={(e) => setFormData(prev => ({ ...prev, conservationState: e.target.value }))}
                  rows={3}
                  className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] resize-none"
                  placeholder="Describa el estado actual de conservación de la obra..."
                  required
                />
              </div>
            </div>

            {/* Sección: Información del Receptor */}
            <div className="border-b border-[#192d71]/20 pb-6">
              <h3 className="text-lg font-bold text-[#192d71] mb-4">Información del Receptor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Nombre *</label>
                  <input
                    type="text"
                    value={formData.receiver.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, name: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={formData.receiver.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, idCard: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="12.345.678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.receiver.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, phone: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="+58 212-555-0123"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Información del Entregador */}
            <div className="pb-6">
              <h3 className="text-lg font-bold text-[#192d71] mb-4">Información del Entregador</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Nombre *</label>
                  <input
                    type="text"
                    value={formData.deliverer.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, name: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={formData.deliverer.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, idCard: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="87.654.321"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-3">Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.deliverer.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, phone: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                    placeholder="+58 212-555-0456"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción del formulario */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-[#192d71]/20">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
                className="px-6 py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                {editingRecord ? 'Actualizar Movimiento' : 'Registrar Movimiento'}
              </button>
            </div>
          </form>
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
              placeholder="Buscar por obra, autor, receptor, entregador o motivo..."
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
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Receptor</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Entregador</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea cada registro filtrado */}
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{record.workDetails.title}</p>
                      <p className="text-sm text-[#192d71]/70 font-medium">Por {record.workDetails.author}</p>
                      <p className="text-xs text-[#192d71]/60 mt-1">{record.workDetails.technique}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {record.type === 'entrada' ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        record.type === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-semibold text-[#192d71]">{record.receiver.name}</p>
                      <p className="text-sm text-[#192d71]/70">CI: {record.receiver.idCard}</p>
                      <p className="text-sm text-[#192d71]/70">{record.receiver.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-semibold text-[#192d71]">{record.deliverer.name}</p>
                      <p className="text-sm text-[#192d71]/70">CI: {record.deliverer.idCard}</p>
                      <p className="text-sm text-[#192d71]/70">{record.deliverer.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón consultar */}
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Editar movimiento"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      {/* Botón descargar PDF */}
                      <button
                        onClick={() => generatePDF(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Descargar PDF"
                      >
                        <Download className="h-5 w-5" />
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
            {searchTerm || typeFilter !== 'all' || dateFilter ? 'No se encontraron movimientos que coincidan con los filtros' : 'No hay movimientos registrados'}
          </div>
        )}
      </div>

      {/* Modal para ver detalles del movimiento (mostrado condicionalmente) */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-[#192d71]">Detalles del Movimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-2 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Información general del movimiento */}
              <div className="bg-gradient-to-br from-[#192d71]/5 to-white rounded-2xl p-6 border border-[#192d71]/20">
                <h3 className="text-xl font-bold text-[#192d71] mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#192d71]">Fecha:</p>
                    <p className="text-[#192d71]">{new Date(viewingRecord.date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#192d71]">Tipo:</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      viewingRecord.type === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingRecord.type === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold text-[#192d71]">Motivo:</p>
                    <p className="text-[#192d71]">{viewingRecord.reason}</p>
                  </div>
                  {viewingRecord.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-bold text-[#192d71]">Notas:</p>
                      <p className="text-[#192d71]">{viewingRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la obra */}
              <div className="bg-gradient-to-br from-[#192d71]/10 to-white rounded-2xl p-6 border border-[#192d71]/30">
                <h3 className="text-xl font-bold text-[#192d71] mb-4">Detalles de la Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong className="text-[#192d71]">Título:</strong> {viewingRecord.workDetails.title}</div>
                  <div><strong className="text-[#192d71]">Autor:</strong> {viewingRecord.workDetails.author}</div>
                  <div><strong className="text-[#192d71]">Técnica:</strong> {viewingRecord.workDetails.technique}</div>
                  <div><strong className="text-[#192d71]">Medidas:</strong> {viewingRecord.workDetails.dimensions}</div>
                  <div className="md:col-span-2">
                    <strong className="text-[#192d71]">Colección:</strong> {viewingRecord.workDetails.collection}
                  </div>
                </div>
              </div>

              {/* Estado de conservación */}
              <div className="bg-gradient-to-br from-[#192d71]/20 to-white rounded-2xl p-6 border border-[#192d71]/40">
                <h3 className="text-xl font-bold text-[#192d71] mb-4">Estado de Conservación</h3>
                <p className="text-[#192d71]">{viewingRecord.conservationState}</p>
              </div>

              {/* Información del receptor y entregador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#192d71]/30 to-white rounded-2xl p-6 border border-[#192d71]/50">
                  <h3 className="text-xl font-bold text-[#192d71] mb-4">Receptor</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Nombre:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Cédula:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.idCard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Teléfono:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#192d71]/40 to-white rounded-2xl p-6 border border-[#192d71]/60">
                  <h3 className="text-xl font-bold text-[#192d71] mb-4">Entregador</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Nombre:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Cédula:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.idCard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#192d71]">Teléfono:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-[#192d71]/20">
                <button
                  onClick={() => generatePDF(viewingRecord)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  <Download className="h-5 w-5" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  onClick={() => {
                    handleEdit(viewingRecord);
                    setViewingRecord(null);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementHistoryView;
