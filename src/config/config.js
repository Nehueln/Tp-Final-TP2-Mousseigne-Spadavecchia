import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  persistence: {
    type: (process.env.PERSISTENCE_TYPE || 'memory').toLowerCase(),
    sqlite: {
      path: process.env.SQLITE_PATH || './database.sqlite',
    },
  },
  notifier: {
    type: (process.env.NOTIFIER_TYPE || 'console').toLowerCase(),
    filePath: process.env.NOTIFIER_FILE_PATH || './logs/eventos.log',
  },
};
