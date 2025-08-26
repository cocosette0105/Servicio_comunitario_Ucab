// backend/src/models/historial-movimiento.model.ts

import { PoolClient, QueryResult } from 'pg';

export interface HistorialMovimiento {
    his_mov_fecha: Date;
    his_tip_movimiento: string;
    his_mov_motiv: string | null;
    his_mov_notas: string | null;
    his_mov_obr_id_fk: number;
    his_mov_envia_fk: number | null;
    his_mov_usu_id_fk: number;
    his_mov_recibe_fk: number | null;
}