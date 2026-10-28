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

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Publicación de la documentación interactiva Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      persistence: config.persistence.type,
    });
  });

  // Ensamblado de dependencias desde el contenedor
  const container = createContainer({ config });

  // Monta el router que entrega el contenedor (/equipos, /jugadores)
  app.use(container.router);

  // Manejo de rutas no encontradas y errores
  app.use(notFound);
  app.use(errorHandler);

  return { app, container };
};
