import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Save, X, UploadCloud } from 'lucide-react';
import { Work } from '../models';
import AutocompleteInput from './AutocompleteInput';
import { getArtists, getClassifications, getMaterials, getTechniques } from '../services/suggestionsService';

interface WorkFormProps {
  work?: Work;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

// Función para formatear fechas a YYYY-MM-DD
const formatDate = (date?: string | Date) =>
  date ? new Date(date).toISOString().split('T')[0] : '';

const today = new Date().toISOString().split("T")[0];

const WorkForm: React.FC<WorkFormProps> = ({ work, onSubmit, onCancel }) => {

  // Estado inicial del formulario, sin cambios en su estructura
  const [formData, setFormData] = useState<Work>({
    id: work?.id || '',
    inventoryNumber: work?.inventoryNumber || '',
    previousNumbers: work?.previousNumbers || '',
    name: work?.name || '',
    artist: work?.artist || '',
    classification: work?.classification || '',
    realizationDate: work?.realizationDate || '',
    technique: work?.technique || '',
    materials: work?.materials || '',
    dimensions: work?.dimensions || { height: '', width: '', depth: '', diameter: '' },
    description: work?.description || '',
    signatureDetails: work?.signatureDetails || '',
    observations: work?.observations || '',
    photoUrl: work?.photoUrl || '',
    
    imageUrls: work?.imageUrls || [],
    conservationState: work?.conservationState || { condition: '', integrity: '' },
    technicalData: work?.technicalData || { provenance: '', culture: '', eraStyle: '', originalOwner: '' },
    appraisal: work?.appraisal || { value: '', currency: '', appraiser: '', appraisalDate: today },
    references: work?.references || { documents: '', bibliography: '', exhibitions: '', treatments: '' },
    storageLocation: work?.storageLocation || '',
    collection: work?.collection || { acquisitionSource: '', acquisitionMethod: '', entryDate: today },
    responsibleEntity: work?.responsibleEntity || { name: '', address: '' },
    inventory: {
      responsible: work?.inventory?.responsible || '',
      date: formatDate(work?.inventory?.date) || today,
      supervisor: work?.inventory?.supervisor || '',
      supervisorDate: formatDate(work?.inventory?.supervisorDate) || today,
    },
  });

  // Estados para las sugerencias de autocompletado (sin cambios)
  const [artists, setArtists] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [techniques, setTechniques] = useState<string[]>([]);

  // ✅ NUEVO: Estados para manejar MÚLTIPLES archivos y sus vistas previas
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // ✅ NUEVO: imágenes que ya existen en la BD
const [existingImages, setExistingImages] = useState<string[]>([]);


  // Variable de entorno para construir la URL completa de las imágenes existentes
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

useEffect(() => {
  if (work) {
    const urls = work.imageUrls?.length
      ? work.imageUrls.map(url => `${VITE_API_BASE_URL}${url}`)
      : work.photoUrl
      ? [`${VITE_API_BASE_URL}${work.photoUrl}`]
      : [];
    setExistingImages(urls);
    setImagePreviews(urls);
  }
}, [work, VITE_API_BASE_URL]);

useEffect(() => {
  const loadSuggestions = async () => {
    try {
      const [artistsData, classificationsData, materialsData, techniquesData] = await Promise.all([
        getArtists(),
        getClassifications(),
        getMaterials(),
        getTechniques()
      ]);
      
      setArtists(artistsData);
      setClassifications(classificationsData);
      setMaterials(materialsData);
      setTechniques(techniquesData);
    } catch (error) {
      console.error('Error al cargar sugerencias:', error);
    }
  };

  loadSuggestions();
}, []);

  // Manejador para campos de texto, sin cambios
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

  // Manejador para autocompletado, sin cambios
  const handleAutocompleteChange = (fieldName: keyof Work, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Manejador para la selección de MÚLTIPLES archivos

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const filesArray = Array.from(e.target.files);

    // Agregar los nuevos archivos a los ya seleccionados
    setSelectedFiles(prev => [...prev, ...filesArray]);

    // Crear vistas previas para los nuevos archivos
    const newPreviews = filesArray.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }
};


  // ✅ ACTUALIZADO: El envío del formulario ahora adjunta múltiples imágenes
  const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  // Validación del formato MCF (sin cambios)
  const inv = formData.inventoryNumber.trim();
  const regex = /^MCF-\d+$/;
  if (!regex.test(inv)) {
    alert("El N° de Identificación debe tener el formato MCF-(número). Ejemplo: MCF-219");
    return;
  }

