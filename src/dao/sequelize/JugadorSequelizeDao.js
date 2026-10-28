import { toPlain, handleSequelizeError } from './helpers.js';

export class JugadorSequelizeDao {
  constructor({ JugadorModel }) {
    this.model = JugadorModel;
  }

  async findAll(filters = {}) {
    try {
      const where = {};
      if (filters.equipoId !== undefined) {
        where.equipoId = Number(filters.equipoId);
      }
      if (filters.posicion) {
        where.posicion = filters.posicion;
      }

      const rows = await this.model.findAll({
        where,
        order: [['id', 'ASC']],
      });

      return rows.map(toPlain);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async findById(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async findByDni(dni) {
    try {
      const row = await this.model.findOne({
        where: { dni: String(dni).trim() },
      });
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async findByEquipoAndCamiseta(equipoId, numeroCamiseta) {
    try {
      const row = await this.model.findOne({
        where: {
          equipoId: Number(equipoId),
          numeroCamiseta: Number(numeroCamiseta),
        },
      });
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async countByEquipo(equipoId) {
    try {
      return await this.model.count({
        where: { equipoId: Number(equipoId) },
      });
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async create(data) {
    try {
      const created = await this.model.create({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        dni: String(data.dni).trim(),
        numeroCamiseta: Number(data.numeroCamiseta),
        posicion: data.posicion,
        equipoId: Number(data.equipoId),
      });
      return toPlain(created);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async update(id, data) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return null;

      const payload = {};
      if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
      if (data.apellido !== undefined) payload.apellido = data.apellido.trim();
      if (data.dni !== undefined) payload.dni = String(data.dni).trim();
      if (data.numeroCamiseta !== undefined) payload.numeroCamiseta = Number(data.numeroCamiseta);
      if (data.posicion !== undefined) payload.posicion = data.posicion;
      if (data.equipoId !== undefined) payload.equipoId = Number(data.equipoId);

      await row.update(payload);
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }

  async delete(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return false;

      await row.destroy();
      return true;
    } catch (err) {
      handleSequelizeError(err, 'Jugador');
    }
  }
}
