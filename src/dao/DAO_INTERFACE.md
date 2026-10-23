# Contrato de Interfaces DAO (Data Access Object)

Este documento especifica el contrato estricto e inmutable que deben implementar **ambos adaptadores de persistencia** (`memory` y `sequelize`).

---

## Reglas Generales de los Adaptadores

1. **Objetos Planos:** Todos los métodos deben retornar copias u objetos planos de JavaScript (`plain objects`). Nunca instancias de Sequelize ni modelos acoplados al ORM.
2. **Métodos Asíncronos:** Toda la interfaz devuelve `Promise`.
3. **Ordenamiento Predeterminado:** Los listados (`findAll`) deben ordenarse por `id` ascendente (`ASC`) en ambos adaptadores.
4. **Fechas:**
   - `fechaFundacion` (Equipo) y `fecha` (Partido) se representan como strings `YYYY-MM-DD`.
   - `createdAt` y `updatedAt` se devuelven como strings en formato ISO (`toISOString()`).
5. **Tipos de Retorno Uniformes:**
   - Búsquedas por ID o clave única: retornan el objeto plano si existe, o `null` si no existe.
   - Creación: retorna el objeto creado con su `id` numérico asignado.
   - Actualización (`update`): retorna el objeto actualizado plano, o `null` si el ID no existe.
   - Eliminación (`delete`): retorna `true` si se eliminó el registro, o `false` si el ID no existía.
   - Conteos (`countByEquipo`): retorna un número entero `>= 0`.

---

## 1. Interfaz `EquipoDao`

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `findAll()` | — | `Promise<Equipo[]>` | Retorna todos los equipos ordenados por `id ASC`. |
| `findById(id)` | `id: number` | `Promise<Equipo \| null>` | Busca un equipo por su ID numérico. |
| `findByNombre(nombre)` | `nombre: string` | `Promise<Equipo \| null>` | Búsqueda insensible a mayúsculas/minúsculas (`LOWER(nombre) = LOWER(nombre)`). |
| `create(data)` | `{ nombre, barrio, colores, fechaFundacion }` | `Promise<Equipo>` | Inserta un nuevo equipo con ID autoincremental. |
| `update(id, data)` | `id: number, data: Partial<Equipo>` | `Promise<Equipo \| null>` | Actualiza campos y `updatedAt`. |
| `delete(id)` | `id: number` | `Promise<boolean>` | Elimina el equipo. Retorna `true` si existía. |

---

## 2. Interfaz `JugadorDao`

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `findAll(filters)` | `{ equipoId?: number, posicion?: string }` | `Promise<Jugador[]>` | Filtra por club y/o posición. Ordenado por `id ASC`. |
| `findById(id)` | `id: number` | `Promise<Jugador \| null>` | Busca jugador por ID numérico. |
| `findByDni(dni)` | `dni: string` | `Promise<Jugador \| null>` | Búsqueda por DNI único. |
| `findByEquipoAndCamiseta(equipoId, numeroCamiseta)` | `equipoId: number, numeroCamiseta: number` | `Promise<Jugador \| null>` | Busca si el dorsal ya está ocupado en ese club. |
| `countByEquipo(equipoId)` | `equipoId: number` | `Promise<number>` | Cantidad de jugadores registrados en ese equipo. |
| `create(data)` | `{ nombre, apellido, dni, numeroCamiseta, posicion, equipoId }` | `Promise<Jugador>` | Registra nuevo jugador. |
| `update(id, data)` | `id: number, data: Partial<Jugador>` | `Promise<Jugador \| null>` | Modifica datos del jugador. |
| `delete(id)` | `id: number` | `Promise<boolean>` | Da de baja al jugador. |

---

## 3. Interfaz `PartidoDao`

| Método | Argumentos | Retorno | Descripción |
|---|---|---|---|
| `findAll(filters)` | `{ estado?: string, equipoId?: number }` | `Promise<Partido[]>` | Filtra por estado (`programado`/`finalizado`) y/o equipo (local o visitante). Orden `id ASC`. |
| `findById(id)` | `id: number` | `Promise<Partido \| null>` | Retorna el partido plano (`localId`, `visitanteId`, etc.). |
| `countByEquipo(equipoId)` | `equipoId: number` | `Promise<number>` | Cantidad de partidos donde el equipo participa como local o visitante. |
| `create(data)` | `{ localId, visitanteId, fecha }` | `Promise<Partido>` | Nace con `golesLocal: 0`, `golesVisitante: 0` y `estado: 'programado'`. |
| `update(id, data)` | `id: number, data: Partial<Partido>` | `Promise<Partido \| null>` | Actualiza datos, goles o estado del partido. |
| `delete(id)` | `id: number` | `Promise<boolean>` | Elimina el partido por ID. |

---

## 4. Inicialización de la Persistencia (`init`)

La factory de DAOs (`createDaoFactory`) debe retornar además:
- `init: async () => Promise<void>`
  - En `memory`: función asíncrona vacía `async () => {}`.
  - En `sequelize`: sincronización de la base (`await sequelize.sync()`).
