import { Sequelize } from 'sequelize';
import { config } from '../../config/config.js';

export const createSequelizeInstance = (customStorage) => {
  const storage = customStorage || config.persistence.sqlite.path || './database.sqlite';

  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: {
      timestamps: true,
    },
  });

  return sequelize;
};
