import { AppError } from '../errors/AppError.js';
import { config } from '../config/config.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    });
  }

  // JSON mal formado en el body (lo lanza express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la petición no es un JSON válido',
        details: null,
      },
    });
  }

  // Error inesperado o no controlado
  console.error('[Unhandled Error]', err);

  const isDev = config.nodeEnv === 'development';

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor',
      details: isDev ? err.message : null,
    },
  });
};
