import { DataTypes } from 'sequelize';

export const definePartidoModel = (sequelize) => {
  return sequelize.define(
    'Partido',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      localId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visitanteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      golesLocal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      golesVisitante: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'programado',
      },
    },
    {
      tableName: 'partidos',
      timestamps: true,
    }
  );
};
