//backend/src/index.ts
import { app } from "./app";
import { env } from "./config/env";

app.listen(Number(env.PORT), "0.0.0.0", () => {
  console.log(`Servidor API escuchando en http://0.0.0.0:${env.PORT}`);
});

