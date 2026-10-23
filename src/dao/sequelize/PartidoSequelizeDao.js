import { Op } from 'sequelize';
import { toPlain, handleSequelizeError } from './helpers.js';

export class PartidoSequelizeDao {
  constructor({ PartidoModel }) {
    this.model = PartidoModel;
  }

  async findAll(filters = {}) {
    try {
      const where = {};

      if (filters.estado) {
        where.estado = filters.estado;
      }

      if (filters.equipoId !== undefined) {
        const eqId = Number(filters.equipoId);
        where[Op.or] = [{ localId: eqId }, { visitanteId: eqId }];
      }

      const rows = await this.model.findAll({
        where,
        order: [['id', 'ASC']],
      });

      return rows.map(toPlain);
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }

  async findById(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }

  async countByEquipo(equipoId) {
    try {
      const eqId = Number(equipoId);
      return await this.model.count({
        where: {
          [Op.or]: [{ localId: eqId }, { visitanteId: eqId }],
        },
      });
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }

  async create(data) {
    try {
      const created = await this.model.create({
        localId: Number(data.localId),
        visitanteId: Number(data.visitanteId),
        fecha: data.fecha.trim(),
        golesLocal: 0,
        golesVisitante: 0,
        estado: 'programado',
      });
      return toPlain(created);
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }

  async update(id, data) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return null;

      const payload = {};
      if (data.localId !== undefined) payload.localId = Number(data.localId);
      if (data.visitanteId !== undefined) payload.visitanteId = Number(data.visitanteId);
      if (data.fecha !== undefined) payload.fecha = data.fecha.trim();
      if (data.golesLocal !== undefined) payload.golesLocal = Number(data.golesLocal);
      if (data.golesVisitante !== undefined) payload.golesVisitante = Number(data.golesVisitante);
      if (data.estado !== undefined) payload.estado = data.estado;

      await row.update(payload);
      return toPlain(row);
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }

  async delete(id) {
    try {
      const row = await this.model.findByPk(Number(id));
      if (!row) return false;

      await row.destroy();
      return true;
    } catch (err) {
      handleSequelizeError(err, 'Partido');
    }
  }
}
