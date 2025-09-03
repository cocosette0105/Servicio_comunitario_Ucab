// VISTA DE GESTIÓN DE OBRAS
// frontend/src/views/WorksManagementView.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileDown } from 'lucide-react';
import { Work, User } from '../models'; // Importamos el tipo User
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { PDFUtils } from '../utils/pdfUtils';
import WorkForm from '../components/WorkForm';
import WorkDetails from '../components/WorkDetails';
import { getWorks, saveWork, deleteWork } from '../services/workService';

// Definimos las props que recibirá el componente
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

  // Lógica de privilegios
  const canCreateWork = user.privileges.includes('crear_obra');
  const canUpdateWork = user.privileges.includes('actualizar_obra');
  const canDeleteWork = user.privileges.includes('eliminar_obra');
  const canReadWork = user.privileges.includes('leer_obra');

/*  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const data = await getWorks();
        const mappedWorks: Work[] = data.map((obra: any) => ({
          id: obra.obr_id,
          name: obra.obr_titulo ?? '',
          inventoryNumber: obra.obr_mcf ?? '',
          artist: obra.artist_name ?? 'Desconocido',
          storageLocation: obra.location_name ?? 'Sin ubicación',
          realizationDate: obra.obr_fecha_realizacion ?? '',
          collection: { entryDate: obra.obr_fecha_ingreso ?? '' },
          classification: obra.classification_name ?? '',
          technique: obra.technique ?? '',
          materials: obra.materials ?? '',
          dimensions: {
            height: obra.obr_alto_cm ?? '',
            width: obra.obr_ancho_cm ?? '',
            depth: obra.obr_profundidad_cm ?? '',
            diameter: obra.obr_diametro_cm ?? ''
          },
          description: obra.obr_descripcion_formal ?? '',
          signatureDetails: obra.obr_detalles_firma ?? '',
          observations: obra.obr_observaciones ?? '',
          photoUrl: obra.obr_url_foto ?? '',
          conservationState: obra.obr_estado_conservacion ?? '',
          technicalData: obra.obr_datos_tecnicos ?? '',
          references: obra.obr_referencias ?? '',
          responsibleEntity: obra.obr_entidad_responsable ?? '',
          inventory: obra.obr_inventario ?? ''
        }));
        // CORREGIDO: Usar onUpdateWorks en lugar de setWorks
        onUpdateWorks(mappedWorks);
      } catch (err) {
        console.error('Error al cargar obras:', err);
      }
    };
    // Cargamos las obras solo si el usuario tiene permiso para leerlas
    if (canReadWork) {
      fetchWorks();
    }
  }, [canReadWork, onUpdateWorks]); // Dependencia del privilegio y onUpdateWorks*/

  // Filtrado de obras basado en el término de búsqueda
  // Busca coincidencias en nombre, artista y ubicación de almacenamiento
  const filteredWorks = works.filter(work =>
    (work.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (work.artist ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (work.storageLocation ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Implementación del hook de paginación personalizado
  // Configurado para mostrar 8 obras por página con diseño responsive
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedWorks,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage
  } = usePagination(filteredWorks, {
    itemsPerPage: 8, // Número de obras por página optimizado para diseño responsive
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
      // El servicio 'saveWork' ya maneja si es creación o edición
      await saveWork(formData, workId);

      // Llama a la función del App.tsx para recargar y re-mapear TODA la data.
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


  // ==========================
  // Manejo de creación de obra
  // ==========================
 /* const handleAddWork = async (workData: Partial<Work>) => {
    if (!canCreateWork) return; // Validación adicional en el frontend
    try {
      const payload = {
        obr_mcf: workData.inventoryNumber ?? '',
        obr_numeros_anteriores: workData.previousNumbers ?? '',
        obr_titulo: workData.name ?? '',
        obr_fecha_realizacion: workData.realizationDate ?? '',
        obr_alto_cm: workData.dimensions?.height ?? '',
        obr_ancho_cm: workData.dimensions?.width ?? '',
        obr_profundidad_cm: workData.dimensions?.depth ?? '',
        obr_diametro_cm: workData.dimensions?.diameter ?? '',
        obr_valor_avaluo: workData.technicalData?.value ?? '',
        obr_descripcion_formal: workData.description ?? '',
        obr_detalles_firma: workData.signatureDetails ?? '',
        obr_observaciones: workData.observations ?? '',
        obr_url_foto: workData.photoUrl ?? '',
        obr_estado_condicion: workData.conservationState?.condition ?? '',
        obr_estado_integridad: workData.conservationState?.integrity ?? '',
        obr_procedencia: workData.technicalData?.provenance ?? '',
        obr_cultura_tradicion: workData.technicalData?.culture ?? '',
        obr_epoca_estilo: workData.technicalData?.eraStyle ?? '',
        obr_moneda_avaluo: workData.technicalData?.currency ?? '',
        obr_responsable_avaluo: workData.technicalData?.appraiser ?? '',
        obr_fecha_avaluo: workData.technicalData?.appraisalDate ?? '',
        obr_propietario_original: workData.technicalData?.originalOwner ?? '',
        obr_documentos_relacionados: workData.references?.documents ?? '',
        obr_bibliografia: workData.references?.bibliography ?? '',
        obr_fecha_ingreso: workData.collection?.entryDate ?? '',
        obr_fuente_adquisicion: workData.collection?.acquisitionSource ?? '',
        obr_metodo_adquisicion: workData.collection?.acquisitionMethod ?? '',
        obr_entidad_responsable: workData.responsibleEntity?.name ?? '',
      };

      const newWork = await createWork(payload);
      onUpdateWorks([...works, newWork]);
      setShowForm(false);
    } catch (err) {
      console.error('Error al crear obra:', err);
    }
  };

  const handleEditWork = async (workData: Partial<Work>) => {
    if (!editingWork || !canUpdateWork) return; // Validación adicional
    try {
      const updatedWork = await updateWork(editingWork.id as string, workData);
      onUpdateWorks(works.map(w => (w.id === editingWork.id ? updatedWork : w)));
      setEditingWork(null);
    } catch (err) {
      console.error('Error al actualizar obra:', err);
    }
  };*/

 const handleDeleteWork = async (workId: string) => {
    if (!canDeleteWork) return;
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta obra?')) return;
    
    try {
        await deleteWork(workId);
        // ✅ ¡CORRECCIÓN AQUÍ! ✅ 
        // Simplemente llamamos a la función para que recargue la lista actualizada.
        await onUpdateWorks(); 
        if (viewingWork?.id === workId) {
          setViewingWork(null);
        }
    } catch (err) {
        console.error('Error al eliminar la obra:', err);
        setError('No se pudo eliminar la obra.');
    }
  };

  const handleExportPDF = (work: Work) => {
    PDFUtils.generateWorkInventoryPDF(work);
  };

  // Mensaje de acceso denegado si el usuario no tiene permiso de lectura
  if (!canReadWork) {
    return (
      <div className="p-4 sm:p-8 text-center text-red-700 bg-red-100 rounded-xl m-4 sm:m-8">
        <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
        <p>No tienes los privilegios necesarios para ver esta información. Contacta al administrador del sistema.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      
      {/* FORMULARIO Y DETALLES */}
      {/* Los formularios de edición y creación solo se muestran si el usuario tiene los privilegios */}
    {(showForm || editingWork) && (
  <WorkForm
    // Si 'editingWork' existe, lo pasamos para rellenar el form. Si no, es un form vacío.
    work={editingWork || undefined}
    
    // Usamos nuestra nueva función unificada para el 'submit'
    onSubmit={handleSaveWork} 
    
    // La cancelación cierra el form y limpia el estado de edición
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
          // CORREGIDO: Pasar una función vacía en lugar de 'undefined'
          onEdit={canUpdateWork ? () => { setEditingWork(viewingWork); setViewingWork(null); } : () => {}}
           onDelete={canDeleteWork ? () => handleDeleteWork(viewingWork.id) : () => {}}
        />
      )}

      {/* ENCABEZADO Y BOTÓN AGREGAR - Diseño responsive mejorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Gestión de Obras
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Administre las obras de la colección del museo</p>
        </div>
        {/* Solo mostramos el botón si el usuario puede crear obras */}
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

      {/* BÚSQUEDA - Diseño responsive mejorado */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, artista o ubicación..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        {/* TABLA - Diseño responsive con scroll horizontal en móviles */}
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
              {/* Renderizado de obras paginadas con diseño responsive */}
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
                      {/* Información adicional visible solo en móviles */}
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
                    {/* Botones de acción con diseño responsive */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                      <button onClick={() => setViewingWork(work)} className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      {/* Solo mostramos el botón de editar si tiene el privilegio */}
                      {canUpdateWork && (
                        <button onClick={() => setEditingWork(work)} className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110">
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      {/* Solo mostramos el botón de eliminar si tiene el privilegio */}
                      {canDeleteWork && (
                        <button onClick={() => handleDeleteWork(work.id)} className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                      <button onClick={() => handleExportPDF(work)} className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110" title="Descargar Ficha PDF">
                        <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay obras - Responsive */}
        {filteredWorks.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas'}
          </div>
        )}

        {/* Componente de paginación responsive */}
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