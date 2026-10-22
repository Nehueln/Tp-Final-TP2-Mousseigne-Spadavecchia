export const makeJugadorController = ({ jugadorUseCases }) => {
  return {
    async listar(req, res, next) {
      try {
        const jugadores = await jugadorUseCases.listarJugadores(req.query);
        res.status(200).json({ data: jugadores });
      } catch (err) {
        next(err);
      }
    },

    async obtenerPorId(req, res, next) {
      try {
        const jugador = await jugadorUseCases.obtenerJugadorPorId(req.params.id);
        res.status(200).json({ data: jugador });
      } catch (err) {
        next(err);
      }
    },

    async crear(req, res, next) {
      try {
        const nuevoJugador = await jugadorUseCases.crearJugador(req.body);
        res.status(201).json({ data: nuevoJugador });
      } catch (err) {
        next(err);
      }
    },

    async actualizar(req, res, next) {
      try {
        const jugadorActualizado = await jugadorUseCases.actualizarJugador(
          req.params.id,
          req.body
        );
        res.status(200).json({ data: jugadorActualizado });
      } catch (err) {
        next(err);
      }
    },

    async eliminar(req, res, next) {
      try {
        await jugadorUseCases.eliminarJugador(req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
};
