import { fn, col, where } from 'sequelize';
import { toPlain, handleSequelizeError } from './helpers.js';

export class EquipoSequelizeDao {
  constructor({ EquipoModel }) {
    this.model = EquipoModel;
  }

  async findAll() {
    try {
      const rows = await this.model.findAll({
        order: [['id', 'ASC']],
      });
      return rows.map(toPlain);
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }

  async findById(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }

  async findByNombre(nombre) {
    try {
      const normalized = nombre.trim().toLowerCase();
      const row = await this.model.findOne({
        where: where(fn('lower', col('nombre')), normalized),
      });
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }

  async create(data) {
    try {
      const created = await this.model.create({
        nombre: data.nombre.trim(),
        barrio: data.barrio.trim(),
        colores: data.colores.trim(),
        fechaFundacion: data.fechaFundacion.trim(),
      });
      return toPlain(created);
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }

  async update(id, data) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return null;

      const payload = {};
      if (data.nombre !== undefined) payload.nombre = data.nombre.trim();
      if (data.barrio !== undefined) payload.barrio = data.barrio.trim();
      if (data.colores !== undefined) payload.colores = data.colores.trim();
      if (data.fechaFundacion !== undefined) payload.fechaFundacion = data.fechaFundacion.trim();

      await row.update(payload);
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }

  async delete(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return false;

      await row.destroy();
      return true;
    } catch (err) {
      handleSequelizeError(err, 'Equipo');
    }
  }
}
