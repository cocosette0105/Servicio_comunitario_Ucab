// VISTA DE GESTIÓN DE OBRAS
// frontend/src/views/WorksManagementView.tsx

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileDown, X as XIcon } from 'lucide-react';
import { Work, User } from '../models';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { PDFUtils } from '../utils/pdfUtils';
import WorkForm from '../components/WorkForm';
import WorkDetails from '../components/WorkDetails';
import { saveWork, deleteWork } from '../services/workService';

interface WorksManagementViewProps {
  user: User;
  works: Work[];
  onUpdateWorks: () => Promise<void>;
}

const WorksManagementView: React.FC<WorksManagementViewProps> = ({ user, works, onUpdateWorks }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [viewingWork, setViewingWork] = useState<Work | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workForPdf, setWorkForPdf] = useState<Work | null>(null);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleExportClick = (work: Work) => {
    // 🔥 CORRECCIÓN: Obtener todas las imágenes sin duplicar
    const allImageUrls = work.imageUrls && work.imageUrls.length > 0 
      ? work.imageUrls 
      : work.photoUrl 
      ? [work.photoUrl] 
      : [];
    
    // Filtrar valores nulos o vacíos y crear URLs completas
    const validImageUrls = allImageUrls
      .filter(Boolean)
      .map(url => `${VITE_API_BASE_URL}${url}`);
    
    // Eliminar duplicados usando Set
    const uniqueImageUrls = [...new Set(validImageUrls)];
    
    if (uniqueImageUrls.length === 0) {
      alert("Esta obra no tiene imágenes para generar un reporte.");
      return;
    }
    
    if (uniqueImageUrls.length === 1) {
      PDFUtils.generateWorkInventoryPDF(work, uniqueImageUrls[0]);
    } else {
      setWorkForPdf(work);
    }
  };

  const handleExportWithSelectedImage = (imageUrl: string) => {
    if (workForPdf) {
      PDFUtils.generateWorkInventoryPDF(workForPdf, imageUrl);
    }
    setWorkForPdf(null);
  };

  const canCreateWork = user.privileges.includes('crear_obra');
  const canUpdateWork = user.privileges.includes('actualizar_obra');
  const canDeleteWork = user.privileges.includes('eliminar_obra');
  const canReadWork = user.privileges.includes('leer_obra');

  const filteredWorks = works.filter(work => {
    const term = searchTerm.toLowerCase().trim();
    return (
      work.id.toString().includes(term) ||
      (work.name ?? '').toLowerCase().includes(term) ||
      (work.inventoryNumber ?? '').toLowerCase().includes(term) ||
      (work.artist ?? '').toLowerCase().includes(term) ||
      (work.storageLocation ?? '').toLowerCase().includes(term)
    );
  });

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedWorks,
    goToPage
  } = usePagination(filteredWorks, {
    itemsPerPage: 8,
    initialPage: 1
  });

   const handleSaveWork = async (formData: FormData) => {
    if ((editingWork && !canUpdateWork) || (!editingWork && !canCreateWork)) {
      setError("No tienes permiso para realizar esta acción.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const workId = editingWork ? editingWork.id : undefined;
      await saveWork(formData, workId);
      await onUpdateWorks(); 
      setShowForm(false);
      setEditingWork(null);
    } catch (err) {
      console.error("Error al guardar la obra:", err);
      setError("No se pudo guardar la obra. Por favor, intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

 const handleDeleteWork = async (workId: string) => {
    if (!canDeleteWork) return;
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta obra?')) return;
    try {
        await deleteWork(workId);
        await onUpdateWorks(); 
        if (viewingWork?.id === workId) {
          setViewingWork(null);
        }
    } catch (err) {
        console.error('Error al eliminar la obra:', err);
        setError('No se pudo eliminar la obra.');
    }
  };

  if (!canReadWork) {
    return (
      <div className="p-4 sm:p-8 text-center text-red-700 bg-red-100 rounded-xl m-4 sm:m-8">
        <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
        <p>No tienes los privilegios necesarios para ver esta información. Contacta al administrador del sistema.</p>
      </div>
    );
  }

  // 🔥 CORRECCIÓN: Función para obtener imágenes únicas de una obra
  const getUniqueWorkImages = (work: Work) => {
    const allUrls = work.imageUrls && work.imageUrls.length > 0 
      ? work.imageUrls 
      : work.photoUrl 
      ? [work.photoUrl] 
      : [];
    
    return [...new Set(allUrls.filter(Boolean).map(url => `${VITE_API_BASE_URL}${url}`))];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      
      {workForPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-[#192d71]">Seleccione una Imagen para el Reporte</h3>
              <button onClick={() => setWorkForPdf(null)} className="p-2 rounded-full hover:bg-gray-200">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto">
              {getUniqueWorkImages(workForPdf).map((fullUrl, index) => (
                <div key={index} onClick={() => handleExportWithSelectedImage(fullUrl)} className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden transition-all">
                  <img src={fullUrl} alt={`Opción ${index + 1}`} className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {(showForm || editingWork) && (
        <WorkForm
          work={editingWork || undefined}
          onSubmit={handleSaveWork} 
          onCancel={() => {
            setShowForm(false);
            setEditingWork(null);
          }}
        />
      )}

      {viewingWork && (
        <WorkDetails
          work={viewingWork}
          onClose={() => setViewingWork(null)}
          onEdit={canUpdateWork ? () => { setEditingWork(viewingWork); setViewingWork(null); } : () => {}}
          onDelete={canDeleteWork ? () => handleDeleteWork(viewingWork.id) : () => {}}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Gestión de Obras
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Administre las obras de la colección del museo</p>
        </div>
        {canCreateWork && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Agregar Obra</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, artista, MCF o ubicación..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Num</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Código</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Obra</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden sm:table-cell">Artista</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Ubicación</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Fecha Ingreso</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {paginatedWorks.map(work => (
                <tr key={work.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <span className="font-mono text-xs sm:text-sm bg-[#192d71]/10 px-2 py-1 rounded text-[#192d71]">{work.id}</span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <span className="font-mono text-xs sm:text-sm bg-[#192d71]/10 px-2 py-1 rounded text-[#192d71]">{work.inventoryNumber ?? 'Sin código'}</span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-sm sm:text-base lg:text-lg">{work.name ?? 'Sin título'}</p>
                      <p className="text-xs sm:text-sm text-[#192d71]/70 font-medium">Realizada: {work.realizationDate ?? 'Sin fecha'}</p>
                      <div className="sm:hidden mt-1 space-y-1">
                        <p className="text-xs text-[#192d71]/80 font-medium">Por: {work.artist ?? 'Desconocido'}</p>
                        <p className="text-xs text-[#192d71]/60">{work.storageLocation ?? 'Sin ubicación'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71] font-semibold hidden sm:table-cell">{work.artist ?? 'Desconocido'}</td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 hidden lg:table-cell">{work.storageLocation ?? 'Sin ubicación'}</td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 font-medium hidden lg:table-cell">{work.collection?.entryDate ?? 'Sin fecha'}</td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                      <button onClick={() => setViewingWork(work)} className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {canUpdateWork && (
                        <button onClick={() => setEditingWork(work)} className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110">
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      {canDeleteWork && (
                        <button onClick={() => handleDeleteWork(work.id)} className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      <button onClick={() => handleExportClick(work)} className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110" title="Descargar Ficha PDF">
                        <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWorks.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas'}
          </div>
        )}

        {filteredWorks.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredWorks.length}
            itemsPerPage={8}
            onPageChange={goToPage}
            className="border-t border-[#192d71]/20"
          />
        )}
      </div>
    </div>
  );
};

export default WorksManagementView;