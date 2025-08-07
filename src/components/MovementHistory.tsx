import React, { useState } from 'react';
import { Plus, Search, Calendar, ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown, Download, FileText, Edit, Eye, Trash2 } from 'lucide-react';
import { MovementRecord, Work } from '../types';

interface MovementHistoryProps {
  records: MovementRecord[];
  works: Work[];
  onUpdateRecords: (records: MovementRecord[]) => void;
}

// Interfaz para el formulario - estructura expandida para capturar toda la información necesaria
interface MovementFormData {
  workId: string;
  date: string;
  type: 'entrada' | 'salida';
  reason: string;
  notes: string;
  // Detalles de la obra - información técnica y descriptiva
  workDetails: {
    author: string;
    title: string;
    technique: string;
    dimensions: string;
    collection: string;
  };
  // Estado de conservación - campo crítico para el seguimiento de la obra
  conservationState: string;
  // Información del receptor - persona/institución que recibe la obra
  receiver: {
    name: string;
    idCard: string;
    phone: string;
  };
  // Información del entregador - persona responsable de la entrega
  deliverer: {
    name: string;
    idCard: string;
    phone: string;
  };
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ records, works, onUpdateRecords }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MovementRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Estado del formulario - inicialización con valores vacíos para todos los campos nuevos
  const [formData, setFormData] = useState<MovementFormData>({
    workId: '',
    date: '',
    type: 'entrada',
    reason: '',
    notes: '',
    // Inicialización de detalles de obra vacíos
    workDetails: {
      author: '',
      title: '',
      technique: '',
      dimensions: '',
      collection: ''
    },
    // Estado de conservación inicial vacío
    conservationState: '',
    // Información del receptor inicial vacía
    receiver: {
      name: '',
      idCard: '',
      phone: ''
    },
    // Información del entregador inicial vacía
    deliverer: {
      name: '',
      idCard: '',
      phone: ''
    }
  });

  // Filtrado de registros - mantiene la funcionalidad original pero ahora busca en más campos
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

  // Función para autocompletar los detalles de la obra cuando se selecciona una obra
  // Se ejecuta cada vez que cambia el workId en el formulario
  // Busca la obra seleccionada en la lista de obras y llena automáticamente los campos de detalles
  const handleWorkSelection = (workId: string) => {
  // Actualizar el workId en el formulario
  setFormData(prev => ({ ...prev, workId }));

  // Buscar obra por inventoryNumber (porque no tienes 'id')
  const selectedWork = works.find(work => work.inventoryNumber === workId);
  if (selectedWork) {
    const dimensions = [
      selectedWork.dimensions.height && `${selectedWork.dimensions.height}cm`,
      selectedWork.dimensions.width && `${selectedWork.dimensions.width}cm`,
      selectedWork.dimensions.depth && `${selectedWork.dimensions.depth}cm`,
      selectedWork.dimensions.diameter && `${selectedWork.dimensions.diameter}cm`,
    ].filter(Boolean).join(' x ');

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
    // Limpiar detalles si no se encuentra la obra
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


  // Manejo del envío del formulario - validación expandida y creación del registro completo
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de fecha - no permitir fechas futuras (regla de negocio importante)
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }
    
    const selectedWork = works.find(work => work.inventoryNumber === formData.workId);
    if (!selectedWork) return;

    // Creación del nuevo registro con toda la información expandida
    const newRecord: MovementRecord = {
      id: Date.now().toString(),
      workId: formData.workId,
      workName: selectedWork.name,
      date: formData.date,
      type: formData.type,
      reason: formData.reason,
      notes: formData.notes,
      // Inclusión de todos los nuevos campos de detalles de obra
      workDetails: formData.workDetails,
      conservationState: formData.conservationState,
      receiver: formData.receiver,
      deliverer: formData.deliverer
    };

    onUpdateRecords([...records, newRecord]);
    
    // Reset del formulario - limpieza de todos los campos nuevos
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
    setShowForm(false);
  };

  // Función para manejar la edición de un registro
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

  // Función para manejar la eliminación de un registro
  const handleDelete = (recordId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro de movimiento?')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateRecords(updatedRecords);
    }
  };

  // Función para actualizar un registro existente
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de fecha - no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }
    
    const selectedWork = works.find(work => work.inventoryNumber === formData.workId);
    if (!selectedWork) return;

    if (editingRecord) {
      // Actualizar registro existente
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
    
    // Reset del formulario
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
    setShowForm(false);
  };

  // Función para generar y descargar PDF - funcionalidad completamente nueva
  const generatePDF = (record: MovementRecord) => {
    // Creación del contenido HTML para el PDF con estructura profesional
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Registro de Movimiento - ${record.workName}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #1e40af; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .museum-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 10px;
          }
          .document-title { 
            font-size: 18px; 
            color: #666; 
          }
          .section { 
            margin-bottom: 25px; 
            padding: 15px; 
            border-left: 4px solid #3b82f6; 
            background-color: #eff6ff;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #3b82f6; 
            padding-bottom: 5px;
          }
          .field { 
            margin-bottom: 8px; 
          }
          .field-label { 
            font-weight: bold; 
            color: #1e3a8a; 
            display: inline-block; 
            width: 150px;
          }
          .field-value { 
            color: #333; 
          }
          .movement-type { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            color: white;
            background-color: ${record.type === 'entrada' ? '#28a745' : '#dc3545'};
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd; 
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="museum-name">Museo Carmelo Fernández</div>
          <div class="document-title">Registro de Movimiento de Obra</div>
        </div>

        <div class="section">
          <div class="section-title">Información General del Movimiento</div>
          <div class="field">
            <span class="field-label">Fecha:</span>
            <span class="field-value">${new Date(record.date).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="field">
            <span class="field-label">Tipo:</span>
            <span class="movement-type">${record.type === 'entrada' ? 'ENTRADA' : 'SALIDA'}</span>
          </div>
          <div class="field">
            <span class="field-label">Motivo:</span>
            <span class="field-value">${record.reason}</span>
          </div>
          ${record.notes ? `
          <div class="field">
            <span class="field-label">Notas:</span>
            <span class="field-value">${record.notes}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Detalles de la Obra</div>
          <div class="field">
            <span class="field-label">Título:</span>
            <span class="field-value">${record.workDetails.title}</span>
          </div>
          <div class="field">
            <span class="field-label">Autor:</span>
            <span class="field-value">${record.workDetails.author}</span>
          </div>
          <div class="field">
            <span class="field-label">Técnica:</span>
            <span class="field-value">${record.workDetails.technique}</span>
          </div>
          <div class="field">
            <span class="field-label">Medidas:</span>
            <span class="field-value">${record.workDetails.dimensions}</span>
          </div>
          <div class="field">
            <span class="field-label">Colección:</span>
            <span class="field-value">${record.workDetails.collection}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Estado de Conservación</div>
          <div class="field">
            <span class="field-value">${record.conservationState}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Información del Receptor</div>
          <div class="field">
            <span class="field-label">Nombre:</span>
            <span class="field-value">${record.receiver.name}</span>
          </div>
          <div class="field">
            <span class="field-label">Cédula:</span>
            <span class="field-value">${record.receiver.idCard}</span>
          </div>
          <div class="field">
            <span class="field-label">Teléfono:</span>
            <span class="field-value">${record.receiver.phone}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Información del Entregador</div>
          <div class="field">
            <span class="field-label">Nombre:</span>
            <span class="field-value">${record.deliverer.name}</span>
          </div>
          <div class="field">
            <span class="field-label">Cédula:</span>
            <span class="field-value">${record.deliverer.idCard}</span>
          </div>
          <div class="field">
            <span class="field-label">Teléfono:</span>
            <span class="field-value">${record.deliverer.phone}</span>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
          <p>Sistema de Gestión de Bóveda - Museo Carmelo Fernández</p>
        </div>
      </body>
      </html>
    `;

    // Creación y descarga del archivo PDF usando la API del navegador
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimiento_${record.workName.replace(/\s+/g, '_')}_${record.date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para limpiar filtros - mantiene funcionalidad original
  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent mb-3">
            Historial de Movimientos
          </h1>
          <p className="text-blue-700 text-lg">Registre y consulte el historial de entradas y salidas de obras</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold' 
                : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-medium'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
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
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-3 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Plus className="h-6 w-6" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros - mantiene funcionalidad original */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-blue-900">Filtros de Búsqueda</h2>
            <button
              onClick={clearFilters}
              className="text-blue-700 hover:text-blue-900 text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-blue-800 mb-3">
                Tipo de Movimiento
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-800 mb-3">
                Fecha
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulario expandido - nueva estructura con todos los campos solicitados */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            {editingRecord ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
          </h2>
          <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-8">
            
            {/* Información básica del movimiento - sección original modificada */}
            <div className="border-b border-blue-200 pb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Obra *
                  </label>
                  <select
                    value={formData.workId}
                    onChange={(e) => handleWorkSelection(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    required
                  >
                    <option value="">Seleccionar obra...</option>
                    {works.map(work => (
                      <option key={work.inventoryNumber} value={work.inventoryNumber}>{work.name} - {work.artist}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Fecha del Movimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Tipo de Movimiento *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'salida' }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    required
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Motivo *
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Motivo del movimiento"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold text-blue-800 mb-3">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900 resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Detalles de la obra - nueva sección para información técnica */}
            <div className="border-b border-blue-200 pb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Detalles de la Obra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Autor *
                  </label>
                  <input
                    type="text"
                    value={formData.workDetails.author}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, author: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Nombre del autor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.workDetails.title}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, title: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Título de la obra"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Técnica *
                  </label>
                  <input
                    type="text"
                    value={formData.workDetails.technique}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, technique: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Ej: Óleo sobre lienzo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Medidas *
                  </label>
                  <input
                    type="text"
                    value={formData.workDetails.dimensions}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, dimensions: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Ej: 80 x 60 cm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Colección *
                  </label>
                  <input
                    type="text"
                    value={formData.workDetails.collection}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      workDetails: { ...prev.workDetails, collection: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Ej: Colección Permanente"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Estado de conservación - nueva sección crítica para movimientos */}
            <div className="border-b border-blue-200 pb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Estado de Conservación</h3>
              <div>
                <label className="block text-sm font-bold text-blue-800 mb-3">
                  Descripción del Estado *
                </label>
                <textarea
                  value={formData.conservationState}
                  onChange={(e) => setFormData(prev => ({ ...prev, conservationState: e.target.value }))}
                  rows={3}
                  className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900 resize-none"
                  placeholder="Describa el estado actual de conservación de la obra..."
                  required
                />
              </div>
            </div>

            {/* Información del receptor - nueva sección para trazabilidad */}
            <div className="border-b border-blue-200 pb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Información del Receptor</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.receiver.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, name: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    value={formData.receiver.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, idCard: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="12.345.678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.receiver.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receiver: { ...prev.receiver, phone: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="+58 212-555-0123"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información del entregador - nueva sección para responsabilidad institucional */}
            <div className="pb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Información del Entregador</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.deliverer.name}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, name: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    value={formData.deliverer.idCard}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, idCard: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="87.654.321"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.deliverer.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deliverer: { ...prev.deliverer, phone: e.target.value }
                    }))}
                    className="w-full px-5 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900"
                    placeholder="+58 212-555-0456"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción - mantiene funcionalidad original */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-blue-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
                className="px-6 py-3 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                {editingRecord ? 'Actualizar Movimiento' : 'Registrar Movimiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de consulta - estructura expandida para mostrar nueva información */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-200">
        <div className="p-8 border-b border-blue-200">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-blue-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra, autor, receptor, entregador o motivo..."
              className="w-full pl-14 pr-6 py-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50/30 text-blue-900 placeholder-blue-600 text-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-100 to-blue-50">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Obra
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Receptor
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Entregador
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-blue-900 text-lg">{record.workDetails.title}</p>
                      <p className="text-sm text-blue-600 font-medium">Por {record.workDetails.author}</p>
                      <p className="text-xs text-blue-500 mt-1">{record.workDetails.technique}</p>
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
                  <td className="px-8 py-6 text-blue-700 font-medium">
                    {new Date(record.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-semibold text-blue-900">{record.receiver.name}</p>
                      <p className="text-sm text-blue-600">CI: {record.receiver.idCard}</p>
                      <p className="text-sm text-blue-600">{record.receiver.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-semibold text-blue-900">{record.deliverer.name}</p>
                      <p className="text-sm text-blue-600">CI: {record.deliverer.idCard}</p>
                      <p className="text-sm text-blue-600">{record.deliverer.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón para consultar/ver detalles */}
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-3 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Botón para editar */}
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Editar movimiento"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón para eliminar */}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      {/* Botón para generar PDF */}
                      <button
                        onClick={() => generatePDF(record)}
                        className="p-3 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-110"
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

        {/* Mensaje cuando no hay registros - mantiene funcionalidad original */}
        {filteredRecords.length === 0 && (
          <div className="p-12 text-center text-blue-600 font-medium text-lg">
            {searchTerm || typeFilter !== 'all' || dateFilter ? 'No se encontraron movimientos que coincidan con los filtros' : 'No hay movimientos registrados'}
          </div>
        )}
      </div>

      {/* Modal para ver detalles del movimiento */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-blue-900">Detalles del Movimiento</h2>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-2 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Información general */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-blue-700">Fecha:</p>
                    <p className="text-blue-900">{new Date(viewingRecord.date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700">Tipo:</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      viewingRecord.type === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingRecord.type === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold text-blue-700">Motivo:</p>
                    <p className="text-blue-900">{viewingRecord.reason}</p>
                  </div>
                  {viewingRecord.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-bold text-blue-700">Notas:</p>
                      <p className="text-blue-900">{viewingRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la obra */}
              <div className="bg-gradient-to-br from-blue-100 to-white rounded-2xl p-6 border border-blue-300">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Detalles de la Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-blue-700">Título:</p>
                    <p className="text-blue-900">{viewingRecord.workDetails.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700">Autor:</p>
                    <p className="text-blue-900">{viewingRecord.workDetails.author}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700">Técnica:</p>
                    <p className="text-blue-900">{viewingRecord.workDetails.technique}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700">Medidas:</p>
                    <p className="text-blue-900">{viewingRecord.workDetails.dimensions}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold text-blue-700">Colección:</p>
                    <p className="text-blue-900">{viewingRecord.workDetails.collection}</p>
                  </div>
                </div>
              </div>

              {/* Estado de conservación */}
              <div className="bg-gradient-to-br from-blue-200 to-white rounded-2xl p-6 border border-blue-400">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Estado de Conservación</h3>
                <p className="text-blue-900">{viewingRecord.conservationState}</p>
              </div>

              {/* Información del receptor y entregador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-300 to-white rounded-2xl p-6 border border-blue-500">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Receptor</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-blue-700">Nombre:</p>
                      <p className="text-blue-900">{viewingRecord.receiver.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-700">Cédula:</p>
                      <p className="text-blue-900">{viewingRecord.receiver.idCard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-700">Teléfono:</p>
                      <p className="text-blue-900">{viewingRecord.receiver.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-400 to-white rounded-2xl p-6 border border-blue-600">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Entregador</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-bold text-blue-700">Nombre:</p>
                      <p className="text-blue-900">{viewingRecord.deliverer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-700">Cédula:</p>
                      <p className="text-blue-900">{viewingRecord.deliverer.idCard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-700">Teléfono:</p>
                      <p className="text-blue-900">{viewingRecord.deliverer.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción en el modal */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-blue-200">
                <button
                  onClick={() => generatePDF(viewingRecord)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
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

export default MovementHistory;