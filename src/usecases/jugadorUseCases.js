import { AppError } from '../errors/AppError.js';

const LIMITE_JUGADORES_POR_EQUIPO = 25;

export const makeJugadorUseCases = ({ jugadorDao, equipoDao }) => {
  return {
    async listarJugadores(filters = {}) {
      return await jugadorDao.findAll(filters);
    },

    async obtenerJugadorPorId(id) {
      const jugador = await jugadorDao.findById(id);
      if (!jugador) {
        throw AppError.notFound(`No se encontró el jugador con ID ${id}`, 'JUGADOR_NOT_FOUND');
      }
      return jugador;
    },

    async crearJugador(data) {
      // 1. Validar que el equipo exista
      const equipo = await equipoDao.findById(data.equipoId);
      if (!equipo) {
        throw AppError.notFound(
          `No se puede crear el jugador: el equipo con ID ${data.equipoId} no existe`,
          'EQUIPO_NOT_FOUND'
        );
      }

      // 2. Validar que no se supere el cupo máximo de 25 jugadores
      const totalJugadores = await jugadorDao.countByEquipo(data.equipoId);
      if (totalJugadores >= LIMITE_JUGADORES_POR_EQUIPO) {
        throw AppError.conflict(
          `El equipo "${equipo.nombre}" ya alcanzó el cupo máximo permitido de ${LIMITE_JUGADORES_POR_EQUIPO} jugadores`,
          'EQUIPO_CUPO_MAXIMO'
        );
      }

      // 3. Validar DNI único en todo el torneo
      const jugadorConMismoDni = await jugadorDao.findByDni(data.dni);
      if (jugadorConMismoDni) {
        throw AppError.conflict(
          `Ya existe un jugador registrado con el DNI ${data.dni}`,
          'JUGADOR_DNI_DUPLICATED'
        );
      }

      // 4. Validar número de camiseta único en ese equipo
      const jugadorConMismaCamiseta = await jugadorDao.findByEquipoAndCamiseta(
        data.equipoId,
        data.numeroCamiseta
      );
      if (jugadorConMismaCamiseta) {
        throw AppError.conflict(
          `El número de camiseta ${data.numeroCamiseta} ya está ocupado en el equipo "${equipo.nombre}"`,
          'CAMISETA_DUPLICATED'
        );
      }

      return await jugadorDao.create(data);
    },

    async actualizarJugador(id, data) {
      // 1. Verificar existencia del jugador
      const jugadorActual = await jugadorDao.findById(id);
      if (!jugadorActual) {
        throw AppError.notFound(`No se encontró el jugador con ID ${id}`, 'JUGADOR_NOT_FOUND');
      }

      const equipoDestinoId = data.equipoId !== undefined ? data.equipoId : jugadorActual.equipoId;

      // 2. Si cambia de equipo, verificar que el nuevo equipo exista y no esté lleno
      if (data.equipoId !== undefined && data.equipoId !== jugadorActual.equipoId) {
        const nuevoEquipo = await equipoDao.findById(data.equipoId);
        if (!nuevoEquipo) {
          throw AppError.notFound(
            `El equipo de destino con ID ${data.equipoId} no existe`,
            'EQUIPO_NOT_FOUND'
          );
        }

        const totalEnNuevoEquipo = await jugadorDao.countByEquipo(data.equipoId);
        if (totalEnNuevoEquipo >= LIMITE_JUGADORES_POR_EQUIPO) {
          throw AppError.conflict(
            `El equipo de destino "${nuevoEquipo.nombre}" ya tiene el cupo máximo de ${LIMITE_JUGADORES_POR_EQUIPO} jugadores`,
            'EQUIPO_CUPO_MAXIMO'
          );
        }
      }

      // 3. Si actualiza DNI, verificar que no pertenezca a otro jugador
      if (data.dni && String(data.dni).trim() !== String(jugadorActual.dni).trim()) {
        const otroConDni = await jugadorDao.findByDni(data.dni);
        if (otroConDni && otroConDni.id !== jugadorActual.id) {
          throw AppError.conflict(
            `Ya existe otro jugador registrado con el DNI ${data.dni}`,
            'JUGADOR_DNI_DUPLICATED'
          );
        }
      }

      // 4. Si actualiza camiseta o equipo, verificar que no colisione
      const nuevaCamiseta = data.numeroCamiseta !== undefined ? data.numeroCamiseta : jugadorActual.numeroCamiseta;
      if (
        (data.numeroCamiseta !== undefined && data.numeroCamiseta !== jugadorActual.numeroCamiseta) ||
        (data.equipoId !== undefined && data.equipoId !== jugadorActual.equipoId)
      ) {
        const otroConMismaCamiseta = await jugadorDao.findByEquipoAndCamiseta(
          equipoDestinoId,
          nuevaCamiseta
        );
        if (otroConMismaCamiseta && otroConMismaCamiseta.id !== jugadorActual.id) {
          throw AppError.conflict(
            `El número de camiseta ${nuevaCamiseta} ya está ocupado en el equipo`,
            'CAMISETA_DUPLICATED'
          );
        }
      }

      return await jugadorDao.update(id, data);
    },

    async eliminarJugador(id) {
      const existe = await jugadorDao.findById(id);
      if (!existe) {
        throw AppError.notFound(`No se encontró el jugador con ID ${id}`, 'JUGADOR_NOT_FOUND');
      }
      await jugadorDao.delete(id);
      return { id: Number(id) };
    },
  };
};
