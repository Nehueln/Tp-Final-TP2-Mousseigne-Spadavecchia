# Guía paso a paso para la IA — TP Liga Amateur

> **Cómo usar este archivo:** pasale este documento completo a la IA (Claude Code, Cursor, etc.) y pedile que lo siga **en orden**. También podés renombrarlo `AGENTS.md` o `CLAUDE.md` para que lo lea automáticamente.
> Es una guía de trabajo, no el README del proyecto (ese es `README.md`).

---

## Estado del Proyecto

| Componente / Entidad | Memoria | Sequelize (SQLite) | Swagger |
|---|:---:|:---:|:---:|
| **Equipos** | ✅ Listo | ⏳ Pendiente | ⏳ Pendiente |
| **Jugadores** | ✅ Listo | ⏳ Pendiente | ⏳ Pendiente |
| **Partidos** | ✅ Listo | ⏳ Pendiente | ⏳ Pendiente |
| **Eventos (`partido.finalizado`)** | ⏳ Pendiente | ⏳ Pendiente | ⏳ Pendiente |
| **Smoke Test Automatizado (`npm run smoke`)** | ✅ Listo | ⏳ Pendiente | — |


---

## 0. Instrucciones para la IA (leer antes de tocar nada)

Sos un asistente que ayuda a dos estudiantes (**Mousseigne** y **Spadavecchia**) a terminar un TP de *Taller de Programación 2*. Fecha de entrega: **26/11/2026**.

### Reglas de proceso
1. **Seguí las fases en orden.** No adelantes trabajo de una fase posterior.
2. **Frená en cada `⏸️ PAUSA DE COMMIT`.** En cada pausa: (a) resumí en 3–5 líneas qué cambió, (b) ejecutá la verificación indicada, (c) mostrá el comando de commit sugerido, (d) **detenete y esperá** a que el usuario escriba "listo". No sigas sin esa confirmación.
3. **No hagas `git commit`, `git push` ni `git merge` por tu cuenta.** El TP exige que ambos integrantes tengan commits propios y los hacen ellos. Solo proponé los comandos.
4. **Un cambio chico por commit.** Si una pausa te parece muy grande, proponé partirla en dos commits.
5. **Verificá antes de avisar que terminaste un paso:** levantá el servidor, corré el script de pruebas y mostrá el resultado real. Nunca digas "debería funcionar".
6. **No agregues dependencias nuevas sin decirlo.** Las permitidas están en la fase donde se usan (`yaml` en Fase 5). Nada más.
7. **Si algo del TP o de esta guía es ambiguo, preguntá** en vez de inventar.
8. **Actualizá la tabla "Estado del proyecto" de `README.md`** al cerrar cada fase.
9. **No toques** `.env`, `package-lock.json` (salvo por `npm install`) ni archivos `.sqlite`. Nunca los commitees.
10. Los estudiantes deben poder **explicar cada línea en la defensa**: escribí código simple, con nombres claros y sin magia. Si usás un patrón no trivial, dejá un comentario breve de por qué.

### Reglas de arquitectura (no negociables)
- Flujo: `Ruta → validate(Zod) → Controlador → Caso de uso → DAO`.
- **Controladores:** solo traducen HTTP ↔ casos de uso. Sin reglas de negocio. No conocen ningún DAO.
- **Casos de uso:** contienen **todas** las reglas de negocio. Reciben dependencias por parámetro. **Nunca** importan un DAO concreto, ni Sequelize, ni Express.
- **DAO:** dos adaptadores por entidad (memoria y Sequelize) con **exactamente la misma interfaz**, devolviendo **objetos planos** (nunca instancias de Sequelize).
- **Composition Root:** solo `container/container.js` ensambla dependencias. Solo `dao/daoFactory.js` conoce los DAOs concretos.
- Cambiar `PERSISTENCE_TYPE` **no debe obligar a tocar** controladores, rutas ni casos de uso.
- Ambos modos deben responder **igual** (mismos códigos, misma forma, mismo orden de resultados).

### Convenciones del código existente (respetalas)
| Tema | Convención |
|---|---|
| Módulos | ES Modules; los imports llevan extensión `.js` |
| Casos de uso | `makeXxxUseCases({ dependencias })` en `src/usecases/xxxUseCases.js`; métodos en español: `crearXxx`, `listarXxx`, `obtenerXxxPorId`, `actualizarXxx`, `eliminarXxx` |
| Controladores | `makeXxxController({ xxxUseCases })`; métodos `listar`, `obtenerPorId`, `crear`, `actualizar`, `eliminar` con `try/catch → next(err)` |
| Rutas | `makeXxxRouter({ xxxController })`; usan `validate({ params, body, query })` |
| Schemas Zod (v3) | `createXxxSchema`, `updateXxxSchema` (`.partial().refine(no vacío)`), `xxxIdParamSchema`, `xxxQuerySchema` |
| DAO memoria | Clase `XxxMemoryDao` en `src/dao/memory/`; ids autoincrementales; devuelve copias (`{ ...obj }`); `createdAt`/`updatedAt` como string ISO |
| Respuestas OK | `{ "data": ... }`; el `DELETE` devuelve `204` sin cuerpo |
| Errores | `AppError.notFound / badRequest / conflict / internal(message, code)`; formato `{ error: { code, message, details } }` con `details` siempre presente (`null` si no hay) |
| Códigos de error | `ENTIDAD_MOTIVO` en mayúsculas, ej. `EQUIPO_NAME_DUPLICATED` |
| Rutas | En la raíz: `/equipos`, `/jugadores`, `/partidos` (sin prefijo `/api`) |
| Config | Todo por `src/config/config.js` desde variables de entorno |

### Decisiones de diseño ya tomadas
- **Partido se devuelve "plano":** con `localId` y `visitanteId` (números), **sin** objetos anidados. Así memoria y Sequelize responden idéntico. Las asociaciones de Sequelize igual se definen (el TP lo pide), pero el DAO devuelve filas planas.
- **Fechas:** `fechaFundacion` y `fecha` de partido son strings `YYYY-MM-DD`. `createdAt`/`updatedAt` son strings ISO en ambos modos.
- **Orden por defecto de listados:** `id` ascendente, en ambos modos.
- **Reglas de estado = 409; datos de entrada inválidos = 400; referencia a algo inexistente = 404.**

### Cómo está organizada esta guía
Cada fase tiene: objetivo, pasos, **verificación** y pausas de commit numeradas (`#1`, `#2`, …). Quien commitea está sugerido de forma alternada para que **ambos integrantes tengan commits propios**; pueden cambiarlo. Cada fase se trabaja en una **rama** y se une a `main` mediante un **Pull Request revisado por el otro integrante** (así los dos conocen todo el código).

**Formato de commits:** `tipo(alcance): descripción en español`, con tipos `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

---

## Fase 0 — Punto de partida (hoy, 22/10)

**Objetivo:** dejar el repositorio listo y con la base actual commiteada.

1. Verificá que existan: `src/` completa (config, container, controllers, dao/memory, errors, middlewares, routes, schemas, usecases, `app.js`, `index.js`), `.env.example`, `.gitignore`, `package.json`, `README.md`.
2. Verificá que `.gitignore` incluya `node_modules/`, `.env`, `*.sqlite`, `*.sqlite3`. **Agregá** `logs/`.
3. Corré `npm install` y `npm run dev`; confirmá que `GET /health` responde 200.
4. Si el repo no está inicializado: `git init`, rama `main`. Confirmá que `.env` **no** esté trackeado (`git ls-files .env` debe salir vacío).

### ⏸️ PAUSA DE COMMIT #1 — sugerido: **Mousseigne**
```bash
git add .
git commit -m "chore: base del proyecto con equipos y jugadores en memoria"
git push -u origin main
```
> La IA espera "listo".

---

## Fase 1 — Partidos en memoria + script de pruebas (23/10 → 29/10)

**Objetivo:** CRUD completo de Partido en memoria con sus reglas, y un script que pruebe toda la API automáticamente (se reutiliza después para comprobar la paridad con Sequelize).

**Rama:** `feat/partidos`

### Modelo de Partido
| Campo | Detalle |
|---|---|
| `id` | entero autoincremental |
| `localId`, `visitanteId` | enteros; equipos existentes y distintos |
| `fecha` | `YYYY-MM-DD` (válida con `z.string().date()`) |
| `golesLocal`, `golesVisitante` | enteros ≥ 0; valen `0` mientras esté `PENDIENTE` |
| `estado` | `PENDIENTE` (al crear) o `FINALIZADO` |
| `createdAt`, `updatedAt` | ISO |

### Reglas de negocio (todas en `partidoUseCases.js`)
| Regla | Respuesta |
|---|---|
| `localId === visitanteId` | `400 PARTIDO_EQUIPOS_IGUALES` |
| Alguno de los equipos no existe | `404 EQUIPO_NOT_FOUND` |
| Modificar (`PUT`) un partido `FINALIZADO` | `409 PARTIDO_FINALIZADO` |
| Eliminar un partido `FINALIZADO` | `409 PARTIDO_FINALIZADO` |
| Finalizar un partido ya `FINALIZADO` | `409 PARTIDO_YA_FINALIZADO` |
| Eliminar un equipo que tiene partidos (como local o visitante) | `409 EQUIPO_CON_PARTIDOS` |

### Endpoints
| Método y ruta | Descripción |
|---|---|
| `GET /partidos` | Listar. Filtros opcionales `?estado=` y `?equipoId=` (local o visitante) |
| `GET /partidos/:id` | Obtener por id |
| `POST /partidos` | Crear (`localId`, `visitanteId`, `fecha`); nace `PENDIENTE` con goles en 0 |
| `PUT /partidos/:id` | Actualizar `localId`, `visitanteId` y/o `fecha` (no toca goles ni estado) |
| `DELETE /partidos/:id` | Eliminar |
| `POST /partidos/:id/finalizar` | Body `{ golesLocal, golesVisitante }`; pasa a `FINALIZADO` y devuelve el partido |

Al actualizar, validá la regla `local ≠ visitante` con los valores **resultantes** (mezclando lo enviado con lo guardado).

### Interfaz de `partidoDao` (la misma en Sequelize)
`findAll(filters)`, `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `countByEquipo(equipoId)` (partidos donde el equipo es local **o** visitante).

### Pasos
1. `src/schemas/partidoSchema.js`: `createPartidoSchema`, `updatePartidoSchema` (parcial, no vacío, sin goles ni estado), `finalizarPartidoSchema`, `partidoIdParamSchema`, `partidoQuerySchema` (`estado` enum, `equipoId` numérico).
2. `src/dao/memory/PartidoMemoryDao.js` con la interfaz de arriba.
3. Registrar `partidoDao` en `daoFactory.js` (caso `memory`).

### ⏸️ PAUSA DE COMMIT #2 — sugerido: **Spadavecchia**
```bash
git checkout -b feat/partidos
git add src/schemas/partidoSchema.js src/dao/memory/PartidoMemoryDao.js src/dao/daoFactory.js
git commit -m "feat(partidos): schema Zod y DAO en memoria"
```

4. `src/usecases/partidoUseCases.js`: `makePartidoUseCases({ partidoDao, equipoDao })` con `listarPartidos`, `obtenerPartidoPorId`, `crearPartido`, `actualizarPartido`, `eliminarPartido`, `finalizarPartido`. Dejá un comentario `// Semana 4: emitir partido.finalizado` en `finalizarPartido`.
5. `src/controllers/partidoController.js` (incluye `finalizar`, responde `200`).
6. `src/routes/partidoRoutes.js` (`POST /:id/finalizar` con `validate` de params y body).
7. Container: crear `partidoUseCases`, `partidoController`, montar `/partidos`.
8. Equipos: inyectar `partidoDao` en `makeEquipoUseCases` y rechazar el borrado con `EQUIPO_CON_PARTIDOS` (además del chequeo de jugadores que ya existe).

### ⏸️ PAUSA DE COMMIT #3 — sugerido: **Mousseigne**
```bash
git add src/usecases src/controllers src/routes src/container
git commit -m "feat(partidos): casos de uso, controlador, rutas y regla de borrado de equipos"
```

9. Crear `scripts/smoke.mjs` (Node 18+, usa `fetch`, sin dependencias). Debe:
   - leer `BASE_URL` (por defecto `http://localhost:3000`);
   - ejecutar una **secuencia fija** de requests que cubra: CRUD de las tres entidades, todas las reglas de negocio, errores 400/404/409, JSON roto, y el llenado de un equipo hasta 25 jugadores;
   - **verificar** el código HTTP esperado de cada paso (si alguno falla, mostrarlo y terminar con exit code 1);
   - imprimir al final, por stdout, la **transcripción en JSON** (paso, código, cuerpo) **sin** `createdAt`/`updatedAt`, para poder compararla entre modos.
10. Agregar al `package.json`: `"smoke": "node scripts/smoke.mjs"`.

**Verificación de la fase:** servidor en `memory`; `npm run smoke` debe terminar sin fallos. Mostrá la salida.

### ⏸️ PAUSA DE COMMIT #4 — sugerido: **Spadavecchia**
```bash
git add scripts/smoke.mjs package.json
git commit -m "test: script de pruebas de humo de toda la API"
```

11. Actualizar `README.md`: Partidos pasa a ✅ en la tabla de estado.

### ⏸️ PAUSA DE COMMIT #5 + MERGE — sugerido: **Mousseigne**
```bash
git add README.md
git commit -m "docs: actualiza estado del proyecto (partidos en memoria)"
git push -u origin feat/partidos
```
> Abrir Pull Request `feat/partidos → main`. **Lo revisa y aprueba el otro integrante.** La IA espera "listo, mergeado".

---

## Fase 2 — Preparar la persistencia real (30/10)

**Objetivo:** dejar documentada la interfaz de DAO y preparar el arranque asincrónico, antes de escribir Sequelize.

**Rama:** `refactor/preparar-persistencia`

1. En `src/dao/` crear `DAO_INTERFACE.md` con la tabla de métodos de los **tres** DAO (copiar de este documento y del README). Es el contrato que cumplen ambos adaptadores.
2. Hacer que `daoFactory.js` devuelva también una función `init` (async). En `memory` es una función vacía. Más adelante, en `sequelize`, sincroniza la base.
3. En `index.js`: `await container.daos.init()` **antes** de `app.listen`. (`createApp` puede seguir siendo sincrónico; solo cambia el arranque.)
4. Verificar: `npm run smoke` sigue pasando en `memory`.

### ⏸️ PAUSA DE COMMIT #6 — sugerido: **Spadavecchia**
```bash
git checkout -b refactor/preparar-persistencia
git add src/dao/DAO_INTERFACE.md src/dao/daoFactory.js src/index.js
git commit -m "refactor(dao): documenta interfaz comun e init asincrono en la factory"
```

---

## Fase 3 — Sequelize + SQLite (30/10 → 05/11)

**Objetivo:** segundo adaptador DAO por entidad, con la misma interfaz, y comprobar que ambos modos responden igual.

**Rama:** `feat/sequelize` (partiendo de `main` ya con la Fase 2 mergeada)

`sequelize` y `sqlite3` ya están en `package.json`. No instalar nada más.

### Estructura a crear
```
src/dao/sequelize/
├── sequelize.js          # crea la instancia (dialect sqlite, storage = config, logging false)
├── models/
│   ├── EquipoModel.js
│   ├── JugadorModel.js
│   ├── PartidoModel.js
│   └── index.js          # define modelos y TODAS las asociaciones (centralizado)
├── helpers.js            # toPlain() y traducción de errores de Sequelize
├── EquipoSequelizeDao.js
├── JugadorSequelizeDao.js
└── PartidoSequelizeDao.js
```

### Puntos críticos para que ambos modos respondan igual
| Tema | Qué hacer |
|---|---|
| Objetos planos | `toPlain(row)`: `row.get({ plain: true })`, y convertir cada `Date` a string ISO con `toISOString()`. **Nunca** devolver instancias de Sequelize. |
| Fechas | `fechaFundacion` y `fecha` como `DataTypes.DATEONLY` (salen como `YYYY-MM-DD`). |
| `findByNombre` | **Sin distinguir mayúsculas**, igual que en memoria: `where(fn('lower', col('nombre')), nombre.trim().toLowerCase())`. |
| Orden | Todos los `findAll` con `order: [['id', 'ASC']]`. |
| Retornos | `findById` → objeto o `null`; `update` → objeto o `null` si no existe; `delete` → `true`/`false`; `countByEquipo` → número. |
| Filtros | `Jugador.findAll({ equipoId, posicion })` y `Partido.findAll({ estado, equipoId })` (con `Op.or` para local/visitante) iguales a los de memoria. |
| Restricciones | Índice único en `Jugador.dni`; índice único compuesto `(equipoId, numeroCamiseta)`; `Equipo.nombre` único. Son una **red de seguridad**: la regla sigue en el caso de uso. |
| Claves foráneas | `onDelete: 'RESTRICT'` en las relaciones. Verificar que SQLite tenga las FK activadas. |
| Errores | En `helpers.js`, traducir `SequelizeUniqueConstraintError` a `AppError.conflict(...)` y `SequelizeForeignKeyConstraintError` a `AppError.conflict(...)`, por si la red de seguridad se activa. |
| Valores por defecto | `golesLocal`/`golesVisitante` en `0` y `estado` en `'PENDIENTE'` por defecto, igual que en memoria. |

### Asociaciones (en `models/index.js`, un solo lugar)
```js
Equipo.hasMany(Jugador,  { foreignKey: 'equipoId', onDelete: 'RESTRICT' });
Jugador.belongsTo(Equipo, { foreignKey: 'equipoId' });

Partido.belongsTo(Equipo, { as: 'local',     foreignKey: 'localId' });
Partido.belongsTo(Equipo, { as: 'visitante', foreignKey: 'visitanteId' });
Equipo.hasMany(Partido,   { as: 'partidosLocal',     foreignKey: 'localId',     onDelete: 'RESTRICT' });
Equipo.hasMany(Partido,   { as: 'partidosVisitante', foreignKey: 'visitanteId', onDelete: 'RESTRICT' });
```

### Pasos
1. `sequelize.js` + modelos + `models/index.js` (asociaciones).
2. `EquipoSequelizeDao.js` → cumple la interfaz de `DAO_INTERFACE.md`.

