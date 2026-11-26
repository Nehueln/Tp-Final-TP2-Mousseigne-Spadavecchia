/**
 * Caso de uso de solo lectura: calcula la tabla de posiciones de la liga
 * a partir de los partidos `finalizado`. No requiere DAO ni tabla propia:
 * es un dato 100% derivado de `equipoDao` y `partidoDao`, que ya existen
 * y funcionan igual en modo `memory` y `sequelize`.
 *
 * Puntaje: 3 puntos por victoria, 1 por empate, 0 por derrota.
 * Orden: puntos desc -> diferencia de gol desc -> goles a favor desc -> nombre asc
 * (el último criterio garantiza un orden determinístico en caso de empate total).
 */
export const makeTablaPosicionesUseCases = ({ equipoDao, partidoDao }) => {
  return {
    async obtenerTablaPosiciones() {
      const equipos = await equipoDao.findAll();
      const partidosFinalizados = await partidoDao.findAll({ estado: 'finalizado' });

      const tabla = new Map(
        equipos.map((equipo) => [
          equipo.id,
          {
            equipoId: equipo.id,
            nombre: equipo.nombre,
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dg: 0,
            pts: 0,
          },
        ])
      );

      for (const partido of partidosFinalizados) {
        const local = tabla.get(partido.localId);
        const visitante = tabla.get(partido.visitanteId);
        // Si alguno de los equipos ya no existe, se ignora ese partido en la tabla.
        if (!local || !visitante) continue;

        local.pj += 1;
        visitante.pj += 1;
        local.gf += partido.golesLocal;
        local.gc += partido.golesVisitante;
        visitante.gf += partido.golesVisitante;
        visitante.gc += partido.golesLocal;

        if (partido.golesLocal > partido.golesVisitante) {
          local.pg += 1;
          local.pts += 3;
          visitante.pp += 1;
        } else if (partido.golesLocal < partido.golesVisitante) {
          visitante.pg += 1;
          visitante.pts += 3;
          local.pp += 1;
        } else {
          local.pe += 1;
          visitante.pe += 1;
          local.pts += 1;
          visitante.pts += 1;
        }
      }

      const resultado = [...tabla.values()].map((fila) => ({
        ...fila,
        dg: fila.gf - fila.gc,
      }));

      resultado.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.nombre.localeCompare(b.nombre);
      });

      return resultado;
    },
  };
};
