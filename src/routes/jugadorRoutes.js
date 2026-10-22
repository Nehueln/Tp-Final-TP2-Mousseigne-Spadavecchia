import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  createJugadorSchema,
  updateJugadorSchema,
  jugadorIdParamSchema,
  jugadorQuerySchema,
} from '../schemas/jugadorSchema.js';

export const makeJugadorRouter = ({ jugadorController }) => {
  const router = Router();

  router.get(
    '/',
    validate({ query: jugadorQuerySchema }),
    jugadorController.listar
  );

  router.get(
    '/:id',
    validate({ params: jugadorIdParamSchema }),
    jugadorController.obtenerPorId
  );

  router.post(
    '/',
    validate({ body: createJugadorSchema }),
    jugadorController.crear
  );

  router.put(
    '/:id',
    validate({ params: jugadorIdParamSchema, body: updateJugadorSchema }),
    jugadorController.actualizar
  );

  router.delete(
    '/:id',
    validate({ params: jugadorIdParamSchema }),
    jugadorController.eliminar
  );

  return router;
};
