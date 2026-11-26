export const makeEquipoController = ({ equipoUseCases }) => {
  return {
    async listar(req, res, next) {
      try {
        const resultado = await equipoUseCases.listarEquipos(req.query);
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
        const equipo = await equipoUseCases.obtenerEquipoPorId(req.params.id);
        res.status(200).json({ data: equipo });
      } catch (err) {
        next(err);
      }
    },

    async crear(req, res, next) {
      try {
        const nuevoEquipo = await equipoUseCases.crearEquipo(req.body);
        res.status(201).json({ data: nuevoEquipo });
      } catch (err) {
        next(err);
      }
    },

    async actualizar(req, res, next) {
      try {
        const equipoActualizado = await equipoUseCases.actualizarEquipo(req.params.id, req.body);
        res.status(200).json({ data: equipoActualizado });
      } catch (err) {
        next(err);
      }
    },

    async eliminar(req, res, next) {
      try {
        await equipoUseCases.eliminarEquipo(req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
};
