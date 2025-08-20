// VISTA DE GESTIÓN DE OBRAS
// Vista de presentación para la administración de obras del museo
// Maneja la visualización de la lista, formularios y detalles de obras

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileDown } from 'lucide-react';
import { Work } from '../models';
import WorkForm from '../components/WorkForm';
import WorkDetails from '../components/WorkDetails';
import jsPDF from 'jspdf'; 
import logoSrc from '/logoblanco_negro.jpg';

// Define las propiedades que recibe la vista de gestión de obras
interface WorksManagementViewProps {
  works: Work[]; // Lista de obras del museo
  onUpdateWorks: (works: Work[]) => void; // Función para actualizar la lista de obras
}

// Componente de vista para la gestión de obras
const WorksManagementView: React.FC<WorksManagementViewProps> = ({ works, onUpdateWorks }) => {
  // Estados locales para controlar la interfaz de usuario
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario
  const [editingWork, setEditingWork] = useState<Work | null>(null); // Obra en modo edición
  const [viewingWork, setViewingWork] = useState<Work | null>(null); // Obra en vista detallada
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda

  // Filtra las obras según el término de búsqueda
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
      alert('Ya existe una obra con este ID. Por favor, use un ID diferente.');
      return;
    }

    // Crea la nueva obra y actualiza la lista
    const newWork: Work = workData as Work;
    onUpdateWorks([...works, newWork]);
    setShowForm(false);
  };

  // Maneja la edición de una obra existente
  const handleEditWork = (workData: Partial<Work>) => {
    if (editingWork) {
      // Verifica que el ID no esté duplicado en otra obra
      const existingWork = works.find(work => work.id === (workData as any).id && work.id !== editingWork.id);
      if (existingWork) {
        alert('Ya existe una obra con este ID. Por favor, use un ID diferente.');
        return;
      }

      // Actualiza la obra en la lista
      const updatedWorks = works.map(work =>
        work.id === editingWork.id ? workData as Work : work
      );
      onUpdateWorks(updatedWorks);
      setEditingWork(null);
    }
  };

  // Maneja la eliminación de una obra
  const handleDeleteWork = (workId: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta obra?')) {
      const updatedWorks = works.filter(work => work.id !== workId);
      onUpdateWorks(updatedWorks);
    }
  };

  // Renderizado condicional: formulario de nueva obra
  if (showForm) {
    return (
      <WorkForm
        onSubmit={handleAddWork}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  // Renderizado condicional: formulario de edición
  if (editingWork) {
    return (
      <WorkForm
        work={editingWork}
        onSubmit={handleEditWork}
        onCancel={() => setEditingWork(null)}
      />
    );
  }

  // Renderizado condicional: vista de detalles
  if (viewingWork) {
    return (
      <WorkDetails
        work={viewingWork}
        onClose={() => setViewingWork(null)}
        onEdit={() => {
          setEditingWork(viewingWork);
          setViewingWork(null);
        }}
        onDelete={() => {
          handleDeleteWork(viewingWork.id);
          setViewingWork(null);
        }}
      />
    );
  }

  // Renderizado principal: lista de obras
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botón de agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Gestión de Obras
          </h1>
          <p className="text-[#192d71] text-lg">Administre las obras de la colección del museo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
        >
          <Plus className="h-6 w-6" />
          <span>Agregar Obra</span>
        </button>
      </div>

      {/* Contenedor principal de la tabla */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Barra de búsqueda */}
        <div className="p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-[#192d71]" />
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
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">ID</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Artista</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Ubicación</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha Ingreso</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea cada obra filtrada */}
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <span className="font-mono text-sm bg-[#192d71]/10 px-2 py-1 rounded text-[#192d71]">
                      #{work.id}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{work.name}</p>
                      <p className="text-sm text-[#192d71]/70 font-medium">
                        Realizada: {work.realizationDate ?? 'Sin fecha'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[#192d71] font-semibold">{work.artist}</td>
                  <td className="px-8 py-6 text-[#192d71]/80">{work.storageLocation}</td>
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {work.collection?.entryDate ?? 'Sin fecha'}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón ver detalles */}
                      <button
                        onClick={() => setViewingWork(work)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => setEditingWork(work)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón eliminar */}
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

        {/* Mensaje cuando no hay obras */}
        {filteredWorks.length === 0 && (
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas'}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorksManagementView;