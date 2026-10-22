import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  createEquipoSchema,
  updateEquipoSchema,
  equipoIdParamSchema,
} from '../schemas/equipoSchema.js';

export const makeEquipoRouter = ({ equipoController }) => {
  const router = Router();

  router.get('/', equipoController.listar);

  router.get(
    '/:id',
    validate({ params: equipoIdParamSchema }),
    equipoController.obtenerPorId
  );

  router.post(
    '/',
    validate({ body: createEquipoSchema }),
    equipoController.crear
  );

  router.put(
    '/:id',
    validate({ params: equipoIdParamSchema, body: updateEquipoSchema }),
    equipoController.actualizar
  );

  router.delete(
    '/:id',
    validate({ params: equipoIdParamSchema }),
    equipoController.eliminar
  );

  return router;
};
