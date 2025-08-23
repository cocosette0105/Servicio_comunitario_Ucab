// config/env.ts
import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
 CORS_ORIGINS: ["http://localhost:5173", "http://localhost:5174"],
  DBHOST: process.env.DB_HOST,
  DBPORT: Number(process.env.DB_PORT),
  DBNAME: process.env.DB_NAME,
  DBUSER: process.env.DB_USER,
  DBPASSWORD: process.env.DB_PASSWORD,
};
