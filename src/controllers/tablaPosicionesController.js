export const makeTablaPosicionesController = ({ tablaPosicionesUseCases }) => {
  return {
    async obtener(req, res, next) {
      try {
        const tabla = await tablaPosicionesUseCases.obtenerTablaPosiciones();
        res.status(200).json({ data: tabla });
      } catch (err) {
        next(err);
      }
    },
  };
};
