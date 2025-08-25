//backend/src/app.ts

import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());



app.use(cors({ origin: "*" }));


// Middleware de logging global (para depuración)
app.use((req, _res, next) => {
  console.log(`[LOG] ${req.method} ${req.path} - body:`, req.body);
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Servir la carpeta uploads de manera pública
// Ahora cualquier imagen será accesible via: http://IP_DEL_SERVIDOR:5000/uploads/obras/archivo.jpg
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", routes);

app.use(errorHandler);
