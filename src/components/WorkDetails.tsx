import React from 'react';
import jsPDF from 'jspdf';
import {
  ArrowLeft, Edit, Trash2, Calendar, User, MapPin, Building,
  Hash, Palette, Ruler, FileText, PenSquare, Eye, ShieldCheck,
  Image as ImageIcon, Book, Presentation, Wrench, Archive, Landmark,
  ClipboardCheck, Paperclip, DollarSign, FileDown
} from 'lucide-react';
import { Work } from '../types';

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
const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    let currentY = MARGIN;

    // --- FUNCIONES AUXILIARES DE DIBUJO (MEJORADAS) ---

    // Dibuja una caja con título y contenido de texto. Retorna la posición Y final.
    const drawTextBox = (title: string, value: string, x: number, y: number, w: number): number => {
        const PADDING = 3;
        const HEADER_HEIGHT = 8;
        const FONT_SIZE = 9;
        const LINE_HEIGHT_FACTOR = 1.4; // Espaciado entre líneas

        doc.setFontSize(FONT_SIZE);
        const textLines = doc.splitTextToSize(value || ' ', w - (PADDING * 2));
        // Calcula la altura del texto. Una buena aproximación es: pt * 0.3527 = mm
        const textHeight = textLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
        const totalHeight = HEADER_HEIGHT + textHeight + (PADDING * 2);

        // Dibuja el contenedor y el encabezado
        doc.rect(x, y, w, totalHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, x + PADDING, y + 5);
        doc.line(x, y + HEADER_HEIGHT, x + w, y + HEADER_HEIGHT);
        
        // Dibuja el texto del contenido
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE);
        doc.text(textLines, x + PADDING, y + HEADER_HEIGHT + PADDING, { lineHeightFactor: LINE_HEIGHT_FACTOR });
        
        return y + totalHeight; // Retorna la nueva posición Y para el siguiente elemento
    };

    // Dibuja una caja con pares de "etiqueta: valor". Retorna la posición Y final.
    const drawSectionBox = (title: string, content: {label: string, value?: string}[], x: number, y: number, w: number): number => {
        const PADDING = 3;
        const HEADER_HEIGHT = 8;
        const LABEL_X_OFFSET = 35; // Distancia desde la izquierda para el valor
        const MIN_ITEM_HEIGHT = 7; // Altura mínima para cada par etiqueta/valor
        const FONT_SIZE = 8;
        const LINE_HEIGHT_FACTOR = 1.4;
        
        let contentAreaHeight = PADDING; // Padding superior dentro del área de contenido

        // 1. Calcular la altura total requerida por el contenido
        doc.setFontSize(FONT_SIZE);
        content.forEach(item => {
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING*2));
            const itemTextHeight = valueLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
            contentAreaHeight += Math.max(MIN_ITEM_HEIGHT, itemTextHeight);
        });

        const totalHeight = HEADER_HEIGHT + contentAreaHeight + PADDING;

        // 2. Dibujar el contenedor y el encabezado
        doc.rect(x, y, w, totalHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, x + PADDING, y + 5);
        doc.line(x, y + HEADER_HEIGHT, x + w, y + HEADER_HEIGHT);
        
        // 3. Dibujar los items de contenido
        let itemY = y + HEADER_HEIGHT + PADDING + 2; // Posición Y inicial para el primer item
        doc.setFontSize(FONT_SIZE);
        content.forEach(item => {
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING*2));
            const itemTextHeight = valueLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
            const currentItemHeight = Math.max(MIN_ITEM_HEIGHT, itemTextHeight);

            doc.setFont('helvetica', 'normal');
            doc.text(item.label, x + PADDING, itemY);
            doc.setFont('helvetica', 'bold');
            doc.text(valueLines, x + LABEL_X_OFFSET, itemY, { maxWidth: w - LABEL_X_OFFSET - PADDING, lineHeightFactor: LINE_HEIGHT_FACTOR });
            
            itemY += currentItemHeight; // Mover la Y para el siguiente item
        });

        return y + totalHeight;
    };

    // Dibuja la caja de Estado de Conservación con checkboxes.
   const drawConservationBox = (x: number, y: number, w: number): number => {
        const TOTAL_HEIGHT = 25; // Esta caja sí tiene un diseño fijo
        doc.rect(x, y, w, TOTAL_HEIGHT);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('ESTADO DE CONSERVACION', x + 3, y + 5);
        doc.line(x, y + 8, x + w, y + 8);

        const drawCheckbox = (label: string, checked: boolean, chkX: number, chkY: number) => {
            // Hacemos el checkbox y la fuente un poco más pequeños para que quepa todo
            doc.rect(chkX, chkY, 3.5, 3.5); 
            doc.setFontSize(8); // Reducimos el tamaño de la etiqueta
            doc.text(label, chkX + 5, chkY + 3); // Ajustamos la posición del texto
            if (checked) {
                doc.setFont('helvetica', 'bold');
                doc.text('X', chkX + 0.8, chkY + 3); // Centramos la 'X' en el nuevo checkbox
                doc.setFont('helvetica', 'normal');
            }
        };
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Fila de "Condiciones" con nuevo espaciado
        doc.text('Condiciones:', x + 3, y + 15);
        const condX1 = x + 24;
        const condX2 = x + 44;
        const condX3 = x + 67;
        drawCheckbox('Bueno', work.conservationState.condition === 'Bueno', condX1, y + 12);
        drawCheckbox('Regular', work.conservationState.condition === 'Regular', condX2, y + 12);
        drawCheckbox('Malo', work.conservationState.condition === 'Malo', condX3, y + 12);
        
        // Fila de "Integridad" con el mismo espaciado para alinear todo
        doc.text('Integridad:', x + 3, y + 22);
        drawCheckbox('Completo', work.conservationState.integrity === 'Completo', condX1, y + 19);
        drawCheckbox('Incompleto', work.conservationState.integrity === 'Incompleto', condX2, y + 19);
        drawCheckbox('Fragmento', work.conservationState.integrity === 'Fragmento', condX3, y + 19);
        
        return y + TOTAL_HEIGHT;
    };
    
    // --- LÓGICA DE DIBUJO PRINCIPAL ---
    
    // Encabezado del documento
    doc.setFontSize(8);
    doc.text("República de Venezuela", MARGIN, currentY);
    doc.text("Estado Yaracuy", MARGIN, currentY + 3);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("VENEZUELA", PAGE_WIDTH / 2, currentY + 8, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Consejo Nacional de la Cultura (CONAC)", PAGE_WIDTH / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text("Dirección General Sectorial de Museos", PAGE_WIDTH / 2, currentY + 15, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.rect(MARGIN, currentY + 20, PAGE_WIDTH - (MARGIN * 2), 10);
    doc.text("FICHA DE INVENTARIO GENERAL", PAGE_WIDTH / 2, currentY + 26, { align: 'center' });
    currentY += 35;
    
    // --- PÁGINA 1 ---
    currentY = drawSectionBox("IDENTIFICACION", [
        { label: "N° de Identificación:", value: work.inventoryNumber },
        { label: "N° anteriores:", value: work.previousNumbers }
    ], MARGIN, currentY, PAGE_WIDTH - (MARGIN * 2));
    
    currentY += 2; // Pequeño espacio
    
    // --- INICIO DE DOS COLUMNAS ---
    const columnStartY = currentY;
    const leftColumnX = MARGIN;
    const rightColumnX = MARGIN + 95;
    const leftColumnWidth = 90;
    const rightColumnWidth = PAGE_WIDTH - rightColumnX - MARGIN;

    // Dibujar columna izquierda
    let leftColumnEnd_Y = drawSectionBox("DESCRIPCION", [
        { label: "Clasificación Genérica:", value: work.classification },
        { label: "Nombre/Título:", value: work.name },
        { label: "Autor/Taller:", value: work.artist },
        { label: "Dimensiones (cm):", value: workDimensions },
        { label: "Técnica:", value: work.technique },
        { label: "Materiales:", value: work.materials },
    ], leftColumnX, columnStartY, leftColumnWidth);
    
    leftColumnEnd_Y = drawTextBox("Descripción formal", work.description || '', leftColumnX, leftColumnEnd_Y + 2, leftColumnWidth);

    // Dibujar columna derecha
    let rightColumnEnd_Y = drawConservationBox(rightColumnX, columnStartY, rightColumnWidth);

    const referencesText = `Documentos:\n${work.references.documents || ''}\n\nBibliografía:\n${work.references.bibliography || ''}\n\nExposiciones:\n${work.references.exhibitions || ''}`;
    rightColumnEnd_Y = drawTextBox("REFERENCIAS", referencesText, rightColumnX, rightColumnEnd_Y + 2, rightColumnWidth);
    
    // Sincronizar 'currentY' al final de la columna más larga
    currentY = Math.max(leftColumnEnd_Y, rightColumnEnd_Y) + 5;

    // --- FIN DE DOS COLUMNAS ---
    
    currentY = drawSectionBox("DATOS TECNICOS", [
        { label: "Procedencia:", value: work.technicalData.provenance },
        { label: "Cultura/Tradición:", value: work.technicalData.culture },
        { label: "Época/Estilo:", value: work.realizationDate },
        { label: "Valor/Moneda:", value: work.technicalData.value },
        { label: "Responsable Avalúo:", value: work.technicalData.appraiser },
        { label: "Fecha Avalúo:", value: formatDate(work.technicalData.appraisalDate) },
        { label: "Propietario Original:", value: work.technicalData.originalOwner },
    ], MARGIN, currentY, PAGE_WIDTH - (MARGIN*2));

    // --- PÁGINA 2 ---
    doc.addPage();
    currentY = MARGIN;

    currentY = drawTextBox("OBSERVACIONES", work.observations || '', MARGIN, currentY, PAGE_WIDTH - (MARGIN*2));
    
    currentY = drawSectionBox("COLECCION", [
        { label: "Fuente de Adquisición:", value: work.collection.acquisitionSource },
        { label: "Forma de Adquisición:", value: work.collection.acquisitionMethod },
        { label: "Fecha de Ingreso:", value: formatDate(work.collection.entryDate) }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN*2));

    currentY = drawSectionBox("RESPONSABLE DE LA OBRA", [
        { label: "Nombre:", value: work.responsibleEntity.name },
        { label: "Dirección:", value: work.responsibleEntity.address }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN*2));

    currentY = drawSectionBox("INVENTARIO", [
        { label: "Responsable:", value: work.inventory.responsible },
        { label: "Fecha:", value: formatDate(work.inventory.date) },
        { label: "Supervisado por:", value: work.inventory.supervisor },
        { label: "Fecha:", value: formatDate(work.inventory.supervisorDate) }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN*2));
    
    // Guardar el documento
    doc.save(`Ficha-${work.inventoryNumber}-${work.name}.pdf`);
};

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
          
          {/* --- ENCABEZADO DE ACCIONES --- */}
          <div className="p-6 border-b border-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button onClick={onClose} className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 font-semibold">
                <ArrowLeft className="h-5 w-5" />
                <span>Volver al Listado</span>
              </button>
              <div className="flex items-center space-x-3">
                <button onClick={onEdit} className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>

                {/* --- NUEVO BOTÓN EXPORTAR PDF --- */}
                <button onClick={handleExportPDF} className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
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
                  <p className="inline-block bg-amber-100 text-amber-800 font-bold px-4 py-1 rounded-full text-lg mb-4">
                    {work.inventoryNumber}
                  </p>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-2">{work.name}</h1>
                  <p className="text-2xl text-amber-700 font-semibold flex items-center gap-2">
                    <User className="h-6 w-6" /> {work.artist}
                  </p>
                </section>

                {/* --- FOTO --- */}
                {work.photoUrl && (
                  <section>
                    <img src={work.photoUrl} alt={`Fotografía de ${work.name}`} className="w-full max-h-[500px] object-contain rounded-xl border-2 border-amber-200 p-2 bg-gray-50"/>
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
                   <h2 className="text-xl font-bold text-amber-900 mb-4 border-b-2 border-amber-200 pb-2">Referencias</h2>
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
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2"><Palette/>Ficha Técnica</h3>
                    <DetailItem icon={<Hash size={16}/>} label="Clasificación Genérica">{work.classification}</DetailItem>
                    <DetailItem icon={<Wrench size={16}/>} label="Técnica y Materiales">{`${work.technique} sobre ${work.materials}`}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Año de Realización">{work.realizationDate}</DetailItem>
                    <DetailItem icon={<Ruler size={16}/>} label="Dimensiones">{workDimensions}</DetailItem>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2"><ShieldCheck/>Estado de Conservación</h3>
                    <DetailItem icon={<span className={`h-3 w-3 rounded-full ${work.conservationState.condition === 'Bueno' ? 'bg-green-500' : work.conservationState.condition === 'Regular' ? 'bg-yellow-500' : 'bg-red-500'}`}/>} label="Condiciones">{work.conservationState.condition}</DetailItem>
                    <DetailItem icon={<span className="text-sm">↳</span>} label="Integridad">{work.conservationState.integrity}</DetailItem>
                </div>
                
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2"><Landmark/>Datos de Adquisición y Avalúo</h3>
                    <DetailItem icon={<Archive size={16}/>} label="Forma de Adquisición">{work.collection.acquisitionMethod}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Ingreso">{formatDate(work.collection.entryDate)}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Propietario Original">{work.technicalData.originalOwner}</DetailItem>
                    <DetailItem icon={<DollarSign size={16}/>} label="Valor">{work.technicalData.value}</DetailItem>
                    <DetailItem icon={<User size={16}/>} label="Responsable de Avalúo">{work.technicalData.appraiser}</DetailItem>
                    <DetailItem icon={<Calendar size={16}/>} label="Fecha de Avalúo">{formatDate(work.technicalData.appraisalDate)}</DetailItem>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2"><ClipboardCheck/>Inventario y Ubicación</h3>
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