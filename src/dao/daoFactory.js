import { EquipoMemoryDao } from './memory/EquipoMemoryDao.js';
import { JugadorMemoryDao } from './memory/JugadorMemoryDao.js';
import { PartidoMemoryDao } from './memory/PartidoMemoryDao.js';
import { createSequelizeInstance } from './sequelize/sequelize.js';
import { initModels } from './sequelize/models/index.js';
import { EquipoSequelizeDao } from './sequelize/EquipoSequelizeDao.js';
import { JugadorSequelizeDao } from './sequelize/JugadorSequelizeDao.js';
import { PartidoSequelizeDao } from './sequelize/PartidoSequelizeDao.js';
import { AppError } from '../errors/AppError.js';

export const createDaoFactory = ({ persistenceType = 'memory', sqliteConfig } = {}) => {
  const type = persistenceType.toLowerCase();

  switch (type) {
    case 'memory': {
      const equipoDao = new EquipoMemoryDao();
      const jugadorDao = new JugadorMemoryDao();
      const partidoDao = new PartidoMemoryDao();
      return {
        equipoDao,
        jugadorDao,
        partidoDao,
        init: async () => {},
      };
    }

    case 'sequelize': {
      const sequelize = createSequelizeInstance(sqliteConfig?.path);
      const models = initModels(sequelize);

      const equipoDao = new EquipoSequelizeDao({ EquipoModel: models.Equipo });
      const jugadorDao = new JugadorSequelizeDao({ JugadorModel: models.Jugador });
      const partidoDao = new PartidoSequelizeDao({ PartidoModel: models.Partido });

      return {
        equipoDao,
        jugadorDao,
        partidoDao,
        init: async () => {
          await sequelize.sync();
        },
      };
    }

    default:
      throw AppError.internal(
        `Tipo de persistencia no soportado: "${persistenceType}". Usa "memory" o "sequelize".`
      );
  }
};
