import { defineEquipoModel } from './EquipoModel.js';
import { defineJugadorModel } from './JugadorModel.js';
import { definePartidoModel } from './PartidoModel.js';

export const initModels = (sequelize) => {
  const Equipo = defineEquipoModel(sequelize);
  const Jugador = defineJugadorModel(sequelize);
  const Partido = definePartidoModel(sequelize);

  // Asociaciones centralizadas
  Equipo.hasMany(Jugador, {
    foreignKey: 'equipoId',
    as: 'jugadores',
    onDelete: 'RESTRICT',
  });
  Jugador.belongsTo(Equipo, {
    foreignKey: 'equipoId',
    as: 'equipo',
  });

  Partido.belongsTo(Equipo, {
    as: 'local',
    foreignKey: 'localId',
  });
  Partido.belongsTo(Equipo, {
    as: 'visitante',
    foreignKey: 'visitanteId',
  });

  Equipo.hasMany(Partido, {
    as: 'partidosLocal',
    foreignKey: 'localId',
    onDelete: 'RESTRICT',
  });
  Equipo.hasMany(Partido, {
    as: 'partidosVisitante',
    foreignKey: 'visitanteId',
    onDelete: 'RESTRICT',
  });

  return {
    Equipo,
    Jugador,
    Partido,
  };
};
