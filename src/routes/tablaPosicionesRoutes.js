import { Router } from 'express';

export const makeTablaPosicionesRouter = ({ tablaPosicionesController }) => {
  const router = Router();

  router.get('/', tablaPosicionesController.obtener);

  return router;
};
