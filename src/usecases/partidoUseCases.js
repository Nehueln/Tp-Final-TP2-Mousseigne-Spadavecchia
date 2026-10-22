import { AppError } from '../errors/AppError.js';

export const makePartidoUseCases = ({ partidoDao, equipoDao }) => {
  return {
    async listarPartidos(filters = {}) {
      return await partidoDao.findAll(filters);
    },

    async obtenerPartidoPorId(id) {
      const partido = await partidoDao.findById(id);
      if (!partido) {
        throw AppError.notFound(`No se encontró el partido con ID ${id}`, 'PARTIDO_NOT_FOUND');
      }
      return partido;
    },

    async crearPartido(data) {
      // 1. Validar que local y visitante no sean el mismo equipo
      if (Number(data.localId) === Number(data.visitanteId)) {
        throw AppError.badRequest(
          'El equipo local y el visitante deben ser distintos',
          'PARTIDO_EQUIPOS_IGUALES'
        );
      }

      // 2. Validar que ambos equipos existan
      const local = await equipoDao.findById(data.localId);
      if (!local) {
        throw AppError.notFound(
          `No se puede crear el partido: el equipo local con ID ${data.localId} no existe`,
          'EQUIPO_NOT_FOUND'
        );
      }

      const visitante = await equipoDao.findById(data.visitanteId);
      if (!visitante) {
        throw AppError.notFound(
          `No se puede crear el partido: el equipo visitante con ID ${data.visitanteId} no existe`,
          'EQUIPO_NOT_FOUND'
        );
      }

      return await partidoDao.create(data);
    },

    async actualizarPartido(id, data) {
      // 1. Verificar existencia del partido
      const partidoActual = await partidoDao.findById(id);
      if (!partidoActual) {
        throw AppError.notFound(`No se encontró el partido con ID ${id}`, 'PARTIDO_NOT_FOUND');
      }

      // 2. No se puede modificar un partido ya finalizado
      if (partidoActual.estado === 'finalizado') {
        throw AppError.conflict(
          'No se puede modificar un partido que ya ha sido finalizado',
          'PARTIDO_FINALIZADO'
        );
      }

      // 3. Obtener valores resultantes para localId y visitanteId
      const localIdFinal = data.localId !== undefined ? Number(data.localId) : partidoActual.localId;
      const visitanteIdFinal =
        data.visitanteId !== undefined ? Number(data.visitanteId) : partidoActual.visitanteId;

      if (localIdFinal === visitanteIdFinal) {
        throw AppError.badRequest(
          'El equipo local y el visitante deben ser distintos',
          'PARTIDO_EQUIPOS_IGUALES'
        );
      }

      // 4. Si cambia algún equipo, verificar su existencia
      if (data.localId !== undefined && Number(data.localId) !== partidoActual.localId) {
        const local = await equipoDao.findById(data.localId);
        if (!local) {
          throw AppError.notFound(
            `El equipo local con ID ${data.localId} no existe`,
            'EQUIPO_NOT_FOUND'
          );
        }
      }

      if (data.visitanteId !== undefined && Number(data.visitanteId) !== partidoActual.visitanteId) {
        const visitante = await equipoDao.findById(data.visitanteId);
        if (!visitante) {
          throw AppError.notFound(
            `El equipo visitante con ID ${data.visitanteId} no existe`,
            'EQUIPO_NOT_FOUND'
          );
        }
      }

      return await partidoDao.update(id, data);
    },

    async eliminarPartido(id) {
      // 1. Verificar existencia
      const partido = await partidoDao.findById(id);
      if (!partido) {
        throw AppError.notFound(`No se encontró el partido con ID ${id}`, 'PARTIDO_NOT_FOUND');
      }

      // 2. No se puede eliminar un partido finalizado
      if (partido.estado === 'finalizado') {
        throw AppError.conflict(
          'No se puede eliminar un partido que ya ha sido finalizado',
          'PARTIDO_FINALIZADO'
        );
      }

      await partidoDao.delete(id);
      return { id: Number(id) };
    },

    async finalizarPartido(id, { golesLocal, golesVisitante }) {
      // 1. Verificar existencia
      const partido = await partidoDao.findById(id);
      if (!partido) {
        throw AppError.notFound(`No se encontró el partido con ID ${id}`, 'PARTIDO_NOT_FOUND');
      }

      // 2. Verificar que no esté ya finalizado
      if (partido.estado === 'finalizado') {
        throw AppError.conflict(
          'El partido ya se encuentra finalizado',
          'PARTIDO_YA_FINALIZADO'
        );
      }

      // 3. Persistir cambio de estado y resultado
      const partidoActualizado = await partidoDao.update(id, {
        golesLocal: Number(golesLocal),
        golesVisitante: Number(golesVisitante),
        estado: 'finalizado',
      });

      // Semana 4: emitir partido.finalizado

      return partidoActualizado;
    },
  };
};