### ⏸️ PAUSA DE COMMIT #7 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b feat/sequelize
git add src/dao/sequelize
git commit -m "feat(sequelize): conexion, modelos, asociaciones y DAO de equipos"
```

3. `JugadorSequelizeDao.js` (incluye `findByDni`, `findByEquipoAndCamiseta`, `countByEquipo`).

### ⏸️ PAUSA DE COMMIT #8 — sugerido: **Spadavecchia**
```bash
git add src/dao/sequelize/JugadorSequelizeDao.js
git commit -m "feat(sequelize): DAO de jugadores"
```

4. `PartidoSequelizeDao.js` (incluye `countByEquipo` con `Op.or`).

### ⏸️ PAUSA DE COMMIT #9 — sugerido: **Mousseigne**
```bash
git add src/dao/sequelize/PartidoSequelizeDao.js
git commit -m "feat(sequelize): DAO de partidos"
```

5. En `daoFactory.js`, caso `'sequelize'`: instanciar los tres DAOs y devolver `init: async () => sequelize.sync()`. Agregar `.env.example` con `SQLITE_PATH`. Sin `alter` ni `force`.

### ⏸️ PAUSA DE COMMIT #10 — sugerido: **Spadavecchia**
```bash
git add src/dao/daoFactory.js .env.example
git commit -m "feat(sequelize): integra los DAOs de Sequelize en la factory"
```

### Verificación de paridad (obligatoria antes de seguir)
6. Correr el smoke test en **ambos modos** y comparar las transcripciones:
   ```bash
   # Terminal 1: memoria
   PERSISTENCE_TYPE=memory PORT=3100 npm start
   # Terminal 2
   BASE_URL=http://localhost:3100 node scripts/smoke.mjs > out-memory.json

   # Terminal 1: sequelize con base nueva
   rm -f ./database-parity.sqlite
   PERSISTENCE_TYPE=sequelize SQLITE_PATH=./database-parity.sqlite PORT=3100 npm start
   # Terminal 2
   BASE_URL=http://localhost:3100 node scripts/smoke.mjs > out-sequelize.json

   diff out-memory.json out-sequelize.json && echo "PARIDAD OK"
   ```
7. Si hay diferencias: **corregir el DAO de Sequelize** (nunca los casos de uso ni los controladores). Repetir hasta que `diff` no muestre nada.
8. Agregar `out-*.json` a `.gitignore`. Agregar al `package.json`: `"parity": "node scripts/parity.mjs"` **solo si** automatizás los pasos anteriores en un script; si no, documentá los comandos en el README.

### ⏸️ PAUSA DE COMMIT #11 — sugerido: **Mousseigne**
```bash
git add .gitignore scripts package.json
git commit -m "test: verificacion de paridad entre memoria y sequelize"
```

9. Actualizar `README.md`: Sequelize ✅; completar la sección "Cambiar de persistencia" con el comando real.

### ⏸️ PAUSA DE COMMIT #12 + MERGE — sugerido: **Spadavecchia**
```bash
git add README.md
git commit -m "docs: documenta persistencia con sequelize y cambio de modo"
git push -u origin feat/sequelize
```
> Pull Request `feat/sequelize → main`, revisado por el otro integrante. Esperar "listo, mergeado".

---

## Fase 4 — Eventos y notificadores (06/11 → 12/11)

**Objetivo:** que `finalizarPartido` emita `partido.finalizado` y un listener reaccione mediante un notificador intercambiable, sin que el caso de uso sepa qué se hace con el evento.

**Rama:** `feat/eventos`

### Estructura
```
src/events/
├── eventBus.js          # crea el EventEmitter
├── eventNames.js        # constantes: PARTIDO_FINALIZADO = 'partido.finalizado'
├── notifiers/
│   ├── ConsoleNotifier.js
│   ├── FileNotifier.js
│   └── createNotifier.js   # elige según NOTIFIER_TYPE
└── listeners/
    └── partidoListeners.js # registerPartidoListeners({ eventBus, notifier })
```

### Contrato
- **Interfaz del notificador:** `async notify(eventName, payload)`. `ConsoleNotifier` imprime; `FileNotifier` agrega una línea JSON a `NOTIFIER_FILE_PATH` (crear la carpeta si no existe).
- **Payload de `partido.finalizado`:** `{ partidoId, localId, localNombre, visitanteId, visitanteNombre, golesLocal, golesVisitante, resultado, fecha }` donde `resultado` es `'LOCAL'`, `'VISITANTE'` o `'EMPATE'`.
- **El caso de uso emite** con `eventBus.emit(PARTIDO_FINALIZADO, payload)` **después** de persistir el cambio. No importa notificadores ni listeners.
- **El listener captura sus propios errores:** todo su cuerpo va dentro de `try/catch` (el handler es `async`, así que un error sin capturar sería una promesa rechazada). Si falla, hace `console.error` y **no** relanza.
- **El contenedor** crea el bus y el notificador, registra los listeners y le pasa `eventBus` a `makePartidoUseCases`.
- Variables nuevas (en `config.js` y `.env.example`): `NOTIFIER_TYPE=console|file|both` (por defecto `console`) y `NOTIFIER_FILE_PATH=./logs/eventos.log`.

### Pasos
1. `eventBus.js`, `eventNames.js` y los notificadores.

### ⏸️ PAUSA DE COMMIT #13 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b feat/eventos
git add src/events/eventBus.js src/events/eventNames.js src/events/notifiers
git commit -m "feat(eventos): bus de eventos y notificadores de consola y archivo"
```

2. `partidoListeners.js` + variables de entorno en `config.js` y `.env.example`.

### ⏸️ PAUSA DE COMMIT #14 — sugerido: **Spadavecchia**
```bash
git add src/events/listeners src/config/config.js .env.example
git commit -m "feat(eventos): listener de partido.finalizado con manejo propio de errores"
```

3. Container: crear bus y notificador, registrar listeners, inyectar `eventBus` en los casos de uso de partido. `finalizarPartido` emite el evento.

### ⏸️ PAUSA DE COMMIT #15 — sugerido: **Mousseigne**
```bash
git add src/container/container.js src/usecases/partidoUseCases.js
git commit -m "feat(eventos): finalizarPartido emite partido.finalizado"
```

### Verificación
4. Finalizar un partido y mostrar la salida por consola (y el archivo si `NOTIFIER_TYPE=file`).
5. **Prueba de aislamiento:** hacer que el notificador lance un error a propósito (temporalmente) y comprobar que `POST /partidos/:id/finalizar` **sigue respondiendo 200** y el partido queda `FINALIZADO`. Revertir el error.
6. Repetir en `memory` y en `sequelize`; `npm run smoke` debe seguir sin fallos.

7. Actualizar `README.md` (sección 10 de eventos con lo real) y la tabla de estado.

