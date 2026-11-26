import express from 'express';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { createContainer } from './container/container.js';
import { config } from './config/config.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

// Carga de la especificación OpenAPI 3
const openapiDocument = YAML.parse(
  readFileSync(new URL('./docs/openapi.yaml', import.meta.url), 'utf-8')
);

// Crea Express
export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Publicación de la documentación interactiva Swagger UI y el health para chequeo rapido.
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      persistence: config.persistence.type,
    });
  });

  // Llama a createContainer({ config }) (que arma los DAOs, Casos de Uso, Controladores y Rutas de /equipos, /jugadores y /partidos).
  const container = createContainer({ config });

  // Monta el router que entrega el contenedor (/equipos, /jugadores)
  app.use(container.router);

  // Manejo de rutas no encontradas y errores
  app.use(notFound); // Errores de ruta al endpoint 404 ROUTE_NOT_FOUND.
  app.use(errorHandler); // Va último de todo porque es la red que atrapa cualquier error (400, 404, 409, 500) que haya ocurrido en los pasos de arriba.

  return { app, container };
};
