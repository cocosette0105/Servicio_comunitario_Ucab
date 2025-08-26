// VISTA DE HISTORIAL DE MOVIMIENTOS
// Vista de presentación para la gestión de movimientos de obras (entradas y salidas)
// Permite registrar, consultar, editar y generar reportes de movimientos con paginación responsive
//frontend/src/views/MovementHistoryView.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown, Download, Edit, Eye, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { MovementRecord, Work, User } from '../models';
import { PDFUtils } from '../utils/pdfUtils';
import { MovementController, NewMovementData, UpdateMovementData } from '../controllers/MovementController';


interface MovementHistoryViewProps {
  user: User;
  works: Work[];
  token: string;
}

interface MovementFormData {
  workId: string;
  date: string;
  type: 'entrada' | 'salida';
  reason: string;
  notes: string;
  workDetails: { author: string; title: string; technique: string; dimensions: string; collection: string; };
  conservationState: string;
  receiver: { name: string; idCard: string; phone: string; };
  deliverer: { name: string; idCard: string; phone: string; };
}

const MovementHistoryView: React.FC<MovementHistoryViewProps> = ({ user, works, token }) => {
  const [records, setRecords] = useState<MovementRecord[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MovementRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const initialFormData: MovementFormData = {
    workId: '',
    date: '',
    type: 'entrada',
    reason: '',
    notes: '',
    workDetails: { author: '', title: '', technique: '', dimensions: '', collection: '' },
    conservationState: '',
    receiver: { name: '', idCard: '', phone: '' },
    deliverer: { name: '', idCard: '', phone: '' }
  };
  
  const [formData, setFormData] = useState<MovementFormData>(initialFormData);

  useEffect(() => {
  const fetchMovements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let movements: MovementRecord[] = [];

      if (token) {
        if (selectedWorkId) {
          movements = await MovementController.getMovementsByWorkId(selectedWorkId, token);
        } else {
          movements = await MovementController.getAllMovements(token);
        }
        setRecords(movements);
      }
    } catch (err) {
      setError('No se pudieron cargar los movimientos.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchMovements();
}, [selectedWorkId, token]);

  const filteredRecords = records.filter(record => {
    const searchString = `${record.workName} ${record.workDetails?.author} ${record.reason}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesDate = !dateFilter || record.date.startsWith(dateFilter);
    return matchesSearch && matchesType && matchesDate;
  });

  const {
    currentPage, totalPages, paginatedItems: paginatedRecords,
    goToPage, nextPage, prevPage
  } = usePagination(filteredRecords, { itemsPerPage: 4 });

  // --- MANEJADORES DE EVENTOS ---

  const handleWorkSelection = (inventoryNumber: string) => {
    const selectedWork = works.find(work => work.inventoryNumber === inventoryNumber);
    if (selectedWork) {
        setSelectedWorkId(parseInt(selectedWork.id, 10));
        const dimensions = [
            selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm`,
            selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm`,
            selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm`,
            selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm`,
        ].filter(Boolean).join(' x ');
        setFormData(prev => ({
            ...prev,
            workId: inventoryNumber,
            workDetails: {
                author: selectedWork.artist,
                title: selectedWork.name,
                technique: selectedWork.technique || 'No especificado',
                dimensions: dimensions || 'No especificado',
                collection: selectedWork.collection?.acquisitionMethod || 'Colección General'
            }
        }));
    } else {
        setSelectedWorkId(null);
        setFormData(prev => ({ ...prev, workId: '', workDetails: initialFormData.workDetails }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingRecord(null);
    setSelectedWorkId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    // Añadimos una validación para asegurarnos de que el token existe antes de usarlo.
    if (!token) {
      setError('Error de autenticación. Por favor, inicie sesión de nuevo.');
      console.error("Intento de envío sin token.");
      return; // Detenemos la ejecución si no hay token
    }

    // Validación básica
    if (!selectedWorkId) {
      setError('Por favor, seleccione una obra de la lista.');
      return;
    }
    if (!formData.reason.trim()) {
        setError('El motivo del movimiento es obligatorio.');
        return;
    }

    const movementData: NewMovementData = {
        his_mov_obr_id_fk: selectedWorkId,
        his_tip_movimiento: formData.type,
        his_mov_motiv: formData.reason,
        his_mov_notas: formData.notes,
        his_mov_usu_id_fk: user.id,
    };

    setIsLoading(true);
    try {
        // Ahora estamos seguros de que 'token' es una cadena válida
       const newMovement = await MovementController.addMovement(movementData, token);

console.log('probando', newMovement);

const backendMovimiento = newMovement.movimiento;

const newMovementFormatted: MovementRecord = {
  id: backendMovimiento.his_mov_id.toString(), // ✅ usar el campo real
  workId: backendMovimiento.his_mov_obr_id_fk.toString(),
  workName: formData.workDetails?.title || 'Sin título', // porque el backend no manda esto
  date: backendMovimiento.his_mov_fecha || new Date().toISOString(),
  type: backendMovimiento.his_tip_movimiento,
  reason: backendMovimiento.his_mov_motiv,
  notes: backendMovimiento.his_mov_notas,
  workDetails: formData.workDetails || {
    author: 'Desconocido',
    title: 'Sin título',
    technique: '',
    dimensions: '',
    collection: ''
  },
  conservationState: formData.conservationState || '',
  receiver: formData.receiver || { name: '', idCard: '', phone: '' },
  deliverer: formData.deliverer || { name: '', idCard: '', phone: '' }
};

setRecords(prev => [newMovementFormatted, ...prev]);

        setShowForm(false);
        resetForm();

    } catch (error: any) {
        console.error("Error al registrar movimiento:", error);
        setError(error.message || 'Ocurrió un error inesperado.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleEdit = (record: MovementRecord) => {
    const selectedWork = works.find(work => work.id === record.workId);
    setFormData({
      workId: selectedWork?.inventoryNumber || '',
      date: record.date.split('T')[0],
      type: record.type,
      reason: record.reason,
      notes: record.notes || '',
      workDetails: record.workDetails,
      conservationState: record.conservationState,
      receiver: record.receiver,
      deliverer: record.deliverer
    });
    setEditingRecord(record);
    setSelectedWorkId(parseInt(record.workId, 10));
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !selectedWorkId) return;

    setError(null);
    setIsLoading(true);

    const movementData: UpdateMovementData = {
        his_tip_movimiento: formData.type,
        his_mov_motiv: formData.reason,
        his_mov_notas: formData.notes,
    };

    try {
        // **CORRECCIÓN**: Pasamos el token
        const updatedMovement = await MovementController.updateMovement(parseInt(editingRecord.id, 10), movementData, token);
        const updatedRecords = records.map(record =>
            record.id === editingRecord.id ? { ...record, ...updatedMovement.movimiento } : record
        );
        setRecords(updatedRecords);
        setShowForm(false);
        resetForm();
    } catch (error: any) {
        console.error("Error al actualizar movimiento:", error);
        setError(error.message || 'Ocurrió un error inesperado.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
        setError(null);
        setIsLoading(true);
        try {
            // **CORRECCIÓN**: Pasamos el token
            const success = await MovementController.deleteMovement(parseInt(recordId, 10), token);
            if (success) {
                const updatedRecords = records.filter(record => record.id !== recordId);
                setRecords(updatedRecords);
            } else {
                setError('No se pudo eliminar el registro.');
            }
        } catch (error: any) {
            console.error("Error al eliminar movimiento:", error);
            setError(error.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    }
  };

  const generatePDF = async (record: MovementRecord) => {
    await PDFUtils.generateMovementPDF(record);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  // Renderizado principal del componente con diseño responsive
  // Renderizado de la vista de historial de movimientos
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          {/* Título principal con gradiente y tamaños responsive */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Historial de Movimientos
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Registre y consulte el historial de entradas y salidas de obras</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Botón para mostrar/ocultar filtros */}
          {/* Botón de filtros con indicador visual de estado activo */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-[#192d71]/10 border-[#192d71]/30 text-[#192d71] font-semibold' 
                : 'bg-white border-[#192d71]/30 text-[#192d71] hover:bg-[#192d71]/5 font-medium'
            } justify-center sm:justify-start`}
          >
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {/* Botón para agregar nuevo movimiento */}
          {/* Botón principal para registrar nuevos movimientos */}
          <button
            onClick={() => {
              resetForm();
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base justify-center sm:justify-start"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros (mostrado condicionalmente) */}
      {/* Panel expandible de filtros con opciones múltiples */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#192d71]">Filtros de Búsqueda</h2>
            <button
              onClick={clearFilters}
              className="text-[#192d71] hover:text-[#1e3a8a] text-xs sm:text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por tipo de movimiento */}
            {/* Selector para filtrar por entrada o salida */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Tipo de Movimiento</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            {/* Filtro por fecha */}
            {/* Campo de fecha para filtrar movimientos */}
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

      {/* Formulario para crear/editar movimiento (mostrado condicionalmente) */}
      {/* Formulario modal completo con múltiples secciones */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#192d71] mb-4 sm:mb-6">
            {editingRecord ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
          </h2>
          <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-6 sm:space-y-8">
            
            {/* Sección: Información General */}
            <div className="border-b border-[#192d71]/20 pb-4 sm:pb-6">
              {/* Sección principal con datos básicos del movimiento */}
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Selector de obra */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Obra *</label>
                  <select
                    value={formData.workId}
                    onChange={(e) => handleWorkSelection(e.target.value)}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
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
                {/* Campo de fecha con validación de fecha futura */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Fecha del Movimiento *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    required
                  />
                </div>
                {/* Selector tipo de movimiento */}
                {/* Selector para entrada o salida */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Tipo de Movimiento *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'salida' }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                {/* Campo motivo */}
                {/* Campo de texto para el motivo del movimiento */}
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Motivo *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Motivo del movimiento"
                    required
                  />
                </div>
              </div>
              {/* Campo notas adicionales */}
              {/* Área de texto para notas opcionales */}
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Notas Adicionales</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] resize-none text-sm sm:text-base"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Sección: Detalles de la Obra (autocompletados) */}
            <div className="border-b border-[#192d71]/20 pb-4 sm:pb-6">
              {/* Sección con información técnica de la obra seleccionada */}
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Detalles de la Obra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Autor *</label>
                  <input
                    type="text"
                    value={formData.workDetails.author}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, author: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Nombre del autor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Título *</label>
                  <input
                    type="text"
                    value={formData.workDetails.title}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, title: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Título de la obra"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Técnica *</label>
                  <input
                    type="text"
                    value={formData.workDetails.technique}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, technique: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Ej: Óleo sobre lienzo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Medidas *</label>
                  <input
                    type="text"
                    value={formData.workDetails.dimensions}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, dimensions: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Ej: 80 x 60 cm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Colección *</label>
                  <input
                    type="text"
                    value={formData.workDetails.collection}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, collection: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Ej: Colección Permanente"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Estado de Conservación */}
            <div className="border-b border-[#192d71]/20 pb-4 sm:pb-6">
              {/* Sección para describir el estado actual de la obra */}
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Estado de Conservación</h3>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Descripción del Estado *</label>
                <textarea
                  value={formData.conservationState}
                  onChange={(e) => setFormData(prev => ({ ...prev, conservationState: e.target.value }))}
                  rows={3}
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] resize-none text-sm sm:text-base"
                  placeholder="Describa el estado actual de conservación de la obra..."
                  required
                />
              </div>
            </div>

            {/* Sección: Información del Receptor */}
            <div className="border-b border-[#192d71]/20 pb-4 sm:pb-6">
              {/* Sección con datos de la persona que recibe la obra */}
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información del Receptor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Nombre *</label>
                  <input
                    type="text"
                    value={formData.receiver.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, name: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={formData.receiver.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, idCard: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="12.345.678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.receiver.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, phone: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="+58 212-555-0123"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Información del Entregador */}
            <div className="pb-4 sm:pb-6">
              {/* Sección con datos de la persona que entrega la obra */}
              <h3 className="text-base sm:text-lg font-bold text-[#192d71] mb-3 sm:mb-4">Información del Entregador</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Nombre *</label>
                  <input
                    type="text"
                    value={formData.deliverer.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, name: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={formData.deliverer.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, idCard: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="87.654.321"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.deliverer.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, phone: e.target.value }
                    }))}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="+58 212-555-0456"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción del formulario */}
            {/* Botones para cancelar o enviar el formulario */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-6 sm:pt-8 border-t border-[#192d71]/20">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
              >
                {editingRecord ? 'Actualizar Movimiento' : 'Registrar Movimiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla principal de registros */}
      {/* Contenedor principal de la tabla con búsqueda y paginación */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Barra de búsqueda */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#192d71]/20">
          {/* Campo de búsqueda con icono integrado */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra, autor, receptor, entregador o motivo..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        {/* Tabla de registros */}
        {/* Tabla responsive con scroll horizontal en dispositivos pequeños */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Receptor</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden xl:table-cell">Entregador</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea cada registro filtrado */}
              {/* Renderizado de registros con información adaptativa */}
              {paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-sm sm:text-base lg:text-lg">{record.workDetails?.title || 'Sin título'}</p>
                      <p className="text-xs sm:text-sm text-[#192d71]/70 font-medium">Por {record.workDetails?.author || 'Autor desconocido'}</p>
                      <p className="text-xs text-[#192d71]/60 mt-1">{record.workDetails?.technique || 'Técnica no especificada'}</p>
                      {/* Información adicional visible solo en móviles */}
                      {/* Información compacta para dispositivos pequeños */}
                      <div className="sm:hidden mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          {record.type === 'entrada' ? (
                            <ArrowDownCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            record.type === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.type === 'entrada' ? 'Entrada' : 'Salida'}
                          </span>
                        </div>
                        <p className="text-xs text-[#192d71]/60">{new Date(record.date).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                    {/* Indicador visual del tipo de movimiento */}
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
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 font-medium hidden md:table-cell">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  {/* Información del receptor visible en pantallas grandes */}
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden lg:table-cell">
                    <div>
                      <p className="font-semibold text-[#192d71]">{record.receiver.name}</p>
                      <p className="text-sm text-[#192d71]/70">CI: {record.receiver.idCard}</p>
                      <p className="text-sm text-[#192d71]/70">{record.receiver.phone}</p>
                    </div>
                  </td>
                  {/* Información del entregador visible en pantallas extra grandes */}
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden xl:table-cell">
                    <div>
                      <p className="font-semibold text-[#192d71]">{record.deliverer.name}</p>
                      <p className="text-sm text-[#192d71]/70">CI: {record.deliverer.idCard}</p>
                      <p className="text-sm text-[#192d71]/70">{record.deliverer.phone}</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {/* Botones de acción con tooltips descriptivos */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                      {/* Botón consultar */}
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Editar movimiento"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Botón descargar PDF */}
                      <button
                        onClick={() => generatePDF(record)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay registros */}
        {/* Mensaje condicional basado en el estado de filtros */}
        {filteredRecords.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {searchTerm || typeFilter !== 'all' || dateFilter ? 'No se encontraron movimientos que coincidan con los filtros' : 'No hay movimientos registrados'}
          </div>
        )}

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

      {/* Modal para ver detalles del movimiento (mostrado condicionalmente) */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            {/* Encabezado del modal con botón de cierre */}
            <div className="p-4 sm:p-6 lg:p-8 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#192d71]">Detalles del Movimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-2 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 text-xl sm:text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Información general del movimiento */}
              {/* Sección con datos básicos del movimiento */}
              <div className="bg-gradient-to-br from-[#192d71]/5 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/20">
                <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Información General</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#192d71]">Fecha:</p>
                    <p className="text-[#192d71] text-sm sm:text-base">{new Date(viewingRecord.date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#192d71]">Tipo:</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      viewingRecord.type === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingRecord.type === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm font-bold text-[#192d71]">Motivo:</p>
                    <p className="text-[#192d71] text-sm sm:text-base">{viewingRecord.reason}</p>
                  </div>
                  {viewingRecord.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Notas:</p>
                      <p className="text-[#192d71] text-sm sm:text-base">{viewingRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la obra */}
              {/* Sección con información técnica de la obra */}
              <div className="bg-gradient-to-br from-[#192d71]/10 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/30">
                <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Detalles de la Obra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                 <div><strong className="text-[#192d71]">Título:</strong> {viewingRecord.workDetails?.title || 'Sin título'}</div>
                  <div><strong className="text-[#192d71]">Autor:</strong> {viewingRecord.workDetails.author}</div>
                  <div><strong className="text-[#192d71]">Técnica:</strong> {viewingRecord.workDetails.technique}</div>
                  <div><strong className="text-[#192d71]">Medidas:</strong> {viewingRecord.workDetails.dimensions}</div>
                  <div className="sm:col-span-2">
                    <strong className="text-[#192d71]">Colección:</strong> {viewingRecord.workDetails.collection}
                  </div>
                </div>
              </div>

              {/* Estado de conservación */}
              {/* Sección con descripción del estado de la obra */}
              <div className="bg-gradient-to-br from-[#192d71]/20 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/40">
                <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Estado de Conservación</h3>
                <p className="text-[#192d71] text-sm sm:text-base">{viewingRecord.conservationState}</p>
              </div>

              {/* Información del receptor y entregador */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Información del receptor */}
                <div className="bg-gradient-to-br from-[#192d71]/30 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/50">
                  <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Receptor</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Nombre:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Cédula:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.idCard}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Teléfono:</p>
                      <p className="text-[#192d71]">{viewingRecord.receiver.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Información del entregador */}
                <div className="bg-gradient-to-br from-[#192d71]/40 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/60">
                  <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Entregador</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Nombre:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Cédula:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.idCard}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#192d71]">Teléfono:</p>
                      <p className="text-[#192d71]">{viewingRecord.deliverer.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción del modal */}
              {/* Botones para descargar PDF y editar registro */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
                <button
                  onClick={() => generatePDF(viewingRecord)}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
                >
                  <Download className="h-5 w-5" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  onClick={() => {
                    handleEdit(viewingRecord);
                    setViewingRecord(null);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
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