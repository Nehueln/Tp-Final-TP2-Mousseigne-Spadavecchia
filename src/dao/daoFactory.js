import { EquipoMemoryDao } from './memory/EquipoMemoryDao.js';
import { JugadorMemoryDao } from './memory/JugadorMemoryDao.js';
import { AppError } from '../errors/AppError.js';

export const createDaoFactory = ({ persistenceType = 'memory', sqliteConfig } = {}) => {
  const type = persistenceType.toLowerCase();

  switch (type) {
    case 'memory': {
      const equipoDao = new EquipoMemoryDao();
      const jugadorDao = new JugadorMemoryDao();
      return {
        equipoDao,
        jugadorDao,
      };
    }

    case 'sequelize': {
      // Se completará en la etapa de Sequelize con SQLite
      throw AppError.internal(
        'La persistencia "sequelize" aún no está inicializada. Usa PERSISTENCE_TYPE=memory.'
      );
    }

    default:
      throw AppError.internal(
        `Tipo de persistencia no soportado: "${persistenceType}". Usa "memory" o "sequelize".`
      );
  }
};
