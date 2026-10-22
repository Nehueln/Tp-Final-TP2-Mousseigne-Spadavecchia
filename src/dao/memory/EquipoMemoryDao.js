export class EquipoMemoryDao {
  constructor() {
    this.equipos = [];
    this.currentId = 1;
  }

  async findAll() {
    return this.equipos.map((e) => ({ ...e }));
  }

  async findById(id) {
    const equipo = this.equipos.find((e) => e.id === Number(id));
    return equipo ? { ...equipo } : null;
  }

  async findByNombre(nombre) {
    const normalized = nombre.trim().toLowerCase();
    const equipo = this.equipos.find((e) => e.nombre.trim().toLowerCase() === normalized);
    return equipo ? { ...equipo } : null;
  }

  async create(data) {
    const nuevoEquipo = {
      id: this.currentId++,
      nombre: data.nombre.trim(),
      barrio: data.barrio.trim(),
      colores: data.colores.trim(),
      fechaFundacion: data.fechaFundacion.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.equipos.push(nuevoEquipo);
    return { ...nuevoEquipo };
  }

  async update(id, data) {
    const numId = Number(id);
    const index = this.equipos.findIndex((e) => e.id === numId);
    if (index === -1) return null;

    const actual = this.equipos[index];
    const actualizado = {
      ...actual,
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.barrio !== undefined && { barrio: data.barrio.trim() }),
      ...(data.colores !== undefined && { colores: data.colores.trim() }),
      ...(data.fechaFundacion !== undefined && { fechaFundacion: data.fechaFundacion.trim() }),
      updatedAt: new Date().toISOString(),
    };

    this.equipos[index] = actualizado;
    return { ...actualizado };
  }

  async delete(id) {
    const numId = Number(id);
    const index = this.equipos.findIndex((e) => e.id === numId);
    if (index === -1) return false;

    this.equipos.splice(index, 1);
    return true;
  }
}
