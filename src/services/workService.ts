import { Work } from "../models";

const API_URL = "http://localhost:5000/api/obras";

export const getWorks = async (): Promise<Work[]> => {
  const res = await fetch(API_URL);
  return res.json();
};

// src/services/workService.ts
export interface BackendWork {
  obr_mcf: string;
  obr_numeros_anteriores?: string;
  obr_titulo: string;
  obr_fecha_realizacion?: string | null;
  obr_alto_cm?: string;
  obr_ancho_cm?: string;
  obr_profundidad_cm?: string;
  obr_diametro_cm?: string;
  obr_descripcion_formal?: string;
  obr_detalles_firma?: string;
  obr_observaciones?: string;
  obr_url_foto?: string;
  obr_estado_condicion?: string;
  obr_estado_integridad?: string;
  obr_procedencia?: string;
  obr_cultura_tradicion?: string;
  obr_epoca_estilo?: string;
  obr_valor_avaluo?: string;
  obr_moneda_avaluo?: string;
  obr_responsable_avaluo?: string;
  obr_fecha_avaluo?: string | null;
  obr_propietario_original?: string;
  obr_documentos_relacionados?: string;
  obr_bibliografia?: string;
  obr_fecha_ingreso?: string | null;
  obr_fuente_adquisicion?: string;
  obr_metodo_adquisicion?: string;
  obr_entidad_responsable?: string;
  obr_cla_fk?: number;
  obr_art_fk?: number;
  obr_lu_fk?: number;
  material_id?: number;
  technique_id?: number;
}

export const createWork = async (work: BackendWork): Promise<Work> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(work),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  return res.json();
};



export const updateWork = async (id: string, work: Partial<Work>): Promise<Work> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(work),
  });
  return res.json();
};

export const deleteWork = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};
