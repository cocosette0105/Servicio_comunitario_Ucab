// Importa React y el hook useState para manejar el estado local del componente
import React, { useState } from 'react';
// Importa los íconos que se usarán en los botones de la interfaz
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
// Importa el tipo Work para tipar los datos de las obras
import { Work } from '../types';
// Importa el formulario para agregar o editar obras
import WorkForm from './WorkForm';
// Importa el componente para ver detalles de una obra
import WorkDetails from './WorkDetails';

// Define las props que recibe el componente: un arreglo de obras y una función para actualizarlo
interface WorksManagementProps {
  works: Work[];
  onUpdateWorks: (works: Work[]) => void;
}

// Componente principal para la gestión de obras
const WorksManagement: React.FC<WorksManagementProps> = ({ works, onUpdateWorks }) => {
  // Estado para mostrar u ocultar el formulario de agregar obra
  const [showForm, setShowForm] = useState(false);
  // Estado para almacenar la obra que se está editando (si aplica)
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  // Estado para almacenar la obra que se está visualizando en detalle
  const [viewingWork, setViewingWork] = useState<Work | null>(null);
  // Estado para el término de búsqueda ingresado por el usuario
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra las obras según el término de búsqueda (por nombre, artista o ubicación)
  const filteredWorks = works.filter(work =>
    work.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
   (work.storageLocation ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Maneja la adición de una nueva obra
  const handleAddWork = (workData: Partial<Work>) => {

    // Verifica si ya existe una obra con el mismo ID
    const existingWork = works.find(work => work.id === (workData as any).id);
    if (existingWork) {
      // Muestra una alerta si el ID ya existe
      alert('Ya existe una obra con este ID. Por favor, use un ID diferente.');
      return;
    }

    // Crea el nuevo objeto de obra y lo agrega al listado
    const newWork: Work = workData as Work;
    onUpdateWorks([...works, newWork]);
    setShowForm(false); // Oculta el formulario después de agregar
  };

  // Maneja la edición de una obra existente
  const handleEditWork = (workData: Partial<Work>) => {
    if (editingWork) {
      // Verifica si el nuevo ID ya existe en otra obra distinta a la que se edita
      const existingWork = works.find(work => work.id === (workData as any).id && work.id !== editingWork.id);
      if (existingWork) {
        // Muestra una alerta si el ID ya existe en otra obra
        alert('Ya existe una obra con este ID. Por favor, use un ID diferente.');
        return;
      }

      // Actualiza la obra editada en el listado
      const updatedWorks = works.map(work =>
        work.id === editingWork.id
          ? workData as Work
          : work
      );
      onUpdateWorks(updatedWorks);
      setEditingWork(null); // Sale del modo edición
    }
  };

  // Maneja la eliminación de una obra
  const handleDeleteWork = (workId: string) => {
    // Solicita confirmación antes de eliminar
    if (confirm('¿Está seguro de que desea eliminar esta obra?')) {
      // Filtra la obra eliminada y actualiza el listado
      const updatedWorks = works.filter(work => work.id !== workId);
      onUpdateWorks(updatedWorks);
    }
  };

  // Si está activo el formulario de agregar obra, lo muestra y retorna
  if (showForm) {
    return (
      <WorkForm
        onSubmit={handleAddWork} // Función para agregar obra
        onCancel={() => setShowForm(false)} // Cancela y oculta el formulario
      />
    );
  }

  // Si está activo el modo edición, muestra el formulario con los datos de la obra a editar
  if (editingWork) {
    return (
      <WorkForm
        work={editingWork} // Pasa la obra a editar
        onSubmit={handleEditWork} // Función para guardar cambios
        onCancel={() => setEditingWork(null)} // Cancela la edición
      />
    );
  }

  // Si se está visualizando una obra, muestra el componente de detalles
  if (viewingWork) {
    return (
      <WorkDetails
        work={viewingWork} // Obra a mostrar
        onClose={() => setViewingWork(null)} // Cierra la vista de detalles
        onEdit={() => {
          setEditingWork(viewingWork); // Activa el modo edición para la obra
          setViewingWork(null); // Oculta la vista de detalles
        }}
        onDelete={() => {
          handleDeleteWork(viewingWork.id); // Elimina la obra
          setViewingWork(null); // Oculta la vista de detalles
        }}
      />
    );
  }

  // Renderizado principal: tabla de obras y controles
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado y botón para agregar obra */}
      <div className="flex items-center justify-between">
        <div>
          {/* Título principal */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">Gestión de Obras</h1>
          {/* Descripción */}
          <p className="text-[#192d71] text-lg">Administre las obras de la colección del museo</p>
        </div>
        {/* Botón para mostrar el formulario de agregar obra */}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
        >
          <Plus className="h-6 w-6" />
          <span>Agregar Obra</span>
        </button>
      </div>

      {/* Contenedor de la tabla y búsqueda */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Barra de búsqueda */}
        <div className="p-8 border-b border-[#192d71]/20">
          <div className="relative">
            {/* Ícono de búsqueda */}
            <Search className="absolute left-4 top-4 h-6 w-6 text-[#192d71]" />
            {/* Input para buscar obras */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, artista o ubicación..."
              className="w-full pl-14 pr-6 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-lg"
            />
          </div>
        </div>

        {/* Tabla de obras */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                {/* Encabezados de la tabla */}
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  ID
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  Obra
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  Artista
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  Fecha Ingreso
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea y muestra cada obra filtrada en una fila */}
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  {/* Columna ID */}
                  <td className="px-8 py-6">
                    <span className="font-mono text-sm bg-[#192d71]/10 px-2 py-1 rounded text-[#192d71]">
                      #{work.id}
                    </span>
                  </td>
                  {/* Columna nombre de la obra y fecha de realización */}
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{work.name}</p>
                      <p className="text-sm text-[#192d71]/70 font-medium">
                        {/* Muestra la fecha de realización formateada */}
                        Realizada: {work.realizationDate ??'Sin fecha' }
                      </p>
                    </div>
                  </td>
                  {/* Columna artista */}
                  <td className="px-8 py-6 text-[#192d71] font-semibold">{work.artist}</td>
                  {/* Columna ubicación física */}
                  <td className="px-8 py-6 text-[#192d71]/80">{work.storageLocation}</td>
                  {/* Columna fecha de ingreso al museo */}
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {work.collection?.entryDate ?? 'Sin fecha'}
                  </td>
                  {/* Columna de acciones (ver, editar, eliminar) */}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón para ver detalles de la obra */}
                      <button
                        onClick={() => setViewingWork(work)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Botón para editar la obra */}
                      <button
                        onClick={() => setEditingWork(work)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón para eliminar la obra */}
                      <button
                        onClick={() => handleDeleteWork(work.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje si no hay obras que mostrar */}
        {filteredWorks.length === 0 && (
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas'}
          </div>
        )}
      </div>
    </div>
  );
};

// Exporta el componente para su uso en otras partes de la aplicación
export default WorksManagement;