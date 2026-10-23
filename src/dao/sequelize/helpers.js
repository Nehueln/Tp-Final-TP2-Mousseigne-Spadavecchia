import {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError,
} from 'sequelize';
import { AppError } from '../../errors/AppError.js';

/**
 * Convierte una instancia de Sequelize en un objeto plano de JS
 * asegurando fechas en formato ISO string idénticas a memoria.
 */
export const toPlain = (row) => {
  if (!row) return null;

  const plain = typeof row.get === 'function' ? row.get({ plain: true }) : { ...row };

  if (plain.createdAt instanceof Date) {
    plain.createdAt = plain.createdAt.toISOString();
  }
  if (plain.updatedAt instanceof Date) {
    plain.updatedAt = plain.updatedAt.toISOString();
  }

  // Asegurar formato YYYY-MM-DD en fechaFundacion y fecha
  if (plain.fechaFundacion instanceof Date) {
    plain.fechaFundacion = plain.fechaFundacion.toISOString().slice(0, 10);
  }
  if (plain.fecha instanceof Date) {
    plain.fecha = plain.fecha.toISOString().slice(0, 10);
  }

  return plain;
};

/**
 * Traduce errores de restricciones de Sequelize a AppError uniformes
 */
export const handleSequelizeError = (err, customEntity = 'Recurso') => {
  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path || 'campo';
    throw AppError.conflict(
      `Ya existe un registro con ese ${field} en ${customEntity}`,
      `${customEntity.toUpperCase()}_DUPLICATED`
    );
  }

  if (err instanceof ForeignKeyConstraintError) {
    throw AppError.conflict(
      `Violación de clave foránea en ${customEntity}: existen registros relacionados`,
      `${customEntity.toUpperCase()}_FOREIGN_KEY_VIOLATION`
    );
  }

  if (err instanceof ValidationError) {
    throw AppError.badRequest(err.message, 'VALIDATION_ERROR');
  }

  throw err;
};
