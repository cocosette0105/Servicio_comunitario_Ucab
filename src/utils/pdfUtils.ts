// UTILIDADES PARA GENERACIÓN DE PDF
// Funciones auxiliares para la generación de documentos PDF específicos

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MovementRecord, MaintenanceRecord } from '../models';

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
    <span style="border-bottom: 1px dashed #000; min-width: 200px; padding-bottom: 5px; line-height: 1.6;">${record.receiver.name}</span> C.I.:
    <span style="border-bottom: 1px dashed #000; min-width: 200px; padding-bottom: 5px; line-height: 1.6;">${record.receiver.idCard}</span>
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
            <p>Nombre: ${record.deliverer.name}</p>
            <p>C.I.: ${record.deliverer.idCard}</p>
            <p>Firma: _______________________</p>
            <p>Teléfono: ${record.deliverer.phone}</p>
          </div>
          <div style="width: 45%;">
            <p><strong>Entrega:</strong></p>
            <p>Nombre: ${record.receiver.name}</p>
            <p>C.I.: ${record.receiver.idCard}</p>
            <p>Firma: _______________________</p>
            <p>Teléfono: ${record.receiver.phone}</p>
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

}
