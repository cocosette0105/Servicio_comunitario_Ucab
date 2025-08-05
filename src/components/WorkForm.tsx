// CORRECTO: Combina todo lo de 'react' en una sola línea
import React, { useState, ChangeEvent, FormEvent } from 'react';

// CORRECTO: Combina todos los íconos de 'lucide-react' en una sola línea
import { Save, X, UploadCloud } from 'lucide-react';

// CORRECTO: Importa la interfaz 'Work' desde tu archivo de tipos
import { Work } from '../types';



// Define las props que recibe el formulario: la obra a editar (opcional), función para enviar datos y función para cancelar
// Define las props que recibe el formulario
interface WorkFormProps {
  work?: Work;
  onSubmit: (workData: Partial<Work>) => void;
  onCancel: () => void;
}

const WorkForm: React.FC<WorkFormProps> = ({ work, onSubmit, onCancel }) => {
  
  const [formData, setFormData] = useState<Partial<Work>>({
    // Campos existentes
    id: work?.id || '',
    inventoryNumber: work?.inventoryNumber || '', // N° de Identificación
    previousNumbers: work?.previousNumbers || '', // N°s anteriores
    name: work?.name || '', // Nombre del Objeto / Título de la Obra
    artist: work?.artist || '', // Autor/Artesano/Taller
    classification: work?.classification || '', // Clasificación Genérica
    realizationDate: work?.realizationDate || '', // Corresponde a "Epoca / Estilo / Movim. / Escuela"
    technique: work?.technique || '', // Técnica
    materials: work?.materials || '', // Materiales
    dimensions: work?.dimensions || { height: '', width: '', depth: '', diameter: '' }, // Dimensiones
    description: work?.description || '', // Descripción formal
    signatureDetails: work?.signatureDetails || '', // Ubicación y detalles de la firma
    observations: work?.observations || '', // Otras observaciones generales
    conservationState: work?.conservationState || { condition: '', integrity: '' }, // Estado de conservación
    photoUrl: work?.photoUrl || '',

    // Campos nuevos/reestructurados
    technicalData: work?.technicalData || { provenance: '', culture: '', eraStyle: '', value: '', appraiser: '', appraisalDate: '', originalOwner: '' }, // Datos técnicos
    references: work?.references || { documents: '', bibliography: '', exhibitions: '', treatments: '' }, // Referencias
    storageLocation: work?.storageLocation || '', // Ubicación en Depósito
    collection: work?.collection || { acquisitionSource: '', acquisitionMethod: '', entryDate: '' }, // Datos de colección
    responsibleEntity: work?.responsibleEntity || { name: '', address: '' }, // Entidad responsable
    inventory: work?.inventory || { responsible: '', date: '', supervisor: '', supervisorDate: '' }, // Inventario
  });
  // Estado para la vista previa de la imagen
  const [imagePreview, setImagePreview] = useState<string | null>(work?.photoUrl || null);

  /**
   * Maneja los cambios en los inputs, textareas y selects.
   * Puede actualizar propiedades anidadas usando la notación 'objeto.propiedad' en el atributo 'name' del input.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => {
        const newState = { ...prev };
        let currentLevel: any = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
          currentLevel = currentLevel[keys[i]];
        }
        currentLevel[keys[keys.length - 1]] = value;
        return newState;
      });
    }
  };

  /**
   * Maneja la selección de un archivo de imagen.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  /**
   * Maneja el envío del formulario.
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Aquí se enviaría `formData` al backend. Si hay una `formData.photo` (File),
    // se necesitaría un `FormData` para enviarlo como multipart/form-data.
    onSubmit(formData);
  };

  // Renderizado del formulario
  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-2">
              Ficha de Inventario General
            </h1>
            <p className="text-amber-700 text-lg">
              {work ? 'Modifique los datos de la obra' : 'Complete la información de la nueva obra'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- SECCIÓN 1: IDENTIFICACIÓN GENERAL --- */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Identificación General</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">N° de Identificación *</label>
                  <input type="text" name="inventoryNumber" value={formData.inventoryNumber} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: MCF-219" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">N°s Anteriores</label>
                  <input type="text" name="previousNumbers" value={formData.previousNumbers} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: 1993-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Título de la Obra *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: Poseidón" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Autor / Taller *</label>
                  <input type="text" name="artist" value={formData.artist} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: Erma Alvarez Piñeiro" required />
                </div>
              </div>
            </fieldset>

            {/* --- SECCIÓN 2: DESCRIPCIÓN TÉCNICA Y DIMENSIONES --- */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Descripción Técnica</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                 <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Clasificación Genérica</label>
                  <input type="text" name="classification" value={formData.classification} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: Obra Gráfica"/>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Época / Año de Realización *</label>
                  <input type="text" name="realizationDate" value={formData.realizationDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: 1981"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Técnica</label>
                  <input type="text" name="technique" value={formData.technique} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: Aguafuerte"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Materiales</label>
                  <input type="text" name="materials" value={formData.materials} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-amber-500" placeholder="Ej: Tinta gráfica y papel"/>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold text-amber-800 mb-2">Dimensiones (en cm)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input type="number" name="dimensions.height" value={formData.dimensions?.height} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Alto"/>
                  <input type="number" name="dimensions.width" value={formData.dimensions?.width} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ancho"/>
                  <input type="number" name="dimensions.depth" value={formData.dimensions?.depth} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Prof."/>
                  <input type="number" name="dimensions.diameter" value={formData.dimensions?.diameter} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Diám."/>
                </div>
              </div>
               <div className="mt-6">
                  <label className="block text-sm font-bold text-amber-800 mb-2">Descripción Formal</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 border border-amber-200 rounded-lg resize-none" placeholder="Descripción detallada de la obra..."></textarea>
              </div>
            </fieldset>

             {/* --- ÚNICA SECCIÓN: OBSERVACIONES GENERALES --- */}
            <fieldset>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">
                    Observaciones Generales (Tiraje, estado, etc.)
                  </label>
                  <textarea 
                    name="observations" 
                    value={formData.observations} 
                    onChange={handleInputChange} 
                    rows={8} // Aumentamos las filas para más espacio
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg resize-y focus:ring-amber-500" 
                    placeholder="Anotaciones sobre el tiraje, estado de la obra, u otros detalles relevantes..."
                  ></textarea>
                </div>
            </fieldset>
            {/* --- SECCIÓN 3: FOTOGRAFÍA --- */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Fotografía</legend>
              <div className="mt-4">
                <label htmlFor="photo-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-amber-300 border-dashed rounded-lg cursor-pointer hover:bg-amber-50">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Vista previa de la obra" className="max-h-60 rounded-lg"/>
                  ) : (
                    <div className="text-center text-amber-700">
                      <UploadCloud className="mx-auto h-12 w-12"/>
                      <p className="mt-2 font-semibold">Haz clic para cargar una imagen</p>
                      <p className="text-sm">PNG, JPG, WEBP (MAX. 5MB)</p>
                    </div>
                  )}
                </label>
                <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
              </div>
            </fieldset>
            
            {/* --- SECCIÓN 4: ESTADO DE CONSERVACIÓN --- */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Estado de Conservación</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-3">Condiciones</label>
                  <div className="flex space-x-4">
                    {['Bueno', 'Regular', 'Malo'].map(cond => (
                      <label key={cond} className="flex items-center space-x-2">
                        <input type="radio" name="conservationState.condition" value={cond} checked={formData.conservationState?.condition === cond} onChange={handleInputChange} className="form-radio text-amber-600"/>
                        <span>{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-amber-800 mb-3">Integridad</label>
                  <div className="flex space-x-4">
                    {['Completo', 'Incompleto', 'Fragmento'].map(integ => (
                      <label key={integ} className="flex items-center space-x-2">
                        <input type="radio" name="conservationState.integrity" value={integ} checked={formData.conservationState?.integrity === integ} onChange={handleInputChange} className="form-radio text-amber-600"/>
                        <span>{integ}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>

             {/* === seccion datos tecnicos === */}

            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Datos Técnicos</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Procedencia</label>
                  <input type="text" name="technicalData.provenance" value={formData.technicalData?.provenance} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Caracas-Venezuela"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Cultura / Tradición</label>
                  <input type="text" name="technicalData.culture" value={formData.technicalData?.culture} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Taller TAGA"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Época / Estilo / Escuela</label>
                  <input type="text" name="technicalData.eraStyle" value={formData.technicalData?.eraStyle} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: 1981"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Valor / Moneda</label>
                  <input type="text" name="technicalData.value" value={formData.technicalData?.value} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Bs. 15.000,00"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Responsable de Avalúo</label>
                  <input type="text" name="technicalData.appraiser" value={formData.technicalData?.appraiser} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Rafael Principal"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Fecha de Avalúo</label>
                 <input type="date" name="technicalData.appraisalDate" value={formData.technicalData?.appraisalDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-amber-800 mb-2">Propietario Original</label>
                  <input type="text" name="technicalData.originalOwner" value={formData.technicalData?.originalOwner} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Smurfit Carton de Venezuela"/>
                </div>
              </div>
            </fieldset>
                        {/* === seccion referencia === */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Referencias</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">Documentos</label>
                    <textarea name="references.documents" value={formData.references?.documents} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Acta de Donación"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">Bibliografía</label>
                    <textarea name="references.bibliography" value={formData.references?.bibliography} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Catálogo de Exposición..."></textarea>
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">Exposiciones</label>
                    <textarea name="references.exhibitions" value={formData.references?.exhibitions} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: AGPA/Museo..."></textarea>
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">Tratamientos</label>
                    <textarea name="references.treatments" value={formData.references?.treatments} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-amber-200 rounded-lg"></textarea>
                  </div>
              </div>
            </fieldset>
                          {/* === seccion coleccion === */}
             <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Colección</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-amber-800 mb-2">Fuente de Adquisición</label>
                  <input type="text" name="collection.acquisitionSource" value={formData.collection?.acquisitionSource} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Taller TAGA/Caracas"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-amber-800 mb-2">Forma de Adquisición</label>
                  <input type="text" name="collection.acquisitionMethod" value={formData.collection?.acquisitionMethod} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Donación Smurfit Mocarpel..."/>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Fecha de Ingreso</label>
                 <input type="date" name="collection.entryDate" value={formData.collection?.entryDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg"/>
                </div>
              </div>
            </fieldset>
                          {/* === seccion responsable === */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Responsable de la Obra</legend>
              <div className="space-y-6 mt-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Nombre</label>
                  <input type="text" name="responsibleEntity.name" value={formData.responsibleEntity?.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Museo Carmelo Fernández"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Dirección</label>
                  <input type="text" name="responsibleEntity.address" value={formData.responsibleEntity?.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Dirección de la institución..."/>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Ubicación en Depósito</label>
                  <input type="text" name="storageLocation" value={formData.storageLocation} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ubicación física de la obra..."/>
                </div>
              </div>
            </fieldset>
                          {/* === seccion inventario === */}
            <fieldset className="border-t-2 border-amber-200 pt-6">
              <legend className="px-4 text-xl font-semibold text-amber-800">Inventario</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Responsable</label>
                  <input type="text" name="inventory.responsible" value={formData.inventory?.responsible} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Cesar Ramos"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Fecha</label>
                 <input type="date" name="inventory.date" value={formData.inventory?.date} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Supervisado por</label>
                  <input type="text" name="inventory.supervisor" value={formData.inventory?.supervisor} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg" placeholder="Ej: Rafael Principal"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Fecha (Supervisión)</label>
                  <input type="date" name="inventory.supervisorDate" value={formData.inventory?.supervisorDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-amber-200 rounded-lg"/>
                </div>
              </div>
            </fieldset>

            {/* --- BOTONES DE ACCIÓN --- */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t border-amber-200">
              <button type="button" onClick={onCancel} className="flex items-center space-x-2 px-8 py-3 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg font-semibold">
                <X className="h-5 w-5" />
                <span>Cancelar</span>
              </button>
              <button type="submit" className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-lg font-semibold">
                <Save className="h-5 w-5" />
                <span>{work ? 'Actualizar Obra' : 'Guardar Obra'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkForm;