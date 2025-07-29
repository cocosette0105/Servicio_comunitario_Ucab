import React, { useState } from 'react'; // Importa React y el hook useState para manejar estados locales.
import { Plus, Search, Calendar, ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown } from 'lucide-react'; // Importa íconos de la librería lucide-react para usar en la interfaz.
import { MovementRecord, Work } from '../types'; // Importa los tipos MovementRecord y Work para tipar props y datos.

interface MovementHistoryProps { // Define las propiedades que recibe el componente MovementHistory.
  records: MovementRecord[]; // Lista de registros de movimientos.
  works: Work[]; // Lista de obras disponibles.
  onUpdateRecords: (records: MovementRecord[]) => void; // Función para actualizar los registros de movimientos.
}

interface MovementFormData { // Define la estructura de los datos del formulario de movimiento.
  workId: string; // ID de la obra seleccionada.
  date: string; // Fecha del movimiento.
  type: 'entrada' | 'salida'; // Tipo de movimiento (entrada o salida).
  reason: string; // Motivo del movimiento.
  responsible: string; // Nombre del responsable del movimiento.
  notes: string; // Notas adicionales sobre el movimiento.
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ records, works, onUpdateRecords }) => { // Componente funcional principal para el historial de movimientos.
  const [showForm, setShowForm] = useState(false); // Estado para mostrar/ocultar el formulario de registro.
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda.
  const [showFilters, setShowFilters] = useState(false); // Estado para mostrar/ocultar los filtros.
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all'); // Estado para filtrar por tipo de movimiento.
  const [dateFilter, setDateFilter] = useState(''); // Estado para filtrar por fecha.
  const [formData, setFormData] = useState<MovementFormData>({ // Estado para los datos del formulario de registro.
    workId: '',
    date: '',
    type: 'entrada',
    reason: '',
    responsible: '',
    notes: ''
  });

  const filteredRecords = records.filter(record => { // Filtra los registros según los filtros y búsqueda.
    const matchesSearch = record.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesDate = !dateFilter || record.date.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const handleSubmit = (e: React.FormEvent) => { // Maneja el envío del formulario de registro de movimiento.
    e.preventDefault(); // Previene el comportamiento por defecto del formulario.
    
     // Validación de fecha - no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0];
    if (formData.date > today) {
      alert('La fecha del movimiento no puede ser posterior a la fecha actual');
      return;
    }
    
    const selectedWork = works.find(work => work.id === formData.workId); // Busca la obra seleccionada por ID.
    if (!selectedWork) return; // Si no se encuentra la obra, no registra nada.

    const newRecord: MovementRecord = { // Crea un nuevo registro de movimiento.
      id: Date.now().toString(), // Genera un ID único usando la fecha actual.
      workId: formData.workId,
      workName: selectedWork.name,
      date: formData.date,
      type: formData.type,
      reason: formData.reason,
      responsible: formData.responsible,
      notes: formData.notes
    };

    onUpdateRecords([...records, newRecord]); // Actualiza la lista de registros agregando el nuevo.
    setFormData({ // Reinicia el formulario.
      workId: '',
      date: '',
      type: 'entrada',
      reason: '',
      responsible: '',
      notes: ''
    });
    setShowForm(false); // Oculta el formulario después de registrar.
  };

  const clearFilters = () => { // Limpia todos los filtros de búsqueda.
    setTypeFilter('all');
    setDateFilter('');
    setSearchTerm('');
  };

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-yellow-50 to-white min-h-screen">
      {/* Contenedor principal con fondo degradado y espaciado */}
      <div className="flex items-center justify-between">
        {/* Encabezado y botones de acción */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-3">
            Historial de Movimientos
          </h1>
          <p className="text-amber-700 text-lg">Registre y consulte el historial de entradas y salidas de obras</p>
        </div>
        <div className="flex items-center space-x-3">
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
            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} /> {/* Ícono desplegable */}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Plus className="h-6 w-6" /> {/* Ícono de agregar */}
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
          {/* Sección de filtros de búsqueda */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-900">Filtros de Búsqueda</h2>
            <button
              onClick={clearFilters}
              className="text-amber-700 hover:text-amber-900 text-sm font-semibold"
            >
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Tipo de Movimiento
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Fecha
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
          {/* Formulario para registrar nuevo movimiento */}
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Registrar Nuevo Movimiento</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Obra *
              </label>
              <select
                value={formData.workId}
                onChange={(e) => setFormData(prev => ({ ...prev, workId: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              >
                <option value="">Seleccionar obra...</option>
                {works.map(work => (
                  <option key={work.id} value={work.id}>{work.name} - {work.artist}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Fecha del Movimiento *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Tipo de Movimiento *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'salida' }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Responsable *
              </label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                placeholder="Nombre del responsable"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Motivo *
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                placeholder="Motivo del movimiento"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                Registrar Movimiento
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
        {/* Tabla de registros de movimientos */}
        <div className="p-8 border-b border-amber-200">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-amber-600" /> {/* Ícono de búsqueda */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por obra, responsable o motivo..."
              className="w-full pl-14 pr-6 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600 text-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-100 to-amber-50">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Obra
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Responsable
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <p className="font-bold text-amber-900 text-lg">{record.workName}</p>
                    {record.notes && (
                      <p className="text-sm text-amber-600 font-medium mt-1">{record.notes}</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {record.type === 'entrada' ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" /> // Ícono para entrada.
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" /> // Ícono para salida.
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        record.type === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'entrada' ? 'Entrada' : 'Salida'} {/* Etiqueta del tipo de movimiento. */}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-amber-700 font-medium">
                    {new Date(record.date).toLocaleDateString('es-ES')} {/* Muestra la fecha en formato local español. */}
                  </td>
                  <td className="px-8 py-6 text-amber-900 font-medium">{record.reason}</td>
                  <td className="px-8 py-6 text-amber-700">{record.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center text-amber-600 font-medium text-lg">
            {searchTerm || typeFilter !== 'all' || dateFilter ? 'No se encontraron movimientos que coincidan con los filtros' : 'No hay movimientos registrados'}
            {/* Muestra mensaje si no hay registros que coincidan con los filtros o si no hay registros */}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovementHistory; // Exporta el componente para su uso