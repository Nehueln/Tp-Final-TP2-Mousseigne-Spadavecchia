import { createApp } from './app.js';
import { config } from './config/config.js';

const { app } = createApp();

app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` Servidor corriendo exitosamente en el puerto ${config.port}`);
  console.log(` Entorno: ${config.nodeEnv}`);
  console.log(` Persistencia activa: ${config.persistence.type}`);
  console.log(` Healthcheck: http://localhost:${config.port}/health`);
  console.log(` Equipos:     http://localhost:${config.port}/equipos`);
  console.log(` Jugadores:   http://localhost:${config.port}/jugadores`);
  console.log(` Partidos:    http://localhost:${config.port}/partidos`);
  console.log(`===============================================`);
});
