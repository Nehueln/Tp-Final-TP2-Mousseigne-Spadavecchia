export const makePartidoController = ({ partidoUseCases }) => {
  return {
    async listar(req, res, next) {
      try {
        const partidos = await partidoUseCases.listarPartidos(req.query);
        res.status(200).json({ data: partidos });
      } catch (err) {
        next(err);
      }
    },

    async obtenerPorId(req, res, next) {
      try {
        const partido = await partidoUseCases.obtenerPartidoPorId(req.params.id);
        res.status(200).json({ data: partido });
      } catch (err) {
        next(err);
      }
    },

    async crear(req, res, next) {
      try {
        const nuevoPartido = await partidoUseCases.crearPartido(req.body);
        res.status(201).json({ data: nuevoPartido });
      } catch (err) {
        next(err);
      }
    },

    async actualizar(req, res, next) {
      try {
        const partidoActualizado = await partidoUseCases.actualizarPartido(
          req.params.id,
          req.body
        );
        res.status(200).json({ data: partidoActualizado });
      } catch (err) {
        next(err);
      }
    },

    async eliminar(req, res, next) {
      try {
        await partidoUseCases.eliminarPartido(req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async finalizar(req, res, next) {
      try {
        const partidoFinalizado = await partidoUseCases.finalizarPartido(
          req.params.id,
          req.body
        );
        res.status(200).json({ data: partidoFinalizado });
      } catch (err) {
        next(err);
      }
    },
  };
};
