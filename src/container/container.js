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
import { createEventBus } from '../events/eventBus.js';
import { createNotifier } from '../events/notifiers/createNotifier.js';
import { registerPartidoListeners } from '../events/listeners/partidoListeners.js';

export const createContainer = ({ config }) => {
  // 1. Instanciar Bus de Eventos y Notificador desacoplado
  const eventBus = createEventBus();
  const notifier = createNotifier({
    type: config.notifier?.type,
    filePath: config.notifier?.filePath,
  });

  // Registrar listeners de dominio
  registerPartidoListeners({ eventBus, notifier });

  // 2. Resolver DAOs mediante la factory (memory o sequelize)
  const daos = createDaoFactory({
    persistenceType: config.persistence.type,
    sqliteConfig: config.persistence.sqlite,
  });

  // 3. Instanciar Casos de Uso con los DAOs y EventBus inyectados
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
    eventBus,
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
    eventBus,
    notifier,
    useCases: {
      equipoUseCases,
      jugadorUseCases,
      partidoUseCases,
    },
  };
};
