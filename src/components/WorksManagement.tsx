// Importa React y el hook useState para manejar el estado local del componente
import React, { useState } from 'react';
// Importa los íconos que se usarán en los botones de la interfaz
import { Plus, Search, Edit, Trash2, Eye, FileDown } from 'lucide-react';
// Importa el tipo Work para tipar los datos de las obras
import { Work } from '../types';
// Importa el formulario para agregar o editar obras
import WorkForm from './WorkForm';
// Importa el componente para ver detalles de una obra
import WorkDetails from './WorkDetails';
import jsPDF from 'jspdf'; 
import logoSrc from '/logoblanco_negro.jpg';

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


// --- NUEVA FUNCIÓN PARA EXPORTAR PDF (COPIADA Y ADAPTADA DE WORKDETAILS) ---
  const handleExportPDF = (work: Work) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();

    // --- INICIO DE CAMBIOS ---

    // 1. Se crea una función para dibujar el encabezado en cualquier página.
    const addHeader = () => {
        const LOGO_WIDTH = 35;
        const LOGO_HEIGHT = 15; // Se define un alto para el logo.
        const HEADER_BOTTOM_Y = MARGIN + LOGO_HEIGHT + 25;

        // --- Logo en la esquina superior izquierda ---
        // Se cambia 'logoX' por 'MARGIN' para posicionarlo a la izquierda.
        doc.addImage(logoSrc, 'JPEG', MARGIN, MARGIN, LOGO_WIDTH, LOGO_HEIGHT);

        // --- Títulos del centro ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("VENEZUELA", PAGE_WIDTH / 2, MARGIN + 8, { align: 'center' });
        doc.setFontSize(10);
        doc.text("Consejo Nacional de la Cultura (CONAC)", PAGE_WIDTH / 2, MARGIN + 12, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text("Dirección General Sectorial de Museos", PAGE_WIDTH / 2, MARGIN + 15, { align: 'center' });

        // --- Título de la Ficha ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.rect(MARGIN, MARGIN + 20, PAGE_WIDTH - (MARGIN * 2), 10);
        doc.text("FICHA DE INVENTARIO GENERAL", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });
        
        // Se retorna la posición 'Y' donde debe empezar el contenido.
        return HEADER_BOTTOM_Y;
    };

    // --- FIN DE CAMBIOS ---

    // ... (Aquí van tus funciones auxiliares como formatDate, drawTextBox, etc. sin cambios)
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'No especificado';
      const date = new Date(dateString.split('T')[0] + 'T00:00:00');
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const workDimensions = [
      work.dimensions.height && `Alto: ${work.dimensions.height}cm`,
      work.dimensions.width && `Ancho: ${work.dimensions.width}cm`,
      work.dimensions.depth && `Prof.: ${work.dimensions.depth}cm`,
      work.dimensions.diameter && `Diám.: ${work.dimensions.diameter}cm`,
    ].filter(Boolean).join(' / ');
    const drawTextBox = (title: string, value: string, x: number, y: number, w: number): number => {
        const PADDING = 3;
        const HEADER_HEIGHT = 8;
        const FONT_SIZE = 9;
        const LINE_HEIGHT_FACTOR = 1.4;
        doc.setFontSize(FONT_SIZE);
        const textLines = doc.splitTextToSize(value || ' ', w - (PADDING * 2));
        const textHeight = textLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
        const totalHeight = HEADER_HEIGHT + textHeight + (PADDING * 2);
        doc.rect(x, y, w, totalHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, x + PADDING, y + 5);
        doc.line(x, y + HEADER_HEIGHT, x + w, y + HEADER_HEIGHT);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE);
        doc.text(textLines, x + PADDING, y + HEADER_HEIGHT + PADDING, { lineHeightFactor: LINE_HEIGHT_FACTOR });
        return y + totalHeight;
    };
    const drawSectionBox = (title: string, content: {label: string, value?: string}[], x: number, y: number, w: number): number => {
        const PADDING = 3;
        const HEADER_HEIGHT = 8;
        const LABEL_X_OFFSET = 35;
        const MIN_ITEM_HEIGHT = 7;
        const FONT_SIZE = 8;
        const LINE_HEIGHT_FACTOR = 1.4;
        let contentAreaHeight = PADDING;
        doc.setFontSize(FONT_SIZE);
        content.forEach(item => {
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING*2));
            const itemTextHeight = valueLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
            contentAreaHeight += Math.max(MIN_ITEM_HEIGHT, itemTextHeight);
        });
        const totalHeight = HEADER_HEIGHT + contentAreaHeight + PADDING;
        doc.rect(x, y, w, totalHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, x + PADDING, y + 5);
        doc.line(x, y + HEADER_HEIGHT, x + w, y + HEADER_HEIGHT);
        let itemY = y + HEADER_HEIGHT + PADDING + 2;
        doc.setFontSize(FONT_SIZE);
        content.forEach(item => {
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING*2));
            const itemTextHeight = valueLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
            const currentItemHeight = Math.max(MIN_ITEM_HEIGHT, itemTextHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(item.label, x + PADDING, itemY);
            doc.setFont('helvetica', 'bold');
            doc.text(valueLines, x + LABEL_X_OFFSET, itemY, { maxWidth: w - LABEL_X_OFFSET - PADDING, lineHeightFactor: LINE_HEIGHT_FACTOR });
            itemY += currentItemHeight;
        });
        return y + totalHeight;
    };
    const drawConservationBox = (x: number, y: number, w: number): number => {
        const TOTAL_HEIGHT = 25;
        doc.rect(x, y, w, TOTAL_HEIGHT);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('ESTADO DE CONSERVACION', x + 3, y + 5);
        doc.line(x, y + 8, x + w, y + 8);
        const drawCheckbox = (label: string, checked: boolean, chkX: number, chkY: number) => {
            doc.rect(chkX, chkY, 3.5, 3.5); 
            doc.setFontSize(8);
            doc.text(label, chkX + 5, chkY + 3);
            if (checked) {
                doc.setFont('helvetica', 'bold');
                doc.text('X', chkX + 0.8, chkY + 3);
                doc.setFont('helvetica', 'normal');
            }
        };
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Condiciones:', x + 3, y + 15);
        const condX1 = x + 24;
        const condX2 = x + 44;
        const condX3 = x + 67;
        drawCheckbox('Bueno', work.conservationState.condition === 'Bueno', condX1, y + 12);
        drawCheckbox('Regular', work.conservationState.condition === 'Regular', condX2, y + 12);
        drawCheckbox('Malo', work.conservationState.condition === 'Malo', condX3, y + 12);
        doc.text('Integridad:', x + 3, y + 22);
        drawCheckbox('Completo', work.conservationState.integrity === 'Completo', condX1, y + 19);
        drawCheckbox('Incompleto', work.conservationState.integrity === 'Incompleto', condX2, y + 19);
        drawCheckbox('Fragmento', work.conservationState.integrity === 'Fragmento', condX3, y + 19);
        return y + TOTAL_HEIGHT;
    };
    
    // --- LÓGICA DE DIBUJO PRINCIPAL ---

    // 2. Se dibuja el encabezado en la PRIMERA PÁGINA y se establece el 'currentY'
    let currentY = addHeader();

    // Se eliminó el código del encabezado que estaba aquí.
    
    currentY = drawSectionBox("IDENTIFICACION", [
        { label: "N° de Identificación:", value: work.inventoryNumber },
        { label: "N° anteriores:", value: work.previousNumbers }
    ], MARGIN, currentY, PAGE_WIDTH - (MARGIN * 2));
    
    currentY += 2;
    
    const columnStartY = currentY;
    const leftColumnX = MARGIN;
    const rightColumnX = MARGIN + 95;
    const leftColumnWidth = 90;
    const rightColumnWidth = PAGE_WIDTH - rightColumnX - MARGIN;

    let leftColumnEnd_Y = drawSectionBox("DESCRIPCION", [
        { label: "Clasificación Genérica:", value: work.classification },
        { label: "Nombre/Título:", value: work.name },
        { label: "Autor/Taller:", value: work.artist },
        { label: "Dimensiones (cm):", value: workDimensions },
        { label: "Técnica:", value: work.technique },
        { label: "Materiales:", value: work.materials },
    ], leftColumnX, columnStartY, leftColumnWidth);
    
    leftColumnEnd_Y = drawTextBox("Descripción formal", work.description || '', leftColumnX, leftColumnEnd_Y + 2, leftColumnWidth);

    let rightColumnEnd_Y = drawConservationBox(rightColumnX, columnStartY, rightColumnWidth);

    const referencesText = `Documentos:\n${work.references.documents || ''}\n\nBibliografía:\n${work.references.bibliography || ''}\n\nExposiciones:\n${work.references.exhibitions || ''}`;
    rightColumnEnd_Y = drawTextBox("REFERENCIAS", referencesText, rightColumnX, rightColumnEnd_Y + 2, rightColumnWidth);
    
    currentY = Math.max(leftColumnEnd_Y, rightColumnEnd_Y) + 5;

    currentY = drawSectionBox("DATOS TECNICOS", [
        { label: "Procedencia:", value: work.technicalData.provenance },
        { label: "Cultura/Tradición:", value: work.technicalData.culture },
        { label: "Época/Estilo:", value: work.realizationDate },
        { label: "Valor/Moneda:", value: work.technicalData.value },
        { label: "Responsable Avalúo:", value: work.technicalData.appraiser },
        { label: "Fecha Avalúo:", value: formatDate(work.technicalData.appraisalDate) },
        { label: "Propietario Original:", value: work.technicalData.originalOwner },
    ], MARGIN, currentY, PAGE_WIDTH - (MARGIN * 2));

    doc.addPage();
    // 3. Se dibuja el encabezado en la SEGUNDA PÁGINA y se resetea el 'currentY'
    currentY = addHeader();

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

                       <button
                        onClick={() => handleExportPDF(work)}
                        className="p-3 text-[#192d71] hover:bg-[#192d71]/10 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Descargar Ficha PDF"
                      >
                        <FileDown className="h-5 w-5" />
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