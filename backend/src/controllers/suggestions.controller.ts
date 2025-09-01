import { Request, Response } from 'express';
import { pool } from '../db/pool';

const getSuggestions = async (tableName: string, columnName: string, res: Response) => {
  try {
    const query = `SELECT DISTINCT ${columnName} FROM ${tableName} ORDER BY ${columnName} ASC`;
    const result = await pool.query(query);
    // Extraemos solo el string del resultado
    const suggestions = result.rows.map(row => row[columnName]);
    res.json(suggestions);
  } catch (err) {
    console.error(`Error obteniendo sugerencias de ${tableName}:`, err);
    res.status(500).json({ error: `Error interno del servidor` });
  }
};

export const getArtistas = (_req: Request, res: Response) => {
  getSuggestions('Artista', 'art_nombre', res);
};

export const getClasificaciones = (_req: Request, res: Response) => {
  getSuggestions('Clasificacion', 'cla_nombre', res);
};

export const getMateriales = (_req: Request, res: Response) => {
  getSuggestions('Material', 'mat_nombre', res);
};

export const getTecnicas = (_req: Request, res: Response) => {
  getSuggestions('Tecnica', 'tec_nombre', res);
};
