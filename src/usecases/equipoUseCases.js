import { AppError } from '../errors/AppError.js';

export const makeEquipoUseCases = ({ equipoDao, jugadorDao, partidoDao }) => {
  return {
    async listarEquipos() {
      return await equipoDao.findAll();
    },

    async obtenerEquipoPorId(id) {
      const equipo = await equipoDao.findById(id);
      if (!equipo) {
        throw AppError.notFound(`No se encontró el equipo con ID ${id}`, 'EQUIPO_NOT_FOUND');
      }
      return equipo;
    },

    async crearEquipo(data) {
      const existeConMismoNombre = await equipoDao.findByNombre(data.nombre);
      if (existeConMismoNombre) {
        throw AppError.conflict(
          `Ya existe un equipo registrado con el nombre "${data.nombre}"`,
          'EQUIPO_NAME_DUPLICATED'
        );
      }
      return await equipoDao.create(data);
    },

    async actualizarEquipo(id, data) {
      // 1. Verificar existencia
      const equipoActual = await equipoDao.findById(id);
      if (!equipoActual) {
        throw AppError.notFound(`No se encontró el equipo con ID ${id}`, 'EQUIPO_NOT_FOUND');
      }

      // 2. Si intenta cambiar el nombre, verificar que no esté ocupado por otro equipo
      if (data.nombre && data.nombre.trim().toLowerCase() !== equipoActual.nombre.trim().toLowerCase()) {
        const otroConMismoNombre = await equipoDao.findByNombre(data.nombre);
        if (otroConMismoNombre && otroConMismoNombre.id !== equipoActual.id) {
          throw AppError.conflict(
            `Ya existe otro equipo registrado con el nombre "${data.nombre}"`,
            'EQUIPO_NAME_DUPLICATED'
          );
        }
      }

      return await equipoDao.update(id, data);
    },

    async eliminarEquipo(id) {
      const existe = await equipoDao.findById(id);
      if (!existe) {
        throw AppError.notFound(`No se encontró el equipo con ID ${id}`, 'EQUIPO_NOT_FOUND');
      }

      // Regla de negocio: no se puede eliminar un equipo que tenga jugadores registrados.
      const totalJugadores = await jugadorDao.countByEquipo(id);
      if (totalJugadores > 0) {
        throw AppError.conflict(
          `No se puede eliminar el equipo "${existe.nombre}": tiene ${totalJugadores} jugador(es) registrado(s)`,
          'EQUIPO_CON_JUGADORES'
        );
      }

      // Regla de negocio: no se puede eliminar un equipo que tenga partidos (local o visitante).
      if (partidoDao) {
        const totalPartidos = await partidoDao.countByEquipo(id);
        if (totalPartidos > 0) {
          throw AppError.conflict(
            `No se puede eliminar el equipo "${existe.nombre}": tiene ${totalPartidos} partido(s) registrado(s)`,
            'EQUIPO_CON_PARTIDOS'
          );
        }
      }

      await equipoDao.delete(id);
      return { id: Number(id) };
    },
  };
};
