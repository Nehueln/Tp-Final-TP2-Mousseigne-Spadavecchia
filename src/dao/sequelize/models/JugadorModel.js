import { DataTypes } from 'sequelize';

export const defineJugadorModel = (sequelize) => {
  return sequelize.define(
    'Jugador',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      dni: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      numeroCamiseta: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      posicion: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      equipoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'jugadores',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['equipoId', 'numeroCamiseta'],
          name: 'unique_equipo_camiseta',
        },
      ],
    }
  );
};
