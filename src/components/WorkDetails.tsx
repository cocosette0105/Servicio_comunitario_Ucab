import React from 'react';

import {
  ArrowLeft, Edit, Trash2, Calendar, User, MapPin, Building,
  Hash, Palette, Ruler, FileText,  Eye, ShieldCheck,
  Image as  Book, Presentation, Wrench, Archive, Landmark,
  ClipboardCheck, Paperclip, DollarSign, FileDown
} from 'lucide-react';
import { Work } from '../models';
import { PDFUtils } from '../utils/pdfUtils';

// INTERFAZ DE PROPS (sin cambios)
interface WorkDetailsProps {
  work: Work;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Pequeño componente auxiliar para mostrar cada detalle y evitar repetición
const DetailItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children?: React.ReactNode }) => {
  if (!children) return null; // No renderizar si no hay contenido
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

// Componente principal WorkDetails rediseñado
const WorkDetails: React.FC<WorkDetailsProps> = ({ work, onClose, onEdit, onDelete }) => {
  
  const handleDelete = () => {
    if (confirm('¿Está seguro de que desea eliminar esta obra?')) {
      onDelete();
    }
  };

  // Función segura para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    // La entrada de tipo 'date' a veces incluye la hora, la quitamos.
    const date = new Date(dateString.split('T')[0] + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const workDimensions = [
    work.dimensions.height && `Alto: ${work.dimensions.height}cm`,
    work.dimensions.width && `Ancho: ${work.dimensions.width}cm`,
    work.dimensions.depth && `Prof.: ${work.dimensions.depth}cm`,
    work.dimensions.diameter && `Diám.: ${work.dimensions.diameter}cm`,
  ].filter(Boolean).join(' / ');


  // --- NUEVA FUNCIÓN PARA EXPORTAR A PDF ---
  // --- NUEVA FUNCIÓN PARA EXPORTAR A PDF ---
//pdf 
    const handleExportPDF = (work: Work) => {
  PDFUtils.generateWorkInventoryPDF(work);
};
  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
          
          {/* --- ENCABEZADO DE ACCIONES --- */}
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

                {/* --- NUEVO BOTÓN EXPORTAR PDF --- */}
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

          {/* --- CUERPO DE LA FICHA --- */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* --- COLUMNA IZQUIERDA (Foto y Descripción) --- */}
              <div className="lg:col-span-2 space-y-8">
                {/* --- SECCIÓN DE IDENTIFICACIÓN PRINCIPAL --- */}
                <section>
                  <p className="inline-block bg-[#192d71]/10 text-[#192d71] font-bold px-4 py-1 rounded-full text-lg mb-4">
                    {work.inventoryNumber}
                  </p>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2">{work.name}</h1>
                  <p className="text-2xl text-[#192d71]/80 font-semibold flex items-center gap-2">
                    <User className="h-6 w-6" /> {work.artist}
                  </p>
                </section>

                {/* --- FOTO --- */}
                {work.photoUrl && (
                  <section>
                    <img src={work.photoUrl} alt={`Fotografía de ${work.name}`} className="w-full max-h-[500px] object-contain rounded-xl border-2 border-[#192d71]/20 p-2 bg-gray-50"/>
                  </section>
                )}
                
                {/* --- DESCRIPCIÓN Y OBSERVACIONES --- */}
                <section className="space-y-6">
                  <DetailItem icon={<FileText size={20} />} label="Descripción Formal">
                    <p className="whitespace-pre-wrap">{work.description}</p>
                  </DetailItem>
                  
                  <DetailItem icon={<Eye size={20} />} label="Observaciones Adicionales">
                    <p>{work.observations}</p>
                  </DetailItem>
                </section>

                {/* --- REFERENCIAS --- */}
                <section>
                   <h2 className="text-xl font-bold text-[#192d71] mb-4 border-b-2 border-[#192d71]/20 pb-2">Referencias</h2>
                   <div className="space-y-4 pt-2">
                      <DetailItem icon={<Paperclip size={20}/>} label="Documentos">{work.references.documents}</DetailItem>
                      <DetailItem icon={<Book size={20}/>} label="Bibliografía">{work.references.bibliography}</DetailItem>
                      <DetailItem icon={<Presentation size={20}/>} label="Exposiciones">{work.references.exhibitions}</DetailItem>
                      <DetailItem icon={<Wrench size={20}/>} label="Tratamientos">{work.references.treatments}</DetailItem>
                   </div>
                </section>
              </div>

              {/* --- COLUMNA DERECHA (Datos rápidos) --- */}
              <div className="space-y-6">
                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><Palette/>Ficha Técnica</h3>
                    <DetailItem icon={<Hash size={16}/>} label="Clasificación Genérica">{work.classification}</DetailItem>
                    <DetailItem icon={<Wrench size={16}/>} label="Técnica y Materiales">{`${work.technique} sobre ${work.materials}`}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Año de Realización">{work.realizationDate}</DetailItem>
                    <DetailItem icon={<Ruler size={16}/>} label="Dimensiones">{workDimensions}</DetailItem>
                </div>

                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><ShieldCheck/>Estado de Conservación</h3>
                    <DetailItem icon={<span className={`h-3 w-3 rounded-full ${work.conservationState.condition === 'Bueno' ? 'bg-green-500' : work.conservationState.condition === 'Regular' ? 'bg-yellow-500' : 'bg-red-500'}`}/>} label="Condiciones">{work.conservationState.condition}</DetailItem>
                    <DetailItem icon={<span className="text-sm">↳</span>} label="Integridad">{work.conservationState.integrity}</DetailItem>
                </div>
                
                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><Landmark/>Datos de Adquisición y Avalúo</h3>
                    <DetailItem icon={<Archive size={16}/>} label="Forma de Adquisición">{work.collection.acquisitionMethod}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Ingreso">{formatDate(work.collection.entryDate)}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Propietario Original">{work.technicalData.originalOwner}</DetailItem>
                    <DetailItem icon={<DollarSign size={16}/>} label="Valor">{work.technicalData.value}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Responsable de Avalúo">{work.technicalData.appraiser}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Avalúo">{formatDate(work.technicalData.appraisalDate)}</DetailItem>
                </div>

                <div className="bg-[#192d71]/5 border border-[#192d71]/20 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-[#192d71] text-lg flex items-center gap-2"><ClipboardCheck/>Inventario y Ubicación</h3>
                    <DetailItem icon={<Building size={16}/>} label="Entidad Responsable">{work.responsibleEntity.name}</DetailItem>
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