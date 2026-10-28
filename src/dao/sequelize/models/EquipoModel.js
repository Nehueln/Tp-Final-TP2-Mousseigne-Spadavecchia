import { DataTypes } from 'sequelize';

export const defineEquipoModel = (sequelize) => {
  return sequelize.define(
    'Equipo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      barrio: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      colores: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fechaFundacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: 'equipos',
      timestamps: true,
    }
  );
};
