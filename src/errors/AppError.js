export class AppError extends Error {
  /**
   * @param {string} message - Mensaje legible del error
   * @param {number} statusCode - Código HTTP (400, 404, 409, etc.)
   * @param {string} code - Código de error de dominio (ej. 'NOT_FOUND', 'VALIDATION_ERROR')
   * @param {any} [details=null] - Detalles adicionales (ej. lista de errores de Zod)
   */
  constructor(message, statusCode = 400, code = 'APP_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, code, details);
  }

  static notFound(message = 'Recurso no encontrado', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = 'CONFLICT', details = null) {
    return new AppError(message, 409, code, details);
  }

  static internal(message = 'Error interno del servidor', code = 'INTERNAL_ERROR') {
    return new AppError(message, 500, code);
  }
}
