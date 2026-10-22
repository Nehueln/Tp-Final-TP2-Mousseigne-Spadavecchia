import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  createPartidoSchema,
  updatePartidoSchema,
  finalizarPartidoSchema,
  partidoIdParamSchema,
  partidoQuerySchema,
} from '../schemas/partidoSchema.js';

export const makePartidoRouter = ({ partidoController }) => {
  const router = Router();

  router.get(
    '/',
    validate({ query: partidoQuerySchema }),
    partidoController.listar
  );

  router.get(
    '/:id',
    validate({ params: partidoIdParamSchema }),
    partidoController.obtenerPorId
  );

  router.post(
    '/',
    validate({ body: createPartidoSchema }),
    partidoController.crear
  );

  router.put(
    '/:id',
    validate({ params: partidoIdParamSchema, body: updatePartidoSchema }),
    partidoController.actualizar
  );

  router.delete(
    '/:id',
    validate({ params: partidoIdParamSchema }),
    partidoController.eliminar
  );

  router.post(
    '/:id/finalizar',
    validate({ params: partidoIdParamSchema, body: finalizarPartidoSchema }),
    partidoController.finalizar
  );

  return router;
};
