import React, { useState } from 'react';
import {
  ArrowLeft, Edit, Trash2, Calendar, User, MapPin, Building,
  Hash, Palette, Ruler, FileText,  Eye, ShieldCheck,
  Presentation, Wrench, Archive, Landmark,
  ClipboardCheck, Paperclip, DollarSign, FileDown, BookOpen, Globe, History, X as XIcon
} from 'lucide-react';
import { Work } from '../models';
import { PDFUtils } from '../utils/pdfUtils';

interface WorkDetailsProps {
  work: Work;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DetailItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children?: React.ReactNode }) => {
  if (children === null || children === undefined || children === '' || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className="flex items-start space-x-3">
      <div className="mt-1 text-amber-600">{icon}</div>
      <div>
        <p className="text-sm font-bold text-amber-700">{label}</p>
        <div className="text-amber-900 font-semibold">{children}</div>
      </div>
    </div>
  );
};

const WorkDetails: React.FC<WorkDetailsProps> = ({ work, onClose, onEdit, onDelete }) => {
  const [workForPdf, setWorkForPdf] = useState<Work | null>(null);
  
  const handleDelete = () => {
    if (confirm('¿Está seguro de que desea eliminar esta obra?')) {
      onDelete();
    }
  };

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  // Función para obtener imágenes únicas de la obra
  const getUniqueWorkImages = (work: Work) => {
    const allUrls = work.imageUrls && work.imageUrls.length > 0 
      ? work.imageUrls 
      : work.photoUrl 
      ? [work.photoUrl] 
      : [];
    
    return [...new Set(allUrls.filter(Boolean).map(url => `${VITE_API_BASE_URL}${url}`))];
  };

  // Lógica para mostrar las imágenes en la galería
  const allImageUrls = [work.photoUrl, ...(work.imageUrls || [])]
    .filter(Boolean)
    .map(url => `${VITE_API_BASE_URL}${url}`);
  const uniqueImageUrls = [...new Set(allImageUrls)];
  const [mainImage, setMainImage] = useState(uniqueImageUrls[0] || '/placeholder.png');

  const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return 'No especificado';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return adjustedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return 'Fecha inválida';
    }
  };

  const formatValue = (value?: string, currency?: string) => {
    if (!value) return 'No especificado';
    return `${currency || ''} ${value}`.trim();
  }

  const workDimensions = [
    work.dimensions.height && `Alto: ${work.dimensions.height}cm`,
    work.dimensions.width && `Ancho: ${work.dimensions.width}cm`,
    work.dimensions.depth && `Prof.: ${work.dimensions.depth}cm`,
    work.dimensions.diameter && `Diám.: ${work.dimensions.diameter}cm`,
  ].filter(Boolean).join(' / ');

  // Nueva función para manejar la exportación a PDF
  const handleExportPDF = (work: Work) => {
    const uniqueImages = getUniqueWorkImages(work);
    
    if (uniqueImages.length === 0) {
      alert("Esta obra no tiene imágenes para generar un reporte.");
      return;
    }
    
    if (uniqueImages.length === 1) {
      PDFUtils.generateWorkInventoryPDF(work, uniqueImages[0]);
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

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Modal de selección de imagen para PDF */}
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

        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
          
          <div className="p-6 border-b border-[#192d71]/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button onClick={onClose} className="flex items-center space-x-2 text-[#192d71] hover:text-[#1e3a8a] font-semibold">
                <ArrowLeft className="h-5 w-5" />
                <span>Volver al Listado</span>
              </button>
              <div className="flex items-center space-x-3">
                <button onClick={onEdit} className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>
                <button onClick={() => handleExportPDF(work)} className="flex items-center space-x-2 px-5 py-2.5 bg-[#192d71] hover:bg-[#1e3a8a] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  <FileDown className="h-5 w-5" />
                  <span>Exportar PDF</span>
                </button>
                <button onClick={handleDelete} className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  <Trash2 className="h-5 w-5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <p className="inline-block bg-[#192d71]/10 text-[#192d71] font-bold px-4 py-1 rounded-full text-lg mb-4">
                    {work.inventoryNumber}
                  </p>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2">{work.name}</h1>
                  <p className="text-2xl text-[#192d71]/80 font-semibold flex items-center gap-2">
                    <User className="h-6 w-6" /> {work.artist}
                  </p>
                  {work.previousNumbers && <p className="text-sm text-gray-500 mt-2">Números Anteriores: {work.previousNumbers}</p>}
                </section>

                <section className="space-y-4">
                  <div className="bg-gray-50 rounded-xl border-2 border-[#192d71]/20 p-2">
                      <img 
                          src={mainImage} 
                          alt={`Foto principal de ${work.name}`} 
                          className="w-full max-h-[500px] object-contain"
                      />
                  </div>
                  {uniqueImageUrls.length > 1 && (
                      <div className="flex gap-2 p-2 bg-gray-100 rounded-lg overflow-x-auto">
                      {uniqueImageUrls.map((url, index) => (
                          <button key={index} onClick={() => setMainImage(url)} className="flex-shrink-0">
                          <img 
                              src={url} 
                              alt={`Miniatura ${index + 1}`} 
                              className={`w-20 h-20 object-cover rounded-md cursor-pointer border-4 transition-all ${mainImage === url ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`}
                          />
                          </button>
                      ))}
                      </div>
                  )}
                </section>
                
                <section className="space-y-6">
                  <DetailItem icon={<FileText size={20} />} label="Descripción Formal">
                    <p className="whitespace-pre-wrap">{work.description}</p>
                  </DetailItem>
                  <DetailItem icon={<Eye size={20} />} label="Observaciones Adicionales">
                    <p>{work.observations}</p>
                  </DetailItem>
                </section>

                <section>
                   <h2 className="text-xl font-bold text-[#192d71] mb-4 border-b-2 border-[#192d71]/20 pb-2">Referencias</h2>
                   <div className="space-y-4 pt-2">
                      <DetailItem icon={<Paperclip size={20}/>} label="Documentos">{work.references.documents}</DetailItem>
                      <DetailItem icon={<BookOpen size={20}/>} label="Bibliografía">{work.references.bibliography}</DetailItem>
                      <DetailItem icon={<Presentation size={20}/>} label="Exposiciones">{work.references.exhibitions}</DetailItem>
                      <DetailItem icon={<Wrench size={20}/>} label="Tratamientos">{work.references.treatments}</DetailItem>
                   </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><Palette/>Ficha Técnica</h3>
                    <DetailItem icon={<Hash size={16}/>} label="Clasificación Genérica">{work.classification}</DetailItem>
                    <DetailItem icon={<Wrench size={16}/>} label="Técnica y Materiales">{`${work.technique} sobre ${work.materials}`}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Año de Realización">{work.realizationDate}</DetailItem>
                    <DetailItem icon={<History size={16}/>} label="Época / Estilo">{work.technicalData.eraStyle}</DetailItem>
                    <DetailItem icon={<Globe size={16}/>} label="Procedencia">{work.technicalData.provenance}</DetailItem>
                    <DetailItem icon={<Palette size={16}/>} label="Cultura / Tradición">{work.technicalData.culture}</DetailItem>
                    <DetailItem icon={<Ruler size={16}/>} label="Dimensiones">{workDimensions}</DetailItem>
                </div>

                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><ShieldCheck/>Estado de Conservación</h3>
                    <DetailItem icon={<span className={`h-3 w-3 rounded-full ${work.conservationState.condition === 'Bueno' ? 'bg-green-500' : work.conservationState.condition === 'Regular' ? 'bg-yellow-500' : 'bg-red-500'}`}/>} label="Condiciones">{work.conservationState.condition}</DetailItem>
                    <DetailItem icon={<span className="text-sm">↳</span>} label="Integridad">{work.conservationState.integrity}</DetailItem>
                </div>
                
                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><Landmark/>Datos de Adquisición y Avalúo</h3>
                    <DetailItem icon={<Archive size={16}/>} label="Fuente de Adquisición">{work.collection.acquisitionSource}</DetailItem>
                    <DetailItem icon={<Archive size={16}/>} label="Forma de Adquisición">{work.collection.acquisitionMethod}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Ingreso">{formatDate(work.collection.entryDate)}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Propietario Original">{work.technicalData.originalOwner}</DetailItem>
                    <DetailItem icon={<DollarSign size={16}/>} label="Valor">{formatValue(work.appraisal.value, work.appraisal.currency)}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Responsable de Avalúo">{work.appraisal.appraiser}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Avalúo">{formatDate(work.appraisal.appraisalDate)}</DetailItem>
                </div>

                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><ClipboardCheck/>Inventario y Ubicación</h3>
                    <DetailItem icon={<Building size={16}/>} label="Entidad Responsable">{work.responsibleEntity.name}</DetailItem>
                    <DetailItem icon={<MapPin size={16}/>} label="Dirección de la Entidad">{work.responsibleEntity.address}</DetailItem>
                    <DetailItem icon={<MapPin size={16}/>} label="Ubicación en Depósito">{work.storageLocation}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Inventariado por">{work.inventory.responsible}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Inventario">{formatDate(work.inventory.date)}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Supervisado por">{work.inventory.supervisor}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Supervisión">{formatDate(work.inventory.supervisorDate)}</DetailItem>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetails;