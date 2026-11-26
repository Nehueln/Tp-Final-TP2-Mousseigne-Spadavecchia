/**
 * Ordena (opcional) y pagina (opcional) un array ya resuelto por un DAO.
 *
 * Diseñado para ser 100% retrocompatible: si no se envía `page` ni `limit`,
 * devuelve el array completo (ordenado si se pidió `sort`), exactamente
 * como se comportaba `listar...()` antes de agregar paginación. Esto evita
 * romper `npm run smoke` / `npm run parity`, que llaman a los endpoints
 * sin estos query params.
 *
 * @param {Array<object>} lista - Array plano ya devuelto por el DAO (`findAll`).
 * @param {{ page?: number, limit?: number, sort?: string, order?: 'asc'|'desc' }} opciones
 * @returns {Array<object> | { data: Array<object>, meta: { page: number, limit: number, total: number, totalPages: number } }}
 */
export const paginarYOrdenar = (lista, { page, limit, sort, order } = {}) => {
  let resultado = [...lista];

  if (sort) {
    resultado.sort((a, b) => {
      const valorA = a[sort];
      const valorB = b[sort];
      const comparacion = valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      return order === 'desc' ? -comparacion : comparacion;
    });
  }

  // Sin page ni limit: comportamiento original, array plano sin envoltorio.
  if (page === undefined && limit === undefined) {
    return resultado;
  }

  const paginaFinal = page ?? 1;
  const limiteFinal = limit ?? 10;
  const total = resultado.length;
  const inicio = (paginaFinal - 1) * limiteFinal;
  const data = resultado.slice(inicio, inicio + limiteFinal);

  return {
    data,
    meta: {
      page: paginaFinal,
      limit: limiteFinal,
      total,
      totalPages: Math.ceil(total / limiteFinal),
    },
  };
};