### ⏸️ PAUSA DE COMMIT #16 + MERGE — sugerido: **Spadavecchia**
```bash
git add README.md
git commit -m "docs: documenta el evento partido.finalizado y su listener"
git push -u origin feat/eventos
```
> Pull Request `feat/eventos → main`, revisado por el otro integrante. Esperar "listo, mergeado".

---

## Fase 5 — Documentación Swagger (13/11 → 19/11)

**Objetivo:** OpenAPI 3 completo publicado en `/api-docs`, que se pueda probar con "Try it out" en ambos modos.

**Rama:** `docs/swagger`

**Dependencia permitida:** `npm install yaml` (`swagger-ui-express` ya está instalado).

### Decisión: archivo `src/docs/openapi.yaml` + `swagger-ui-express`
No usar `swagger-jsdoc` (el TP pide elegir una sola forma y mantenerla).

### Montaje (en `app.js`, **antes** de `notFound`)
```js
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

### Endpoints que deben quedar documentados
| Recurso | Endpoints |
|---|---|
| Equipos | `GET /equipos`, `GET /equipos/{id}`, `POST /equipos`, `PUT /equipos/{id}`, `DELETE /equipos/{id}` |
| Jugadores | `GET /jugadores` (query `equipoId`, `posicion`), `GET /jugadores/{id}`, `POST /jugadores`, `PUT /jugadores/{id}`, `DELETE /jugadores/{id}` |
| Partidos | `GET /partidos` (query `estado`, `equipoId`), `GET /partidos/{id}`, `POST /partidos`, `PUT /partidos/{id}`, `DELETE /partidos/{id}`, `POST /partidos/{id}/finalizar` |
| Sistema | `GET /health` |

### Requisitos por endpoint
- Método, ruta y descripción breve.
- Parámetros de path y query, y cuerpo, **con ejemplos**.
- Respuestas posibles con código y forma: éxito, `400`, `404`, `409` (y `500` donde aplique).
- Tags por recurso (`Equipos`, `Jugadores`, `Partidos`, `Sistema`).

### `components/schemas` (reutilizar con `$ref`)
`Equipo`, `EquipoInput`, `EquipoUpdate`, `Jugador`, `JugadorInput`, `JugadorUpdate`, `Partido`, `PartidoInput`, `PartidoUpdate`, `FinalizarPartidoInput`, `Error`, y los wrappers de respuesta (`{ data: ... }`). Además `components/responses` reutilizables para `ValidationError`, `NotFound` y `Conflict`.

### Pasos
1. Estructura base: `openapi`, `info`, `servers` (`/`), `tags`, `components` (schemas y responses).

### ⏸️ PAUSA DE COMMIT #17 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b docs/swagger
npm install yaml
git add src/docs/openapi.yaml package.json package-lock.json
git commit -m "docs(swagger): estructura OpenAPI, schemas y respuestas reutilizables"
```

2. Montar Swagger UI en `app.js` y documentar **Equipos**.

### ⏸️ PAUSA DE COMMIT #18 — sugerido: **Spadavecchia**
```bash
git add src/app.js src/docs/openapi.yaml
git commit -m "docs(swagger): publica /api-docs y documenta equipos"
```

3. Documentar **Jugadores**.

### ⏸️ PAUSA DE COMMIT #19 — sugerido: **Mousseigne**
```bash
git add src/docs/openapi.yaml
git commit -m "docs(swagger): documenta jugadores"
```

4. Documentar **Partidos** (incluido `/finalizar`) y `/health`.

### ⏸️ PAUSA DE COMMIT #20 — sugerido: **Spadavecchia**
```bash
git add src/docs/openapi.yaml
git commit -m "docs(swagger): documenta partidos y health"
```

### Verificación
5. Abrir `http://localhost:3000/api-docs` y, **en ambos modos**, probar con "Try it out" al menos: crear equipo, crear jugador, crear partido, finalizarlo, provocar un 400, un 404 y un 409.
6. Comprobar que **todos** los endpoints de la tabla anterior están documentados y que los ejemplos del YAML son válidos contra los schemas Zod reales.
7. Actualizar `README.md` (sección 9 y tabla de estado).

### ⏸️ PAUSA DE COMMIT #21 + MERGE — sugerido: **Mousseigne**
```bash
git add README.md
git commit -m "docs: documenta la ruta /api-docs"
git push -u origin docs/swagger
```
> Pull Request `docs/swagger → main`, revisado por el otro integrante. Esperar "listo, mergeado".

---

## Fase 6 — Extras opcionales (13/11 → 19/11, en paralelo si hay tiempo)

Suman **hasta +1 punto**. Hacelos solo si las fases 1–5 están cerradas y verificadas. Orden sugerido por relación esfuerzo/valor:

### 6.A — Tests de casos de uso con DAO en memoria
**Rama:** `test/casos-de-uso`. Usa el runner nativo de Node (`node --test`), **sin dependencias nuevas**. Script: `"test": "node --test"`.

Casos mínimos (los DAO en memoria y un `eventBus` falso son los dobles):
- Equipos: nombre duplicado, borrado con jugadores, borrado con partidos.
- Jugadores: DNI duplicado, camiseta duplicada, equipo inexistente, cupo de 25, mover a equipo lleno.
- Partidos: equipos iguales, equipo inexistente, modificar/eliminar finalizado, finalizar dos veces, **emite `partido.finalizado` una sola vez**.

### ⏸️ PAUSA DE COMMIT #22 — sugerido: **Spadavecchia**
```bash
git checkout main && git pull && git checkout -b test/casos-de-uso
git add tests package.json
git commit -m "test: pruebas automatizadas de los casos de uso con DAO en memoria"
```

### 6.B — Filtros, orden y paginación en listados
**Rama:** `feat/paginacion`. Aplicar a `GET /equipos`, `/jugadores` y `/partidos`, **en ambos DAO**.
- Query: `page` (≥1, por defecto 1), `limit` (1–100, por defecto 10), `sort` (campo permitido) y `order` (`asc`/`desc`).
- Respuesta: `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`.
- Validar con Zod, extender `findAll` de ambos DAO con la misma firma, actualizar `DAO_INTERFACE.md`, Swagger y `smoke.mjs`, y **repetir la verificación de paridad**.

### ⏸️ PAUSA DE COMMIT #23 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b feat/paginacion
git add src docs scripts
git commit -m "feat: paginacion, orden y filtros en los listados"
```

### 6.C — Tabla de posiciones
**Rama:** `feat/tabla-posiciones`. `GET /tabla-posiciones` calculada en un caso de uso a partir de `partidoDao.findAll({ estado: 'FINALIZADO' })` (no requiere cambios en los DAO). Puntos: 3 por victoria, 1 por empate. Columnas: `equipoId`, `equipo`, `pj`, `pg`, `pe`, `pp`, `gf`, `gc`, `dg`, `pts`. Orden: `pts` desc, `dg` desc, `gf` desc, `equipo` asc. Documentar en Swagger y agregar casos al smoke y a los tests.

### ⏸️ PAUSA DE COMMIT #24 — sugerido: **Spadavecchia**
```bash
git checkout main && git pull && git checkout -b feat/tabla-posiciones
git add src docs scripts tests
git commit -m "feat: endpoint de tabla de posiciones"
```

### 6.D — Segundo evento con otro notificador
**Rama:** `feat/segundo-evento`. Evento `equipo.completo`, emitido por `crearJugador` (y por el cambio de equipo) cuando el equipo llega a 25 jugadores. Notificador distinto al del primer evento (si el primero usa consola, este usa archivo). Listener propio con `try/catch`. Documentarlo en el README.

### ⏸️ PAUSA DE COMMIT #25 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b feat/segundo-evento
git add src README.md
git commit -m "feat(eventos): evento equipo.completo con notificador de archivo"
```

### 6.E — Dockerfile
**Rama:** `chore/docker`. `Dockerfile` de la app (Node 20 alpine, `npm ci --omit=dev`, `CMD ["npm","start"]`) y `.dockerignore` (`node_modules`, `.env`, `*.sqlite`, `logs`). SQLite no necesita contenedor aparte; si quieren, un `docker-compose.yml` con el volumen del archivo `.sqlite`.

### ⏸️ PAUSA DE COMMIT #26 — sugerido: **Spadavecchia**
```bash
git checkout main && git pull && git checkout -b chore/docker
git add Dockerfile .dockerignore docker-compose.yml
git commit -m "chore: Dockerfile y compose para ejecutar la API"
```

> Después de cada extra: Pull Request revisado por el otro integrante y merge a `main`.

---

## Fase 7 — Cierre y limpieza (20/11 → 26/11)

**Objetivo:** que todo lo que pide el TP esté cumplido y comprobado, con el repo prolijo.

**Rama:** `chore/cierre`

### Checklist del TP (la IA lo recorre y muestra evidencia de cada punto)
| # | Requisito del TP | Cómo se comprueba |
|---|---|---|
| 2.1 | `index.js` limpio; carpetas `routes, controllers, usecases, dao, schemas, middlewares, errors, config, container`; `config.js` desde env; `.env.example` | Revisar archivos |
| 2.2 | ≥ 2 entidades con CRUD completo, relación 1:N, regla de negocio en caso de uso | `npm run smoke` |
| 2.3 | Zod en body/params/query con middleware reutilizable; `AppError`; un `errorHandler` y un `notFound`; formato de error; códigos 200/201/204/400/404/409/500 | Smoke + revisión |
| 2.4 | Dos DAO por entidad con la misma interfaz; factory por `PERSISTENCE_TYPE`; objetos planos; ambos modos iguales | Paridad (`diff`) |
| 2.5 | Contenedor que ensambla todo; casos de uso sin DAOs concretos; controladores sin DAOs | `grep -r "dao/" src/usecases src/controllers` no debe mostrar imports de DAO concretos |
| 2.6 | Bus inyectado, evento emitido por caso de uso, listener aparte con notificador, errores capturados | Prueba de aislamiento de la Fase 4 |
| 2.7 | Swagger en `/api-docs`, todos los endpoints, `components/schemas` con `$ref`, "Try it out" en ambos modos | Prueba manual |
| 2.8 | README completo: dominio, relaciones, instalación, variables, cambio de persistencia, `/api-docs`, evento y listener | Revisar `README.md` |
| 4 | Sin `node_modules`, `.env` ni `.sqlite` en el repo; commits progresivos de **ambos** integrantes | `git ls-files`, `git shortlog -sn` |

