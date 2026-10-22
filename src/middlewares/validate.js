import { AppError } from '../errors/AppError.js';

/**
 * Middleware para validar `body`, `params` y/o `query` usando esquemas de Zod.
 * @param {object} schemas - Objeto con esquemas opcionales: { body, params, query }
 */
export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(
          new AppError('Error de validación en la petición', 400, 'VALIDATION_ERROR', details)
        );
      }
      next(err);
    }
  };
};
