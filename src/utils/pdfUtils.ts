// UTILIDADES PARA GENERACIÓN DE PDF
// Funciones auxiliares para la generación de documentos PDF específicos

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MovementRecord, MaintenanceRecord } from '../models';
import { Work } from '../models';
import logoSrc from '/logoblanco_negro.jpg';

export class PDFUtils {
  /**
   * Genera PDF para registro de movimiento
   * @param record - Registro de movimiento
   */
  static async generateMovementPDF(record: MovementRecord): Promise<void> {
    // HTML temporal para convertir a imagen
    const tempContainer = document.createElement("div");
    tempContainer.style.width = "800px";
    tempContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; font-size: 14px; line-height: 1.6; color: #000;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <img src="/logoblanco_negro.jpg" alt="Logo Museo"  style="height: 80px;">
          <div>
           
          </div>
        </div>

        <div style="text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase; margin-bottom: 20px;">
          INGRESO DE OBRAS
        </div>

        <div style="margin-bottom: 15px;">
    Hoy <span style="border-bottom: 1px dashed #000; display: inline-block; min-width: 200px; padding-bottom: 5px; line-height: 1.6;">${new Date(
      record.date
   ).toLocaleDateString("es-ES")}</span>,
el Museo Carmelo Fernández recibe del ciudadano(a):
<span style="border-bottom: 1px dashed #000; min-width: 200px; padding-bottom: 5px; line-height: 1.6;">
  ${record.receiver?.name ?? 'N/A'}
</span> C.I.:
<span style="border-bottom: 1px dashed #000; min-width: 200px; padding-bottom: 5px; line-height: 1.6;">
  ${record.receiver?.idCard ?? 'N/A'}
</span>
la obra que se describe a continuación:
</div>

        <div style="margin-bottom: 15px;">
          <b>Autor:</b> ${record.workDetails.author}<br>
          <b>Título:</b> ${record.workDetails.title}<br>
          <b>Técnica:</b> ${record.workDetails.technique}<br>
          <b>Medidas:</b> ${record.workDetails.dimensions}<br>
          <b>Colección:</b> ${record.workDetails.collection}
        </div>

        <div style="margin-bottom: 15px;">
    La obra mencionada ingresa al museo con el objetivo de:
    <span style="border-bottom: 1px dashed #000; min-width: 300px; padding-bottom: 5px; line-height: 1.6;">${record.reason}</span>
  </div>

        <div style="margin-bottom: 15px;">
          <b>Estado de conservación:</b><br>
          ${record.conservationState}
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 45%;">
            <p><strong>Recibe por el Museo:</strong></p>
           <p>Nombre: ${record.deliverer?.name ?? 'N/A'}</p>
<p>C.I.: ${record.deliverer?.idCard ?? 'N/A'}</p>
<p>Firma: _______________________</p>
<p>Teléfono: ${record.deliverer?.phone ?? 'N/A'}</p>
          </div>
          <div style="width: 45%;">
            <p><strong>Entrega:</strong></p>
            <p>Nombre: ${record.receiver?.name ?? 'N/A'}</p>
<p>C.I.: ${record.receiver?.idCard ?? 'N/A'}</p>
<p>Firma: _______________________</p>
<p>Teléfono: ${record.receiver?.phone ?? 'N/A'}</p>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 10px; text-align: center;">
          Calle de servicio del Complejo Cultural Andrés Bello, 2da Av. Entre calles 13 y 14, San Felipe, Estado Yaracuy
        </div>
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Convertir HTML a imagen
    const canvas = await html2canvas(tempContainer, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // Crear PDF con jsPDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Descargar
    pdf.save(`movimiento_${record.workName.replace(/\s+/g, "_")}_${record.date}.pdf`);

    // Limpiar HTML temporal
    document.body.removeChild(tempContainer);
  }

  /**
   * Genera PDF para registro de mantenimiento
   * @param record - Registro de mantenimiento
   */
  
  static async generateMaintenancePDF(record: MaintenanceRecord): Promise<void> {
    // Funciones para marcar con X
    const checkType = (type: string) =>
      record.workType?.toLowerCase() === type.toLowerCase() ? "X" : " ";
    const checkConservation = (type: string) =>
      record.maintenanceCategory?.toLowerCase() === type.toLowerCase()
        ? "X"
        : " ";

    // HTML temporal con el formato
    const tempContainer = document.createElement("div");
    tempContainer.style.width = "800px";
    tempContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.4; color: #000;">
        
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
         <img src="/logoblanco_negro.jpg" alt="Logo Museo" style="width: 80px; height: auto; margin-right: 15px;">
          <div style="flex: 1; text-align: center;">
            <h2 style="margin: 0;">INFORME DE CONSERVACIÓN</h2>
          </div>
        </div>

        <div style="text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">
          TALLER DE CONSERVACIÓN Y RESTAURACIÓN
        </div>

        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">
          INFORME
        </div>

        <div style="border: 1px solid #000; padding: 4px; font-size: 11px;">
          Pintura (${checkType("Pintura")})  
          Escultura (${checkType("Escultura")})  
          Instalación (${checkType("Instalación")})  
          Cerámica (${checkType("Cerámica")})  
          Fotografía (${checkType("Fotografía")})  
          Artes Gráficas (${checkType("Artes Gráficas")})  
          Otros (${checkType("Otros")})<br>
          N° de la obra: _______  Precio de la obra en Bs.: ${record.currentPrice}
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px;">
          <tr>
            <td style="border: 1px solid #000; padding: 4px;"><b>Autor:</b> ${record.author}</td>
            <td style="border: 1px solid #000; padding: 4px;"><b>Título:</b> ${record.workName}</td>
            <td style="border: 1px solid #000; padding: 4px;"><b>Medidas:</b> ${record.dimensions}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px;"><b>Técnica:</b> ${record.technique}</td>
            <td style="border: 1px solid #000; padding: 4px;"><b>Año:</b> ${record.year}</td>
            <td style="border: 1px solid #000; padding: 4px;"><b>Precio Actual:</b> ${record.currentPrice}</td>
          </tr>
        </table>

        <div style="border: 1px solid #000; padding: 4px; margin-top: 5px; min-height: 60px;">
          Conservación preventiva (${checkConservation("Conservación preventiva")})   
          Conservación curativa (${checkConservation("Conservación curativa")})
        </div>

        <div style="border: 1px solid #000; padding: 4px; margin-top: 5px; min-height: 80px;">
          <b>Intervención de la obra:</b><br>
          ${record.interventionDescription}
        </div>

        <div style="margin-top: 40px; font-size: 11px;">
          Lcdo. Ramón Caracas<br>
          Lcdo. Juan Carlos Martínez<br>
          Conservador y restaurador<br>
          Director del MUCAF
        </div>

        <div style="margin-top: 20px; font-size: 9px; border-top: 1px solid #000; padding-top: 5px; text-align: center;">
          Calle de servicio del Complejo Cultural Andrés Bello, 2da Av. Entre calles 13 y 14, San Felipe, Estado Yaracuy. 
          0254 - 232.57.91 / 0412 - 519.85.45<br>
          www.museocarmelofernandez.weebly.com / museocarmelofernandez@gmail.com
        </div>
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Convertir a imagen
    const canvas = await html2canvas(tempContainer, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // Crear PDF real
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`mantenimiento_${record.workName}_${record.date}.pdf`);

    // Limpiar el HTML temporal
    document.body.removeChild(tempContainer);
  }

  
  /**
   * Genera la ficha de inventario en PDF para una obra
   * @param work - Obra del museo
   */
  static async generateWorkInventoryPDF(work: Work): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();

    // --- Función para cargar la imagen ---
    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Necesario para cargar imágenes de otro dominio
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    // --- Encabezado ---
    const addHeader = (docInstance: jsPDF) => {
        const LOGO_WIDTH = 35;
        const LOGO_HEIGHT = 15;
        const HEADER_BOTTOM_Y = MARGIN + LOGO_HEIGHT + 25;

        docInstance.addImage(logoSrc, 'JPEG', MARGIN, MARGIN, LOGO_WIDTH, LOGO_HEIGHT);

        docInstance.setFontSize(12);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text("VENEZUELA", PAGE_WIDTH / 2, MARGIN + 8, { align: 'center' });
        docInstance.setFontSize(10);
        docInstance.text("Consejo Nacional de la Cultura (CONAC)", PAGE_WIDTH / 2, MARGIN + 12, { align: 'center' });
        docInstance.setFont('helvetica', 'normal');
        docInstance.text("Dirección General Sectorial de Museos", PAGE_WIDTH / 2, MARGIN + 15, { align: 'center' });

        docInstance.setFontSize(14);
        docInstance.setFont('helvetica', 'bold');
        docInstance.rect(MARGIN, MARGIN + 20, PAGE_WIDTH - (MARGIN * 2), 10);
        docInstance.text("FICHA DE INVENTARIO GENERAL", PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' });

        return HEADER_BOTTOM_Y;
    };

    // --- Funciones auxiliares de formato ---
    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return 'No especificado';
        try {
            const date = new Date(dateString);
            const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            if (isNaN(adjustedDate.getTime())) return 'Fecha inválida';
            return adjustedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return 'Fecha inválida'; }
    };

     const formatValue = (value?: string, currency?: string) => {
        if (!value) return 'No especificado';
        return `${currency || ''} ${value}`.trim();
    };

    const workDimensions = [
      work.dimensions.height && `Alto: ${work.dimensions.height}cm`,
      work.dimensions.width && `Ancho: ${work.dimensions.width}cm`,
      work.dimensions.depth && `Prof.: ${work.dimensions.depth}cm`,
      work.dimensions.diameter && `Diám.: ${work.dimensions.diameter}cm`,
    ].filter(Boolean).join(' / ');

    // --- Funciones de dibujo (sin cambios en su lógica interna) ---
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

    const drawSectionBox = (title: string, content: { label: string, value?: string }[], x: number, y: number, w: number): number => {
        const PADDING = 3;
        const HEADER_HEIGHT = 8;
        const LABEL_X_OFFSET = 35;
        const MIN_ITEM_HEIGHT = 7;
        const FONT_SIZE = 8;
        const LINE_HEIGHT_FACTOR = 1.4;
        let contentAreaHeight = PADDING;
        doc.setFontSize(FONT_SIZE);
        content.forEach(item => {
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING * 2));
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
            const valueLines = doc.splitTextToSize(item.value || ' ', w - LABEL_X_OFFSET - (PADDING * 2));
            const itemTextHeight = valueLines.length * FONT_SIZE * 0.3527 * LINE_HEIGHT_FACTOR;
            doc.setFont('helvetica', 'normal');
            doc.text(item.label, x + PADDING, itemY);
            doc.setFont('helvetica', 'bold');
            doc.text(valueLines, x + LABEL_X_OFFSET, itemY, { maxWidth: w - LABEL_X_OFFSET - PADDING, lineHeightFactor: LINE_HEIGHT_FACTOR });
            itemY += Math.max(MIN_ITEM_HEIGHT, itemTextHeight);
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

    // --- DIBUJO DEL PDF ---
    let currentY = addHeader(doc);

    // ✅ **PASO 1: Dibujar el recuadro de la foto y cargar la imagen**
    const PHOTO_BOX_WIDTH = 60;
    const PHOTO_BOX_HEIGHT = 50;
    const PHOTO_BOX_X = PAGE_WIDTH - MARGIN - PHOTO_BOX_WIDTH;
    const PHOTO_BOX_Y = currentY;

    doc.rect(PHOTO_BOX_X, PHOTO_BOX_Y, PHOTO_BOX_WIDTH, PHOTO_BOX_HEIGHT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("FOTOGRAFIA", PHOTO_BOX_X + (PHOTO_BOX_WIDTH / 2), PHOTO_BOX_Y + 5, { align: 'center' });

    if (work.photoUrl) {
      try {
        const img = await loadImage(work.photoUrl);
        doc.addImage(img, 'JPEG', PHOTO_BOX_X + 1, PHOTO_BOX_Y + 8, PHOTO_BOX_WIDTH - 2, PHOTO_BOX_HEIGHT - 9, undefined, 'FAST');
      } catch (e) {
        doc.text("No se pudo cargar la imagen", PHOTO_BOX_X + (PHOTO_BOX_WIDTH / 2), PHOTO_BOX_Y + 25, { align: 'center' });
      }
    } else {
        doc.text("Sin Fotografía", PHOTO_BOX_X + (PHOTO_BOX_WIDTH / 2), PHOTO_BOX_Y + 25, { align: 'center' });
    }

    // ✅ **PASO 2: Ajustar el ancho de la caja de Identificación**
    const IDENTIFICATION_BOX_WIDTH = PAGE_WIDTH - (MARGIN * 2) - PHOTO_BOX_WIDTH - 2;
    currentY = drawSectionBox("IDENTIFICACION", [
      { label: "N° de Identificación:", value: work.inventoryNumber },
      { label: "N° anteriores:", value: work.previousNumbers }
    ], MARGIN, currentY, IDENTIFICATION_BOX_WIDTH);

    currentY = Math.max(currentY, PHOTO_BOX_Y + PHOTO_BOX_HEIGHT); // Asegura que el contenido siguiente empiece debajo de la foto
    currentY += 2; // Espacio

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

    // ✅ **PASO 3: Corregir los datos de Avalúo**
    currentY = drawSectionBox("DATOS TECNICOS", [
        { label: "Procedencia:", value: work.technicalData.provenance },
        { label: "Cultura/Tradición:", value: work.technicalData.culture },
        { label: "Época/Estilo:", value: work.realizationDate }, // Este suele estar acá
        { label: "Valor/Moneda:", value: formatValue(work.appraisal.value, work.appraisal.currency) },
        { label: "Responsable Avalúo:", value: work.appraisal.appraiser },
        { label: "Fecha Avalúo:", value: formatDate(work.appraisal.appraisalDate) },
        { label: "Propietario Original:", value: work.technicalData.originalOwner },
    ], MARGIN, currentY, PAGE_WIDTH - (MARGIN * 2));

    // --- Segunda Página ---
    doc.addPage();
    currentY = addHeader(doc);

    currentY = drawTextBox("OBSERVACIONES", work.observations || '', MARGIN, currentY, PAGE_WIDTH - (MARGIN * 2));

    currentY = drawSectionBox("COLECCION", [
        { label: "Fuente de Adquisición:", value: work.collection.acquisitionSource },
        { label: "Forma de Adquisición:", value: work.collection.acquisitionMethod },
        { label: "Fecha de Ingreso:", value: formatDate(work.collection.entryDate) }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN * 2));

    currentY = drawSectionBox("RESPONSABLE DE LA OBRA", [
        { label: "Nombre:", value: work.responsibleEntity.name },
        { label: "Dirección:", value: work.responsibleEntity.address }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN * 2));

    currentY = drawSectionBox("INVENTARIO", [
        { label: "Responsable:", value: work.inventory.responsible },
        { label: "Fecha:", value: formatDate(work.inventory.date) },
        { label: "Supervisado por:", value: work.inventory.supervisor },
        { label: "Fecha:", value: formatDate(work.inventory.supervisorDate) }
    ], MARGIN, currentY + 2, PAGE_WIDTH - (MARGIN * 2));

    doc.save(`Ficha-${work.inventoryNumber}-${work.name}.pdf`);
  }
}