  const dataToSend = new FormData();

  // Adjuntar todos los campos de texto del formulario (sin cambios)
  for (const [key, value] of Object.entries(formData)) {
    if (key === 'imageUrls') continue; // No enviar el array de strings de vuelta

    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      dataToSend.append(key, JSON.stringify(value));
    } else {
      dataToSend.append(key, String(value));
    }
  }

  // ✅ NUEVO: Adjuntar las imágenes existentes que el usuario decidió conservar
  // Se envían como JSON para que el backend sepa cuáles mantener
  if (existingImages.length > 0) {
    dataToSend.append('keepImages', JSON.stringify(existingImages));
  }

  // ✅ Adjuntar cada archivo NUEVO seleccionado al FormData
  if (selectedFiles.length > 0) {
    selectedFiles.forEach(file => {
      dataToSend.append('obra_imagenes', file);
    });
  }

  onSubmit(dataToSend);
};


  const inputClassName = "w-full px-4 py-3 border border-[#192d71]/20 rounded-lg focus:ring-2 focus:ring-[#192d71] transition-colors";
  
 return (
  <div className="p-4 sm:p-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-6 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2">
            Ficha de Inventario General
          </h1>
          <p className="text-[#192d71] text-lg">
            {work ? 'Modifique los datos de la obra' : 'Complete la información de la nueva obra'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- SECCIÓN 1: IDENTIFICACIÓN GENERAL --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Identificación General</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">N° de Identificación *</label>
                <input
                  type="text"
                  name="inventoryNumber"
                  value={formData.inventoryNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg focus:ring-[#192d71]"
                  placeholder="Ej: MCF-219"
                  required
                  maxLength={255} // obr_mcf
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">N°s Anteriores</label>
                <input
                  type="text"
                  name="previousNumbers"
                  value={formData.previousNumbers}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg focus:ring-[#192d71]"
                  placeholder="Ej: 1993-001"
                  maxLength={255} // obr_numeros_anteriores
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Título de la Obra *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg focus:ring-[#192d71]"
                  placeholder="Ej: Poseidón"
                  required
                  maxLength={255} // obr_titulo
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Autor/Artesano/Taller</label>
                <AutocompleteInput
                  name="artist"
                  value={formData.artist || ''}
                  onChange={(value) => handleAutocompleteChange('artist', value)}
                  suggestions={artists}
                  placeholder="Ej: Jesús Soto"
                  className={inputClassName}
                />
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN 2: DESCRIPCIÓN TÉCNICA --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Descripción Técnica</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Clasificación Genérica</label>
                <AutocompleteInput
                  name="classification"
                  value={formData.classification || ''}
                  onChange={(value) => handleAutocompleteChange('classification', value)}
                  suggestions={classifications}
                  placeholder="Ej: Obra Gráfica"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Época / Año de Realización *</label>
                <input
                  type="text"
                  name="realizationDate"
                  value={formData.realizationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg focus:ring-[#192d71]"
                  placeholder="Ej: 1981"
                  maxLength={255} // obr_fecha_realizacion
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Técnica</label>
                <AutocompleteInput
                  name="technique"
                  value={formData.technique || ''}
                  onChange={(value) => handleAutocompleteChange('technique', value)}
                  suggestions={techniques}
                  placeholder="Ej: Aguafuerte"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Materiales (separados por coma)</label>
                <AutocompleteInput
                  name="materials"
                  value={formData.materials || ''}
                  onChange={(value) => handleAutocompleteChange('materials', value)}
                  suggestions={materials}
                  placeholder="Ej: Óleo, Lienzo"
                  className={inputClassName}
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-bold text-[#192d71] mb-2">Dimensiones (en cm)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input type="number" name="dimensions.height" value={formData.dimensions?.height} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Alto" maxLength={255}/>
                <input type="number" name="dimensions.width" value={formData.dimensions?.width} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ancho" maxLength={255}/>
                <input type="number" name="dimensions.depth" value={formData.dimensions?.depth} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Prof." maxLength={255}/>
                <input type="number" name="dimensions.diameter" value={formData.dimensions?.diameter} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Diám." maxLength={255}/>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-bold text-[#192d71] mb-2">Descripción Formal</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg resize-none"
                placeholder="Descripción detallada de la obra..."
              />
            </div>
          </fieldset>

          {/* --- SECCIÓN: OBSERVACIONES GENERALES --- */}
          <fieldset>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2">
                Observaciones Generales (Tiraje, estado, etc.)
              </label>
              <textarea 
                name="observations" 
                value={formData.observations} 
                onChange={handleInputChange} 
                rows={8}
                className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg resize-y focus:ring-[#192d71]" 
                placeholder="Anotaciones sobre el tiraje, estado de la obra, u otros detalles relevantes..."
              ></textarea>
            </div>
          </fieldset>

          {/* --- SECCIÓN FOTOGRAFÍA (CORREGIDA) --- */}
        {/* --- SECCIÓN FOTOGRAFÍA (MEJORADA) --- */}
<fieldset className="border-t-4 border-b-4 border-[#192d71]/50 pt-6 pb-8 px-6 rounded-lg">
  <legend className="text-xl font-bold text-[#192d71] px-4">Fotografía(s)</legend>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

    {/* Columna para subir archivos */}
    <div>
      <label className="block text-sm font-bold text-[#192d71] mb-2">Subir nuevas imágenes</label>
      <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-[#192d71]/30 px-6 py-10">
        <div className="text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-[#192d71]/50" />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md font-semibold text-[#192d71] hover:text-[#1e3a8a]"
            >
              <span>Selecciona los archivos</span>
              <input
                id="file-upload"
                name="obra_imagenes"
                type="file"
                className="sr-only"
                multiple
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
              />
            </label>
            <p className="pl-1">o arrástralos aquí</p>
          </div>
          <p className="text-xs leading-5 text-gray-500">PNG, JPG, WEBP hasta 10MB</p>
        </div>
      </div>
    </div>

    {/* Columna para vista previa con eliminar */}
    <div>
      <label className="block text-sm font-bold text-[#192d71] mb-2">Vista Previa</label>
      {(existingImages.length > 0 || selectedFiles.length > 0) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
          
          {/* Imágenes que ya existían */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img
                src={url}
                alt={`Imagen existente ${index + 1}`}
                className="w-full h-28 object-cover rounded-lg shadow-md border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Imágenes nuevas */}
          {selectedFiles.map((file, index) => {
            const src = URL.createObjectURL(file);
            return (
              <div key={`new-${index}`} className="relative group">
                <img
                  src={src}
                  alt={`Imagen nueva ${index + 1}`}
                  className="w-full h-28 object-cover rounded-lg shadow-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 border-2 border-dashed border-[#192d71]/30 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-400">Aquí aparecerán las imágenes</p>
        </div>
      )}
    </div>
  </div>
</fieldset>

          {/* --- SECCIÓN ESTADO DE CONSERVACIÓN --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Estado de Conservación</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-3">Condiciones</label>
                <div className="flex space-x-4">
                  {['Bueno', 'Regular', 'Malo'].map(cond => (
                    <label key={cond} className="flex items-center space-x-2">
                      <input type="radio" name="conservationState.condition" value={cond} checked={formData.conservationState?.condition === cond} onChange={handleInputChange} className="form-radio text-[#192d71]"/>
                      <span>{cond}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-3">Integridad</label>
                <div className="flex space-x-4">
                  {['Completo', 'Incompleto', 'Fragmento'].map(integ => (
                    <label key={integ} className="flex items-center space-x-2">
                      <input type="radio" name="conservationState.integrity" value={integ} checked={formData.conservationState?.integrity === integ} onChange={handleInputChange} className="form-radio text-[#192d71]"/>
                      <span>{integ}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN DATOS TÉCNICOS --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Datos Técnicos</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Procedencia</label>
                <input type="text" name="technicalData.provenance" value={formData.technicalData?.provenance} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Caracas-Venezuela" maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Cultura / Tradición</label>
                <input type="text" name="technicalData.culture" value={formData.technicalData?.culture} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Taller TAGA" maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Época / Estilo / Escuela</label>
                <input type="text" name="technicalData.eraStyle" value={formData.technicalData?.eraStyle} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: 1981" maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Valor de Avalúo</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="appraisal.value"
                    value={formData.appraisal?.value}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg"
                    placeholder="Ej: 15000"
                    maxLength={255} // obr_valor_avaluo
                  />
                  <select
                    name="appraisal.currency"
                    value={formData.appraisal?.currency}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-[#192d71]/20 rounded-lg"
                  >
                    <option value="">Moneda</option>
                    <option value="VES">VES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Responsable de Avalúo</label>
                <input type="text" name="appraisal.appraiser" value={formData.appraisal?.appraiser} onChange={handleInputChange} className={inputClassName} placeholder="Ej: Rafael Principal" maxLength={255}/> <datalist id="appraiserOptions">
  <option value="Rafael Principal" />
</datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Fecha de Avalúo</label>
                <input type="date" name="appraisal.appraisalDate" value={formatDate(formData.appraisal?.appraisalDate)} onChange={handleInputChange} className={inputClassName}/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#192d71] mb-2">Propietario Original</label>
                <input type="text" name="technicalData.originalOwner" value={formData.technicalData?.originalOwner} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Smurfit Carton de Venezuela" maxLength={255}/>
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN REFERENCIAS --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Referencias</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Documentos</label>
                <textarea name="references.documents" value={formData.references?.documents} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Acta de Donación"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Bibliografía</label>
                <textarea name="references.bibliography" value={formData.references?.bibliography} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Catálogo de Exposición..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Exposiciones</label>
                <textarea name="references.exhibitions" value={formData.references?.exhibitions} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: AGPA/Museo..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Tratamientos</label>
                <textarea name="references.treatments" value={formData.references?.treatments} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg"></textarea>
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN COLECCIÓN --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Colección</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#192d71] mb-2">Fuente de Adquisición</label>
                <input type="text" name="collection.acquisitionSource" value={formData.collection?.acquisitionSource} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Taller TAGA/Caracas" maxLength={255}/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#192d71] mb-2">Forma de Adquisición</label>
                <input type="text" name="collection.acquisitionMethod" value={formData.collection?.acquisitionMethod} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Donación Smurfit Mocarpel..." maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Fecha de Ingreso</label>
                <input type="date" name="collection.entryDate" value={formData.collection?.entryDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg"/>
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN RESPONSABLE --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Responsable de la Obra</legend>
            <div className="space-y-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Nombre</label>
                <input type="text" name="responsibleEntity.name" value={formData.responsibleEntity?.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Museo Carmelo Fernández" maxLength={255}  list="responsibleNameOptions"/>
              <datalist id="responsibleNameOptions">
        <option value="Museo Carmelo Fernández" />
      </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Dirección</label>
                <input type="text" name="responsibleEntity.address" value={formData.responsibleEntity?.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Dirección de la institución..." maxLength={255} list="responsibleAddressOptions"/>
              <datalist id="responsibleAddressOptions">
        <option value="MEZZANINA DEL TEATRO DEL COMPLEJO CULTURAL ANDRES BELLO 2ª AVENIDA ESQUINA CALLE 15. SAN FELIPE, ESTADO YARACUY" />
      </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Ubicación en Depósito</label>
                <input type="text" name="storageLocation" value={formData.storageLocation} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ubicación física de la obra..." maxLength={255} list="storageLocationOptions"/>
                 <datalist id="storageLocationOptions">
        <option value="Museo Carmelo Fernández" />
      </datalist>
              </div>
            </div>
          </fieldset>

          {/* --- SECCIÓN INVENTARIO --- */}
          <fieldset className="border-t-2 border-[#192d71]/20 pt-6">
            <legend className="px-4 text-xl font-semibold text-[#192d71]">Inventario</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Responsable</label>
                <input type="text" name="inventory.responsible" value={formData.inventory?.responsible} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Cesar Ramos" maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Fecha</label>
                <input type="date" name="inventory.date" value={formData.inventory?.date} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Supervisado por</label>
                <input type="text" name="inventory.supervisor" value={formData.inventory?.supervisor} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg" placeholder="Ej: Rafael Principal" maxLength={255}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#192d71] mb-2">Fecha (Supervisión)</label>
                <input type="date" name="inventory.supervisorDate" value={formData.inventory?.supervisorDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-[#192d71]/20 rounded-lg"/>
              </div>
            </div>
          </fieldset>

          {/* --- BOTONES DE ACCIÓN --- */}
          <div className="flex items-center justify-end space-x-4 pt-8 border-t border-[#192d71]/20">
            <button type="button" onClick={onCancel} className="flex items-center space-x-2 px-8 py-3 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg font-semibold">
              <X className="h-5 w-5" />
              <span>Cancelar</span>
            </button>
            <button type="submit" className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] text-white rounded-lg font-semibold">
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