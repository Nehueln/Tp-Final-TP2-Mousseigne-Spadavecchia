import { z } from 'zod';

/**
 * Genera el esquema Zod reutilizable para paginación/orden en los query params
 * de cualquier `GET /entidad`. `sortFields` restringe `?sort=` a una lista
 * cerrada de columnas válidas de esa entidad (nunca texto libre).
 *
 * @param {string[]} sortFields - Campos por los que se puede ordenar esta entidad.
 */
export const makePaginationQuerySchema = (sortFields) =>
  z.object({
    page: z.coerce
      .number()
      .int('La página debe ser un número entero')
      .positive('La página debe ser mayor a 0')
      .optional(),
    limit: z.coerce
      .number()
      .int('El límite debe ser un número entero')
      .positive('El límite debe ser mayor a 0')
      .max(100, 'El límite no puede superar 100 resultados por página')
      .optional(),
    sort: z
      .enum(sortFields, {
        errorMap: () => ({
          message: `El campo de orden (sort) debe ser uno de: ${sortFields.join(', ')}`,
        }),
      })
      .optional(),
    order: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: "El orden (order) debe ser 'asc' o 'desc'" }),
      })
      .optional(),
  });
