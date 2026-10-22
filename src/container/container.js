import { Router } from 'express';
import { createDaoFactory } from '../dao/daoFactory.js';
import { makeEquipoUseCases } from '../usecases/equipoUseCases.js';
import { makeEquipoController } from '../controllers/equipoController.js';
import { makeEquipoRouter } from '../routes/equipoRoutes.js';
import { makeJugadorUseCases } from '../usecases/jugadorUseCases.js';
import { makeJugadorController } from '../controllers/jugadorController.js';
import { makeJugadorRouter } from '../routes/jugadorRoutes.js';
import { makePartidoUseCases } from '../usecases/partidoUseCases.js';
import { makePartidoController } from '../controllers/partidoController.js';
import { makePartidoRouter } from '../routes/partidoRoutes.js';

export const createContainer = ({ config }) => {
  // 1. Resolver DAOs mediante la factory (memory o sequelize)
  const daos = createDaoFactory({
    persistenceType: config.persistence.type,
    sqliteConfig: config.persistence.sqlite,
  });

  // 2. Instanciar Casos de Uso con los DAOs inyectados
  const equipoUseCases = makeEquipoUseCases({
    equipoDao: daos.equipoDao,
    jugadorDao: daos.jugadorDao, // para impedir borrar equipos con jugadores
    partidoDao: daos.partidoDao, // para impedir borrar equipos con partidos
  });

  const jugadorUseCases = makeJugadorUseCases({
    jugadorDao: daos.jugadorDao,
    equipoDao: daos.equipoDao,
  });

  const partidoUseCases = makePartidoUseCases({
    partidoDao: daos.partidoDao,
    equipoDao: daos.equipoDao,
  });

  // 3. Instanciar Controladores con los Casos de Uso inyectados
  const equipoController = makeEquipoController({
    equipoUseCases,
  });

  const jugadorController = makeJugadorController({
    jugadorUseCases,
  });

  const partidoController = makePartidoController({
    partidoUseCases,
  });

  // 4. Montar Routers con sus prefijos (/equipos, /jugadores, /partidos)
  const router = Router();

  router.use('/equipos', makeEquipoRouter({ equipoController }));
  router.use('/jugadores', makeJugadorRouter({ jugadorController }));
  router.use('/partidos', makePartidoRouter({ partidoController }));

  return {
    router,
    daos,
    useCases: {
      equipoUseCases,
      jugadorUseCases,
      partidoUseCases,
    },
  };
};
