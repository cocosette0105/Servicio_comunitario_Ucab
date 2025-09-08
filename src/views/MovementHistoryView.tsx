// VISTA DE HISTORIAL DE MOVIMIENTOS
// Vista de presentación para la gestión de movimientos de obras (entradas y salidas)
// Permite registrar, consultar, editar y generar reportes de movimientos con paginación responsive
//frontend/src/views/MovementHistoryView.tsx
// VISTA DE HISTORIAL DE MOVIMIENTOS
// Vista de presentación para la gestión de movimientos de obras (entradas y salidas)
// Permite registrar, consultar, editar y generar reportes de movimientos con paginación responsive
//frontend/src/views/MovementHistoryView.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, Download, Edit, Eye, Trash2, X, ArrowDownCircle, ArrowUpCircle, User, Users, Star, XCircle } from 'lucide-react';

import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { MovementRecord, Work, User as AppUser, Person } from '../models'; // Se importa 'Person'
import { PDFUtils } from '../utils/pdfUtils';
import { MovementController, NewMovementData, UpdateMovementData } from '../controllers/MovementController';
import { ExternalPersonsService } from '../services/externalPersonsService';
import { AuthController } from '../controllers/AuthController';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '/logoblanco_negro.jpg';

interface MovementHistoryViewProps {
    user: AppUser;
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
    const [workSearchTerm, setWorkSearchTerm] = useState('');
    const [showWorkDropdown, setShowWorkDropdown] = useState(false);
    const [dateFilter, setDateFilter] = useState('');
    const [cedulaError, setCedulaError] = useState('');

    const [showExternalPersons, setShowExternalPersons] = useState(false);
    const [externalPersons, setExternalPersons] = useState<any[]>([]);
    const [loadingPersons, setLoadingPersons] = useState(false);
    const [personType, setPersonType] = useState<'receiver' | 'deliverer'>('receiver');

    const initialFormData: MovementFormData = {
        workId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'entrada',
        reason: '',
        notes: '',
        workDetails: { author: '', title: '', technique: '', dimensions: '', collection: '' },
        conservationState: '',
        receiver: { name: '', idCard: '', phone: '' },
        deliverer: { name: '', idCard: '', phone: '' }
    };

    const [formData, setFormData] = useState<MovementFormData>(initialFormData);

    const searchFilteredWorks = (works || []).filter(work => {
        if (!workSearchTerm) return true;
        const searchLower = workSearchTerm.toLowerCase();
        return (
            work.name.toLowerCase().includes(searchLower) ||
            work.artist.toLowerCase().includes(searchLower) ||
            work.inventoryNumber.toLowerCase().includes(searchLower)
        );
    });

    useEffect(() => {
        const fetchMovements = async () => {
            if (!token) return;
            setIsLoading(true);
            setError(null);
            try {
                const movements = await MovementController.getAllMovements(token);
                setRecords(movements);
            } catch (err) {
                setError('No se pudieron cargar los movimientos.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovements();
    }, [token]);

    // ========================================================================
    // LÓGICA CORREGIDA PARA EL DIRECTORIO
    // ========================================================================
    const handleToggleDirectory = async (personId: number) => {
        try {
            const response = await ExternalPersonsService.toggleDirectoryStatus(personId, token);
    
            const updatePersonStatus = (person: Person | null): Person | null => {
                if (person && person.id === personId) {
                    return { ...person, agregado_directorio: response.newStatus };
                }
                return person;
            };
    
            const updatedRecords = records.map(rec => ({
                ...rec,
                deliverer: updatePersonStatus(rec.deliverer),
                receiver: updatePersonStatus(rec.receiver),
            }));
            setRecords(updatedRecords);
    
            if (viewingRecord) {
                setViewingRecord(prev => prev ? {
                    ...prev,
                    deliverer: updatePersonStatus(prev.deliverer),
                    receiver: updatePersonStatus(prev.receiver),
                } : null);
            }
    
        } catch (error) {
            console.error("Error al cambiar el estado del directorio:", error);
            alert("Ocurrió un error al actualizar el contacto.");
        }
    };


     const handleRemoveFromDirectory = async (personId: number) => {
        if (window.confirm('¿Estás seguro de que quieres quitar a esta persona del directorio?')) {
            try {
                // Se reutiliza la misma función, ya que 'toggle' la quitará si ya está agregada.
                await handleToggleDirectory(personId); 
                // Se actualiza la lista del modal para que la persona desaparezca al instante.
                setExternalPersons(currentPersons => currentPersons.filter(p => p.id !== personId));
            } catch (error) {
                alert('Ocurrió un error al quitar a la persona del directorio.');
            }
        }
    };

    // ========================================================================
    // FIN DE LA LÓGICA CORREGIDA
    // ========================================================================

    const filteredRecords = records.filter(record => {
        const searchString = `${record.workName} ${record.workDetails?.author ?? ''} ${record.reason}`.toLowerCase();
        const receiverString = record.receiver?.name.toLowerCase() ?? '';
        const delivererString = record.deliverer?.name.toLowerCase() ?? '';

        const matchesSearch = searchString.includes(searchTerm.toLowerCase()) || 
                              receiverString.includes(searchTerm.toLowerCase()) ||
                              delivererString.includes(searchTerm.toLowerCase());
                              
        const matchesType = typeFilter === 'all' || record.type === typeFilter;
        const matchesDate = !dateFilter || new Date(record.date).toISOString().startsWith(dateFilter);
        return matchesSearch && matchesType && matchesDate;
    });

    const {
        paginatedItems: paginatedRecords,
        currentPage,
        totalPages,
        goToPage,
    } = usePagination(filteredRecords, { itemsPerPage: 6 });

    // --- MANEJADORES DE EVENTOS ---

    const handleWorkSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setWorkSearchTerm(value);
        setShowWorkDropdown(value.length > 0);
        if (value === '') {
            setSelectedWorkId(null);
        }
    };

    const clearWorkSelection = () => {
        setWorkSearchTerm('');
        setSelectedWorkId(null);
        setShowWorkDropdown(false);
        setFormData(prev => ({ ...prev, workId: '', workDetails: initialFormData.workDetails }));
    };

    const handleWorkSelection = (inventoryNumber: string) => {
        const selectedWork = works.find(work => work.inventoryNumber === inventoryNumber);

        if (selectedWork) {
            setSelectedWorkId(parseInt(selectedWork.id, 10));

            const dimensions = [
                selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm alto`,
                selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm ancho`,
                selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm prof.`,
                selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm diám.`
            ].filter(Boolean).join(' × ') || 'No especificado';

            setFormData(prev => ({
                ...prev,
               workId: selectedWork.id,
                workDetails: {
                    author: selectedWork.artist,
                    title: selectedWork.name,
                    technique: selectedWork.technique || 'No especificado',
                    dimensions: dimensions,
                    collection: 'Colección General'
                }
            }));

            setWorkSearchTerm(`${selectedWork.name} - ${selectedWork.artist}`);
            setShowWorkDropdown(false);
        } else {
            setSelectedWorkId(null);
            const { workId, workDetails, ...rest } = initialFormData;
            setFormData(prev => ({ ...prev, workId: '', workDetails: initialFormData.workDetails }));
            setWorkSearchTerm('');
        }
    };

    const handleWorkSearchSelection = (work: Work) => {
        handleWorkSelection(work.inventoryNumber);
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingRecord(null);
        setSelectedWorkId(null);
        setWorkSearchTerm('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) { setError('Error de autenticación.'); return; }
        if (!selectedWorkId) { setError('Por favor, seleccione una obra de la lista.'); return; }

        const newMovementData: NewMovementData = {
            his_mov_fecha: formData.date,
            his_mov_obr_id_fk: selectedWorkId,
            his_mov_usu_id_fk: user.id,
            his_tip_movimiento: formData.type,
            his_mov_motiv: formData.reason,
            his_mov_notas: formData.notes,
            his_mov_coleccion: formData.workDetails.collection,
            his_mov_descripcion_estado: formData.conservationState,
            receiver: { nombre: formData.receiver.name, cedula: formData.receiver.idCard, telefono: formData.receiver.phone },
            deliverer: { nombre: formData.deliverer.name, cedula: formData.deliverer.idCard, telefono: formData.deliverer.phone }
        };
        setIsLoading(true);
        setError(null);
        try {
            await MovementController.createMovement(newMovementData, token);
            const updatedMovements = await MovementController.getAllMovements(token);
            setRecords(updatedMovements);
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error('Error al guardar el movimiento:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Ocurrió un error inesperado. Por favor, intente de nuevo.');
            }
        }
    };

      const handleEdit = (record: MovementRecord) => {
        // Se asegura de que los detalles de la obra existan
        if (!record.workDetails) {
            alert("Faltan detalles de la obra en este registro para poder editar.");
            return;
        }

        // 1. Llenar el formulario con los datos del registro
        setFormData({
            workId: record.workId, // Guardamos el ID real en el formulario
            date: new Date(record.date).toISOString().split('T')[0],
            type: record.type,
            reason: record.reason,
            notes: record.notes || '',
            workDetails: record.workDetails,
            conservationState: record.conservationState,
            receiver: record.receiver ?? { name: '', idCard: '', phone: '' },
            deliverer: record.deliverer ?? { name: '', idCard: '', phone: '' }
        });

        // 2. Establecer el ID de la obra y el registro que se está editando
        setSelectedWorkId(parseInt(record.workId, 10));
        setEditingRecord(record);
        
        // 3. ¡CORRECCIÓN CLAVE! Establecer el texto que se ve en el input de búsqueda.
        setWorkSearchTerm(`${record.workDetails.title} - ${record.workDetails.author}`);
        
        // 4. Abrir el formulario
        setShowForm(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord || !selectedWorkId || !token) return;

        const movementData: UpdateMovementData = {
            his_tip_movimiento: formData.type,
            his_mov_motiv: formData.reason,
            his_mov_notas: formData.notes,
            his_mov_coleccion: formData.workDetails.collection,
            his_mov_descripcion_estado: formData.conservationState,
            receiver: { nombre: formData.receiver.name, cedula: formData.receiver.idCard, telefono: formData.receiver.phone },
            deliverer: { nombre: formData.deliverer.name, cedula: formData.deliverer.idCard, telefono: formData.deliverer.phone }
        };


        setIsLoading(true);
        setError(null);
        try {
            await MovementController.updateMovement(parseInt(editingRecord.id, 10), movementData, token);
            const updatedMovements = await MovementController.getAllMovements(token);
            setRecords(updatedMovements);
            setShowForm(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error al actualizar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (recordId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
            if (!token) return;
            setIsLoading(true);
            setError(null);
            try {
                await MovementController.deleteMovement(parseInt(recordId, 10), token);
                setRecords(prev => prev.filter(record => record.id !== recordId));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro.');
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

    const loadExternalPersons = async () => {
        setLoadingPersons(true);
        try {
            const token = AuthController.getToken();
            if (!token) throw new Error('No se encontró el token de autenticación');
            
            const persons = await ExternalPersonsService.getDirectoryContacts(token);
            
            const mappedPersons = persons.map(person => ({
                id: person.per_ext_id,
                nombre: person.per_ext_nombre,
                cedula: person.per_ext_cedula,
                telefono: person.per_ext_telefono
            }));
            
            setExternalPersons(mappedPersons);
        } catch (err) {
            console.error('Error cargando personas del directorio:', err);
        } finally {
            setLoadingPersons(false);
        }
    };

    const selectPersonFromDirectory = (person: any) => {
        if (personType === 'receiver') {
            setFormData(prev => ({
                ...prev,
                receiver: {
                    name: person.nombre,
                    idCard: person.cedula,
                    phone: person.telefono
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                deliverer: {
                    name: person.nombre,
                    idCard: person.cedula,
                    phone: person.telefono
                }
            }));
        }
        setShowExternalPersons(false);
    };

    const exportMovementsToPDF = () => {
        const doc = new jsPDF();
        const MARGIN = 14;
        const headers = [['Obra', 'Autor', 'Tipo', 'Fecha', 'Receptor', 'Entregador', 'Motivo']];

        const data = filteredRecords.map((movement: MovementRecord) => [
            movement.workDetails?.title || 'N/A',
            movement.workDetails?.author || 'N/A',
            movement.type === 'entrada' ? 'Entrada' : 'Salida',
            new Date(movement.date).toLocaleDateString('es-ES'),
            movement.receiver?.name || 'N/A',
            movement.deliverer?.name || 'N/A',
            movement.reason || 'N/A'
        ]);

        autoTable(doc, {
            startY: 30,
            head: headers,
            body: data,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [12, 57, 102], textColor: 255, fontStyle: 'bold' },
            didDrawPage: (data) => {
                const LOGO_WIDTH = 30;
                const LOGO_HEIGHT = 12;
                doc.addImage(logoSrc, 'JPEG', MARGIN, MARGIN - 5, LOGO_WIDTH, LOGO_HEIGHT);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Reporte de Movimientos del Museo', MARGIN + LOGO_WIDTH + 5, MARGIN + 2);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, doc.internal.pageSize.getWidth() - MARGIN, MARGIN + 2, { align: 'right' });
            },
        });

        doc.save(`reporte_movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // ========================================================================
    // COMPONENTE DE BOTÓN SIMPLIFICADO Y REUTILIZABLE
    // ========================================================================
    const DirectoryToggleButton = ({ isAdded, onClick }: { isAdded: boolean; onClick: () => void; }) => (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-md ${
                isAdded
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
        >
            {isAdded ? <XCircle className="h-4 w-4" /> : <Star className="h-4 w-4" />}
            <span>
                {isAdded ? 'Quitar del Directorio' : 'Guardar Contacto'}
            </span>
        </button>
    );
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
       
          
          {/* NUEVO BOTÓN: Exportar PDF de movimientos */}
          <button
            onClick={exportMovementsToPDF}
            className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
            title="Exportar reporte PDF de movimientos"
          >
            <Download className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Exportar PDF</span>
          </button>
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
                    <option key={work.id} value={work.id}>
        {work.name} - {work.artist} ({work.inventoryNumber})
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
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Nombre Completo *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.receiver.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        receiver: { ...prev.receiver, name: e.target.value }
                      }))}
                      className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                      placeholder="Ej: María González"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('receiver');
                        setShowExternalPersons(true);
                        loadExternalPersons();
                      }}
                      className="px-4 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-200 font-semibold text-sm flex items-center space-x-2"
                      title="Ver directorio de personas registradas"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver Personas</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Cédula de Identidad *</label>
                  <input
                    type="text"
                    value={formData.receiver.idCard}
                   onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {  
      setFormData(prev => ({
        ...prev,
        receiver: { ...prev.receiver, idCard: value }
      }));
    }
  }}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                    placeholder="12.345.678"
                     maxLength={20}
                     
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
                   placeholder="0412-1234567"
  maxLength={20}   // coincide con VARCHAR(20) de la BD
  pattern="^0\d{3}-\d{7}$"
  title="Formato válido: 0412-1234567"
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
                  <label className="block text-xs sm:text-sm font-bold text-[#192d71] mb-2 sm:mb-3 flex items-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Nombre Completo *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.deliverer.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deliverer: { ...prev.deliverer, name: e.target.value }
                      }))}
                      className="flex-1 px-3 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-white text-[#192d71] text-sm sm:text-base"
                      placeholder="Ej: Carlos Mendoza"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPersonType('deliverer');
                        setShowExternalPersons(true);
                        loadExternalPersons();
                      }}
                      className="px-4 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-200 font-semibold text-sm flex items-center space-x-2"
                      title="Ver directorio de personas registradas"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver Personas</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Cédula de Identidad *</label>
                  <input
                 type="text"
  value={formData.deliverer.idCard}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {  
      setFormData(prev => ({
        ...prev,
      
        deliverer: { ...prev.deliverer, idCard: value } 
      }));
    }
  }}
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
                   placeholder="0412-1234567"
  maxLength={20}   // coincide con VARCHAR(20) de la BD
  pattern="^0\d{3}-\d{7}$"
  title="Formato válido: 0412-1234567"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción del formulario */}
            {/* Botones para cancelar o enviar el formulario */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-6 sm:pt-8 border-t border-[#192d71]/20">
            {error && (
    <div className="w-full text-center p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p>{error}</p>
    </div>
  )}
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

      {/* NUEVO MODAL PARA VISUALIZAR PERSONAS EXTERNAS */}
      {showExternalPersons && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-2 sm:mx-4">
            {/* Encabezado del modal */}
            <div className="p-4 sm:p-6 border-b border-[#192d71]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-[#192d71]">
                  Directorio de Personas - {personType === 'receiver' ? 'Receptor' : 'Entregador'}
                </h2>
                <button
                  onClick={() => setShowExternalPersons(false)}
                  className="p-2 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-4 sm:p-6">
              {loadingPersons ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#192d71] mx-auto"></div>
                  <p className="text-[#192d71] mt-2">Cargando personas...</p>
                </div>
              ) : (
                <div className="space-y-3">
                {externalPersons.map(person => (
  <div
    key={person.id}
    className="p-4 border border-[#192d71]/20 rounded-xl hover:bg-[#192d71]/5 transition-colors"
  >
    <div className="flex justify-between items-center">
      <div onClick={() => selectPersonFromDirectory(person)} className="cursor-pointer flex-1">
        <h3 className="font-semibold text-[#192d71]">{person.nombre}</h3>
        <p className="text-sm text-[#192d71]/70">CI: {person.cedula}</p>
        <p className="text-sm text-[#192d71]/70">Tel: {person.telefono}</p>
      </div>
      <div className="flex space-x-2">
        {/* Botón seleccionar */}
        <button
          onClick={() => selectPersonFromDirectory(person)}
          className="text-[#192d71] hover:text-[#1e3a8a] font-semibold text-sm"
          title="Seleccionar persona"
        >
          Seleccionar
        </button>
        
       <button 
                                            onClick={() => handleRemoveFromDirectory(person.id)} 
                                            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                            title="Quitar del directorio"
                                        >
                                            <Trash2 size={18} />
                                        </button>
      </div>
    </div>
  </div>
))}
                  
                  {externalPersons.length === 0 && (
                    <div className="text-center py-8 text-[#192d71]/60">
                      No hay personas registradas en el directorio
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
    {/* Se usa optional chaining (?.) y el operador (??) para evitar errores si no hay receptor */}
    <p className="font-semibold text-[#192d71]">{record.receiver?.name ?? 'No aplica'}</p>
    <p className="text-sm text-[#192d71]/70">CI: {record.receiver?.idCard ?? 'N/A'}</p>
    <p className="text-sm text-[#192d71]/70">{record.receiver?.phone ?? 'N/A'}</p>
  </div>
</td>
                  {/* Información del entregador visible en pantallas extra grandes */}
                 {/* 👇 ESTA ES LA VERSIÓN CORREGIDA 👇 */}
<td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden xl:table-cell">
  <div>
    {/* Se aplica la misma corrección para el entregador */}
    <p className="font-semibold text-[#192d71]">{record.deliverer?.name ?? 'No aplica'}</p>
    <p className="text-sm text-[#192d71]/70">CI: {record.deliverer?.idCard ?? 'N/A'}</p>
    <p className="text-sm text-[#192d71]/70">{record.deliverer?.phone ?? 'N/A'}</p>
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

               {/* Muestra qué usuario registró el movimiento, con un ícono. */}
  <div className="flex items-center text-sm text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-200">
      <User className="w-5 h-5 mr-3 text-[#192d71]" />
      <span className="font-semibold text-[#192d71]">Registrado por:</span>
      <span className="ml-2">{viewingRecord.userName}</span>
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
                            {/* --- Información del Receptor --- */}
                            <div className="bg-gradient-to-br from-[#192d71]/30 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/50 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Receptor</h3>
                                    <div className="space-y-2 text-sm sm:text-base">
                                        <p><strong className="font-semibold text-[#192d71]">Nombre:</strong> {viewingRecord.receiver?.name ?? 'No aplica'}</p>
                                        <p><strong className="font-semibold text-[#192d71]">Cédula:</strong> {viewingRecord.receiver?.idCard ?? 'N/A'}</p>
                                        <p><strong className="font-semibold text-[#192d71]">Teléfono:</strong> {viewingRecord.receiver?.phone ?? 'N/A'}</p>
                                    </div>
                                </div>
                                {viewingRecord.receiver && (
                                    <div className="mt-4">
                                        <DirectoryToggleButton 
                                            isAdded={viewingRecord.receiver.agregado_directorio} 
                                            onClick={() => handleToggleDirectory(viewingRecord.receiver!.id)} 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* --- Información del Entregador --- */}
                            <div className="bg-gradient-to-br from-[#192d71]/40 to-white rounded-2xl p-4 sm:p-6 border border-[#192d71]/60 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-[#192d71] mb-3 sm:mb-4">Entregador</h3>
                                    <div className="space-y-2 text-sm sm:text-base">
                                        <p><strong className="font-semibold text-[#192d71]">Nombre:</strong> {viewingRecord.deliverer?.name ?? 'No aplica'}</p>
                                        <p><strong className="font-semibold text-[#192d71]">Cédula:</strong> {viewingRecord.deliverer?.idCard ?? 'N/A'}</p>
                                        <p><strong className="font-semibold text-[#192d71]">Teléfono:</strong> {viewingRecord.deliverer?.phone ?? 'N/A'}</p>
                                    </div>
                                </div>
                                {viewingRecord.deliverer && (
                                    <div className="mt-4">
                                        <DirectoryToggleButton 
                                            isAdded={viewingRecord.deliverer.agregado_directorio} 
                                            onClick={() => handleToggleDirectory(viewingRecord.deliverer!.id)} 
                                        />
                                    </div>
                                )}
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