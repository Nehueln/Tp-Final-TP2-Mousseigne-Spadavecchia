export const makeJugadorController = ({ jugadorUseCases }) => {
  return {
    async listar(req, res, next) {
      try {
        const resultado = await jugadorUseCases.listarJugadores(req.query);
        if (Array.isArray(resultado)) {
          res.status(200).json({ data: resultado });
        } else {
          res.status(200).json(resultado);
        }
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
        const nuevoJugador = await jugadorUseCases.crearJugador(req.body); //responde 201 Nuevo Jugador.
        res.status(201).json({ data: nuevoJugador });
      } catch (err) {
        next(err); // handler error
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
