// Importa React para poder usar JSX y componentes
import React from 'react';
// Importa los íconos que se usan en la interfaz de detalles de la obra
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User } from 'lucide-react';
// Importa el tipo Work para tipar los datos de la obra
import { Work } from '../types';


// Define la interfaz de las props que recibirá el componente WorkDetails.
// work: Objeto con los datos de la obra.
// onClose: Función que se ejecuta al cerrar el detalle.
// onEdit: Función que se ejecuta al editar la obra.
// onDelete: Función que se ejecuta al eliminar la obra.
interface WorkDetailsProps {
  work: Work;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Componente que muestra los detalles de una obra
const WorkDetails: React.FC<WorkDetailsProps> = ({ work, onClose, onEdit, onDelete }) => {
  // Función interna para manejar la eliminación de la obra.
  // Muestra un confirm() para pedir confirmación al usuario antes de eliminar.
  const handleDelete = () => {
    if (confirm('¿Está seguro de que desea eliminar esta obra?')) {
      onDelete();
    }
  };
  // Renderiza el componente con la información de la obra y botones de acción.
  return (
    <div className="p-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
          {/* Encabezado con botones de volver, editar y eliminar */}
          <div className="p-8 border-b border-amber-200">
            <div className="flex items-center justify-between">
              {/* Botón para volver al listado */}
              <button
                onClick={onClose}
                className="flex items-center space-x-3 text-amber-700 hover:text-amber-900 transition-all duration-200 font-semibold"
              >
                <ArrowLeft className="h-6 w-6" />
                <span>Volver</span>
              </button>
              <div className="flex items-center space-x-3">
                {/* Botón para editar la obra */}
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>
                {/* Botón para eliminar la obra */}
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cuerpo principal con la información de la obra */}
          <div className="p-8 space-y-8">
            <div>
              {/* Título de la obra */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-4">{work.name}</h1>
              {/* Información básica: artista, fecha, ubicación */}
              <div className="flex items-center space-x-8 text-amber-700">
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6" />
                  <span className="font-semibold text-lg">{work.artist}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6" />
                  <span className="font-medium">Realizada: {new Date(work.realizationDate).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-6 w-6" />
                  <span className="font-medium">{work.physicalLocation}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sección de descripción de la obra */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-amber-900 mb-6">Descripción</h2>
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 border border-amber-200">
                  <p className="text-amber-800 leading-relaxed text-lg">{work.description}</p>
                </div>
              </div>

              {/* Sección lateral con información general y ubicación */}
              <div className="space-y-6">
                {/* Información general de fechas */}
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-6 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-6 text-lg">Información General</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-bold text-amber-700">Fecha de Realización</p>
                      <p className="text-amber-900 font-semibold">{new Date(work.realizationDate).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-700">Fecha de Ingreso</p>
                      <p className="text-amber-900 font-semibold">{new Date(work.museumEntryDate).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </div>

                {/* Información de ubicación física */}
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl p-6 border border-yellow-200">
                  <h3 className="font-bold text-amber-900 mb-4 text-lg">Ubicación</h3>
                  <p className="text-amber-800 font-semibold">{work.physicalLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para su uso en otras partes de la aplicación
export default WorkDetails;