### Pasos
1. Recorrer el checklist y corregir lo que falle.
2. `README.md` final: tabla de estado **todo ✅**, quitar los "pendiente", agregar al final una sección corta de cómo correr `smoke`, `test` y la paridad.
3. Limpiar: código muerto, `console.log` de depuración, comentarios `// Semana N`, archivos sin usar.
4. Verificar que `.env.example` tenga **todas** las variables que lee `config.js`.
5. Verificación final desde cero: clonar el repo en una carpeta limpia, `npm install`, `cp .env.example .env`, correr en `memory` y en `sequelize`, `npm run smoke` y (si hicieron los tests) `npm test`.

### ⏸️ PAUSA DE COMMIT #27 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b chore/cierre
git add .
git commit -m "chore: limpieza final y checklist del TP cumplido"
```

### ⏸️ PAUSA DE COMMIT #28 + ENTREGA — sugerido: **Spadavecchia**
```bash
git add README.md
git commit -m "docs: README final"
git push -u origin chore/cierre
```
> Pull Request `chore/cierre → main`, revisado por el otro integrante. Luego, desde `main`: `git tag v1.0.0 && git push --tags`. **Esa es la versión que se entrega.**

---

## Fase 8 — Preparación de la defensa (hasta 26/11)

**Objetivo:** que **ambos** integrantes puedan explicar cualquier parte del proyecto y resolver lo que les pidan en vivo.

**Rama:** `docs/defensa`

1. Crear `docs/DEFENSA.md` con:
   - **Recorrido completo** ruta → controlador → caso de uso → DAO de cada entidad, con las rutas de los archivos y una línea por capa.
   - **Cómo cambiar de persistencia en vivo** (paso a paso, 3 comandos).
   - **Dónde vive cada regla de negocio** (archivo y función).
   - **Ejercicios de práctica** del tipo "agregar o modificar una regla pequeña", cada uno con *qué archivo se toca* y *qué se debe probar*:
     - subir el límite de jugadores por equipo de 25 a 22;
     - impedir que un equipo juegue dos partidos el mismo día (pista: `partidoDao` necesita un método nuevo en **ambos** adaptadores);
     - no permitir jugadores con el mismo número de camiseta en la misma posición;
     - emitir un evento nuevo al crear un equipo.
   - **Preguntas probables** (¿por qué el caso de uso no importa el DAO?, ¿qué pasa si el notificador falla?, ¿qué hace la factory?, ¿por qué el DAO devuelve objetos planos?) con respuestas de 2–3 líneas.
2. **Simulacro:** la IA le hace cada ejercicio a un integrante, como si fuera el docente, y el otro lo revisa. Después se intercambian.

### ⏸️ PAUSA DE COMMIT #29 — sugerido: **Mousseigne**
```bash
git checkout main && git pull && git checkout -b docs/defensa
git add docs/DEFENSA.md
git commit -m "docs: guia de defensa con recorridos, ejercicios y preguntas probables"
```
> Pull Request revisado por el otro integrante y merge a `main`. Si cambia algo del código, actualizar el tag.

---

## Resumen de pausas de commit

| Fase | Pausas | Rama |
|---|---|---|
| 0. Punto de partida | #1 | `main` |
| 1. Partidos en memoria | #2 – #5 | `feat/partidos` |
| 2. Preparar persistencia | #6 | `refactor/preparar-persistencia` |
| 3. Sequelize | #7 – #12 | `feat/sequelize` |
| 4. Eventos | #13 – #16 | `feat/eventos` |
| 5. Swagger | #17 – #21 | `docs/swagger` |
| 6. Extras | #22 – #26 | una rama por extra |
| 7. Cierre | #27 – #28 | `chore/cierre` |
| 8. Defensa | #29 | `docs/defensa` |

**Reparto de commits:** las pausas alternan entre Mousseigne y Spadavecchia de a una, así ambos acumulan commits propios de forma pareja. Si en algún momento uno de los dos no puede, el otro commitea y se compensa en la siguiente pausa.

---

## Anexo — Qué hacer si algo falla

| Situación | Acción |
|---|---|
| `smoke` falla en un modo | Mostrar el paso y la respuesta exacta; corregir **el DAO** o la regla, no el script (salvo que el script esté mal) |
| `diff` de paridad distinto de vacío | Localizar la primera diferencia; casi siempre es orden, fechas, mayúsculas en `findByNombre` o un valor por defecto |
| Se necesita tocar un controlador o caso de uso para que ande Sequelize | **Frenar**: significa que el DAO rompe la interfaz. Corregir el DAO |
| Una pausa requiere un archivo que no existe | Avisar y preguntar antes de crearlo con otro nombre |
| Conflicto de merge | Explicar el conflicto en palabras simples y proponer la resolución; que la confirme un integrante antes de aplicarla |
| Duda sobre el enunciado | Releer las secciones 2 a 6 del enunciado del TP y preguntar al usuario |