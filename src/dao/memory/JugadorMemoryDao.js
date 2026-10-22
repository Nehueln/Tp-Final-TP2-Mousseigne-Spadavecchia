export class JugadorMemoryDao {
  constructor() {
    this.jugadores = [];
    this.currentId = 1;
  }

  async findAll(filters = {}) {
    let result = [...this.jugadores];

    if (filters.equipoId !== undefined) {
      const eqId = Number(filters.equipoId);
      result = result.filter((j) => j.equipoId === eqId);
    }

    if (filters.posicion) {
      result = result.filter((j) => j.posicion === filters.posicion);
    }

    return result.map((j) => ({ ...j }));
  }

  async findById(id) {
    const jugador = this.jugadores.find((j) => j.id === Number(id));
    return jugador ? { ...jugador } : null;
  }

  async findByDni(dni) {
    const cleanDni = String(dni).trim();
    const jugador = this.jugadores.find((j) => String(j.dni).trim() === cleanDni);
    return jugador ? { ...jugador } : null;
  }

  async findByEquipoAndCamiseta(equipoId, numeroCamiseta) {
    const eqId = Number(equipoId);
    const camiseta = Number(numeroCamiseta);
    const jugador = this.jugadores.find(
      (j) => j.equipoId === eqId && j.numeroCamiseta === camiseta
    );
    return jugador ? { ...jugador } : null;
  }

  async countByEquipo(equipoId) {
    const eqId = Number(equipoId);
    return this.jugadores.filter((j) => j.equipoId === eqId).length;
  }

  async create(data) {
    const nuevoJugador = {
      id: this.currentId++,
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      dni: String(data.dni).trim(),
      numeroCamiseta: Number(data.numeroCamiseta),
      posicion: data.posicion,
      equipoId: Number(data.equipoId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jugadores.push(nuevoJugador);
    return { ...nuevoJugador };
  }

  async update(id, data) {
    const numId = Number(id);
    const index = this.jugadores.findIndex((j) => j.id === numId);
    if (index === -1) return null;

    const actual = this.jugadores[index];
    const actualizado = {
      ...actual,
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.apellido !== undefined && { apellido: data.apellido.trim() }),
      ...(data.dni !== undefined && { dni: String(data.dni).trim() }),
      ...(data.numeroCamiseta !== undefined && { numeroCamiseta: Number(data.numeroCamiseta) }),
      ...(data.posicion !== undefined && { posicion: data.posicion }),
      ...(data.equipoId !== undefined && { equipoId: Number(data.equipoId) }),
      updatedAt: new Date().toISOString(),
    };

    this.jugadores[index] = actualizado;
    return { ...actualizado };
  }

  async delete(id) {
    const numId = Number(id);
    const index = this.jugadores.findIndex((j) => j.id === numId);
    if (index === -1) return false;

    this.jugadores.splice(index, 1);
    return true;
  }
}
