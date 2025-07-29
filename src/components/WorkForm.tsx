// Importa React y el hook useState para manejar el estado del formulario
import React, { useState } from 'react';
// Importa los íconos de guardar y cancelar
import { Save, X } from 'lucide-react';
// Importa el tipo Work para tipar los datos de la obra
import { Work } from '../types';

// Define las props que recibe el formulario: la obra a editar (opcional), función para enviar datos y función para cancelar
interface WorkFormProps {
  work?: Work;
  onSubmit: (work: Omit<Work, 'id'>) => void;
  onCancel: () => void;
}

// Componente de formulario para agregar o editar una obra
const WorkForm: React.FC<WorkFormProps> = ({ work, onSubmit, onCancel }) => {
  // Estado local para los datos del formulario, inicializado con los datos de la obra si existe (modo edición)
  const [formData, setFormData] = useState({
    id: work?.id || '', // Campo para el ID de la obra
    name: work?.name || '', // Nombre de la obra
    realizationDate: work?.realizationDate || '', // Fecha de realización
    artist: work?.artist || '', // Artista
    museumEntryDate: work?.museumEntryDate || '', // Fecha de ingreso al museo
    description: work?.description || '', // Descripción de la obra
    observations: work?.observations || '', // Observaciones adicionales
    physicalLocation: work?.physicalLocation || '' // Ubicación física
  });

  // Maneja el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    // Validación de fechas: no permitir fechas futuras
    const today = new Date().toISOString().split('T')[0]; // Obtiene la fecha actual en formato YYYY-MM-DD
    if (formData.realizationDate > today) {
      // Alerta si la fecha de realización es futura
      alert('La fecha de realización no puede ser posterior a la fecha actual');
      return;
    }
    if (formData.museumEntryDate > today) {
      // Alerta si la fecha de ingreso es futura
      alert('La fecha de ingreso al museo no puede ser posterior a la fecha actual');
      return;
    }
    
    // Llama a la función de envío con los datos del formulario
    onSubmit(formData);
  };

  // Maneja los cambios en los campos del formulario
  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Actualiza el estado del campo modificado
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Renderizado del formulario
  return (
    <div className="p-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-10">
          {/* Encabezado del formulario */}
          <div className="flex items-center justify-between mb-8">
            <div>
              {/* Título dinámico según si es edición o creación */}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-2">
                {work ? 'Editar Obra' : 'Agregar Nueva Obra'}
              </h1>
              {/* Descripción dinámica */}
              <p className="text-amber-700 text-lg">
                {work ? 'Modifique los datos de la obra' : 'Complete la información de la nueva obra'}
              </p>
            </div>
          </div>

          {/* Formulario principal */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo para el ID de la obra */}
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-3">
                  ID de la Obra *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={handleChange('id')}
                  className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                  placeholder="Ej: OBR001"
                  required
                />
              </div>

              {/* Campo para el nombre de la obra */}
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-3">
                  Nombre de la Obra *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleChange('name')}
                  className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                  placeholder="Ej: La Dama de Azul"
                  required
                />
              </div>

              {/* Campo para el artista */}
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-3">
                  Artista *
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={handleChange('artist')}
                  className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                  placeholder="Ej: Carmen Vásquez"
                  required
                />
              </div>

              {/* Campo para la fecha de realización */}
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-3">
                  Fecha de Realización *
                </label>
                <input
                  type="date"
                  value={formData.realizationDate}
                  onChange={handleChange('realizationDate')}
                  className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                  required
                />
              </div>

              {/* Campo para la fecha de ingreso al museo */}
              <div>
                <label className="block text-sm font-bold text-amber-800 mb-3">
                  Fecha de Ingreso al Museo *
                </label>
                <input
                  type="date"
                  value={formData.museumEntryDate}
                  onChange={handleChange('museumEntryDate')}
                  className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                  required
                />
              </div>
            </div>

            {/* Campo para la ubicación física */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Ubicación Física *
              </label>
              <input
                type="text"
                value={formData.physicalLocation}
                onChange={handleChange('physicalLocation')}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600"
                placeholder="Ej: Sala A - Estante 1 - Posición 3"
                required
              />
            </div>

            {/* Campo para la descripción de la obra */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={handleChange('description')}
                rows={4}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600 resize-none"
                placeholder="Descripción detallada de la obra..."
                required
              />
            </div>

            {/* Campo para observaciones adicionales */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Observaciones
              </label>
              <textarea
                value={formData.observations}
                onChange={handleChange('observations')}
                rows={3}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600 resize-none"
                placeholder="Observaciones adicionales sobre la obra..."
              />
            </div>

            {/* Botones de acción: cancelar y guardar/actualizar */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t border-amber-200">
              {/* Botón para cancelar y cerrar el formulario */}
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center space-x-2 px-8 py-4 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition-all duration-200 font-semibold"
              >
                <X className="h-5 w-5" />
                <span>Cancelar</span>
              </button>
              {/* Botón para guardar o actualizar la obra */}
              <button
                type="submit"
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                <Save className="h-5 w-5" />
                <span>{work ? 'Actualizar' : 'Guardar'} Obra</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para su uso en otros módulos
export default WorkForm;