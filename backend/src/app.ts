import express from "express";
import cors from "cors";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());



app.use(cors({ origin: env.CORS_ORIGINS }));


// Middleware de logging global (para depuración)
app.use((req, _res, next) => {
  console.log(`[LOG] ${req.method} ${req.path} - body:`, req.body);
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));



app.use("/api", routes);

app.use(errorHandler);
