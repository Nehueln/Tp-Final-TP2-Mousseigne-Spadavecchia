export class PartidoMemoryDao {
  constructor() {
    this.partidos = [];
    this.currentId = 1;
  }

  async findAll(filters = {}) {
    let result = [...this.partidos];

    if (filters.estado) {
      result = result.filter((p) => p.estado === filters.estado);
    }

    if (filters.equipoId !== undefined) {
      const eqId = Number(filters.equipoId);
      result = result.filter((p) => p.localId === eqId || p.visitanteId === eqId);
    }

    // Orden por defecto: id ascendente
    result.sort((a, b) => a.id - b.id);

    return result.map((p) => ({ ...p }));
  }

  async findById(id) {
    const partido = this.partidos.find((p) => p.id === Number(id));
    return partido ? { ...partido } : null;
  }

  async create(data) {
    const nuevoPartido = {
      id: this.currentId++,
      localId: Number(data.localId),
      visitanteId: Number(data.visitanteId),
      fecha: data.fecha.trim(),
      golesLocal: 0,
      golesVisitante: 0,
      estado: 'programado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.partidos.push(nuevoPartido);
    return { ...nuevoPartido };
  }

  async update(id, data) {
    const numId = Number(id);
    const index = this.partidos.findIndex((p) => p.id === numId);
    if (index === -1) return null;

    const actual = this.partidos[index];
    const actualizado = {
      ...actual,
      ...(data.localId !== undefined && { localId: Number(data.localId) }),
      ...(data.visitanteId !== undefined && { visitanteId: Number(data.visitanteId) }),
      ...(data.fecha !== undefined && { fecha: data.fecha.trim() }),
      ...(data.golesLocal !== undefined && { golesLocal: Number(data.golesLocal) }),
      ...(data.golesVisitante !== undefined && { golesVisitante: Number(data.golesVisitante) }),
      ...(data.estado !== undefined && { estado: data.estado }),
      updatedAt: new Date().toISOString(),
    };

    this.partidos[index] = actualizado;
    return { ...actualizado };
  }

  async delete(id) {
    const numId = Number(id);
    const index = this.partidos.findIndex((p) => p.id === numId);
    if (index === -1) return false;

    this.partidos.splice(index, 1);
    return true;
  }

  async countByEquipo(equipoId) {
    const eqId = Number(equipoId);
    return this.partidos.filter((p) => p.localId === eqId || p.visitanteId === eqId).length;
  }
}
