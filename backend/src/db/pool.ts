
// db/POOL.ts
import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  host: env.DBHOST,
  port: env.DBPORT,
  database: env.DBNAME,
  user: env.DBUSER,
  password: env.DBPASSWORD,
});
