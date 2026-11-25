# Guía Definitiva para la Defensa Oral — TP Integrador (Liga Amateur de Fútbol)

Este documento es tu **manual completo para el examen oral**. Está pensado desde cero absoluto para que:
1. Entiendas **qué hace y cómo funciona** cada concepto sin presuponer conocimientos previos.
2. Sepas **en qué archivo y línea exacta** se cumple cada punto de `consigna-tp-integrador.pdf`.
3. Tengas **el código exacto listo para escribir** si el profesor te pide cambiar de persistencia, modificar una regla en vivo o agregar un requisito extra sencillo.

---

## 1. Conceptos Fundamentales (Para explicar con tus palabras)

### 🍽️ La Analogía del Restaurante (Cómo funciona una API REST)
Imaginate un **restaurante**:
* **El Cliente (Navegador / Swagger / Postman):** Hace un pedido mirando el menú. No entra a la cocina.
* **La API REST (Tu servidor Express):** Recibe pedidos por internet usando el protocolo **HTTP** y responde siempre con texto estructurado en formato **JSON**.
* **Los Verbos HTTP (La intención del pedido):**
  * `GET`: Leer o consultar datos (ej. listar equipos).
  * `POST`: Crear un registro nuevo (ej. fichar un jugador) o ejecutar una acción de negocio (ej. finalizar un partido).
  * `PUT`: Modificar datos de un registro existente.
  * `DELETE`: Eliminar un registro.
* **CRUD:** Las 4 operaciones básicas de cualquier entidad: **C**reate (`POST`), **R**ead (`GET`), **U**pdate (`PUT`) y **D**elete (`DELETE`).
* **Los Códigos HTTP (El semáforo de respuesta):**
  * `200 OK`: Operación exitosa (lectura, edición o finalización de partido).
  * `201 Created`: Se creó un recurso nuevo con éxito.
  * `204 No Content`: Se eliminó con éxito (no devuelve cuerpo porque el registro ya no existe).
  * `400 Bad Request`: Error de formato o validación en los datos enviados (ej. DNI con letras, goles negativos, o equipo jugando contra sí mismo).
  * `404 Not Found`: El ID buscado o la ruta URL no existen.
  * `409 Conflict`: Los datos tienen buen formato, pero **violan una regla del torneo** (ej. nombre de club repetido, DNI duplicado, plantel lleno con 25 jugadores, o intentar editar/borrar un partido que ya terminó).
  * `500 Internal Server Error`: Fallo técnico inesperado en el servidor.

---

## 2. Arquitectura en Capas e Inversión de Dependencias (Cómo viaja una petición)

El requisito central del TP es separar el código en **4 capas**, donde cada una tiene una única responsabilidad y **no puede saltearse a las demás**:

```
[ Petición HTTP del Cliente ]
         │
         ▼
1. RUTAS (`src/routes/`) + VALIDACIÓN ZOD (`src/schemas/` + `src/middlewares/validate.js`)
   "El Recepcionista y el Guardia en la Puerta"
   Recibe la URL (/equipos, /jugadores, /partidos) y antes de dejar pasar el pedido, revisa con Zod
   que los parámetros (params, query y body) tengan el formato correcto. Si algo está mal escrito,
   rebota inmediatamente con Error 400 (VALIDATION_ERROR).
         │
         ▼
2. CONTROLADORES (`src/controllers/`)
   "El Mozo"
   No sabe ninguna regla de fútbol ni sabe qué base de datos existe. Solo extrae los datos ya
   validados de `req` (`req.params`, `req.query`, `req.body`), llama al Caso de Uso, y cuando este
   termina, empaqueta la respuesta HTTP (`res.status(200/201/204).json({ data: ... })`).
   Si el Caso de Uso lanza un error, el bloque `catch (err)` lo envía a `next(err)`.
         │
         ▼
3. CASOS DE USO (`src/usecases/`)
   "El Árbitro con el Reglamento de la Liga (Cerebro del Negocio)"
   Contiene el 100% de las reglas del torneo. No sabe nada de HTTP (no usa `req` ni `res`) ni sabe
   si los datos están en Memoria o en SQLite. Verifica reglas (duplicados, cupo de 25 jugadores,
   inmutabilidad de partidos finalizados), llama al DAO para guardar/leer, y emite eventos con
   `eventBus.emit(...)` cuando finaliza un partido.
         │
         ▼
4. DAOs - Data Access Objects (`src/dao/`)
   "El Encargado del Archivo (Memoria o SQLite)"
   Es el único que toca el almacenamiento físico:
   - Adaptador en Memoria (`src/dao/memory/`): guarda en arrays de JavaScript (`this.equipos = []`).
   - Adaptador en Sequelize (`src/dao/sequelize/`): guarda en tablas SQL dentro de `database.sqlite`.
   Ambos tienen exactamente los mismos métodos y devuelven siempre OBJETOS PLANOS de JavaScript.
```

### 🧠 Conceptos Teóricos Clave que te van a preguntar en el Oral:

1. **¿Qué es un DAO (Data Access Object)?**
   Es un patrón de diseño que **aísla la lógica de negocio de la tecnología de base de datos**. Hacia los casos de uso ofrece una interfaz única (`findAll`, `findById`, `create`, `update`, `delete`), y por dentro traduce eso a operaciones de arrays en memoria o consultas SQL con Sequelize.
2. **¿Por qué los DAOs devuelven "Objetos Planos" (`plain objects`)?**
   Porque Sequelize devuelve instancias complejas llenas de métodos propios del ORM (`.save()`, `.destroy()`, metadatos internos). Si el DAO devolviera esa instancia, el Caso de Uso quedaría acoplado a Sequelize y no funcionaría igual que en Memoria. En Memoria usamos `{ ...objeto }` (copia superficial) y en Sequelize usamos `row.get({ plain: true })` dentro de `toPlain()` (`src/dao/sequelize/helpers.js`).
3. **¿Qué es la Inversión de Dependencias (DIP) y la Inyección de Dependencias (DI)?**
   * **Inversión de Dependencias:** Los Casos de Uso no hacen `import EquipoMemoryDao` ni `import EquipoSequelizeDao`. En su lugar, dependen de una **abstracción (la interfaz del DAO)** que reciben como argumento.
   * **Inyección de Dependencias:** Es el acto de pasarle las dependencias ya instanciadas por parámetro (`makeEquipoUseCases({ equipoDao, jugadorDao, partidoDao })`).
4. **¿Qué es el Contenedor / Composition Root (`src/container/container.js`)?**
   Es el único archivo de todo el sistema que junta las piezas: llama a la fábrica de DAOs (`daoFactory.js`), crea el bus de eventos y el notificador, inyecta los DAOs en los Casos de Uso, inyecta los Casos de Uso en los Controladores, y monta las Rutas.

---

## 3. Dónde se cumple cada punto de `consigna-tp-integrador.pdf` (Archivo y Línea exacta)

Usá este índice durante la defensa oral para abrir inmediatamente el archivo que te pida el docente:

### Sección 1 del PDF — Dominio y Relaciones
* **Dominio:** Liga Amateur de Fútbol con **3 entidades** (`Equipos`, `Jugadores`, `Partidos`).
* **Relaciones `1 a N`:**
  * `Equipo (1) ──< (N) Jugador`: Un club tiene muchos jugadores a través de `equipoId`.
  * `Equipo (1) ──< (N) Partido`: Un club juega muchos partidos como local (`localId`) o visitante (`visitanteId`).

---

### Sección 2.1 del PDF — Servidor, Estructura y Configuración
| Requisito del PDF | Archivo donde se cumple | Líneas exactas | Cómo funciona |
|---|---|---|---|
| **Node.js con ES Modules y Express** | `package.json` | `L6`, `L27` | `"type": "module"` habilita `import`/`export`. |
| **`index.js` limpio** | `src/index.js` | `L1–L18` | Llama a `createApp()`, ejecuta `await container.daos.init()` (`L6`) y levanta el servidor con `app.listen(...)` (`L8`). |
| **Montaje de middlewares, Swagger y Router del contenedor** | `src/app.js` | `L15–L43` | Configura `express.json()` (`L18`), publica `/api-docs` (`L22`), `/health` (`L24`), crea el contenedor (`L33`), monta `container.router` (`L36`) y cierra con `notFound` (`L39`) y `errorHandler` (`L40`). |
| **Configuración centralizada desde variables de entorno** | `src/config/config.js` | `L1–L18` | Único archivo que ejecuta `dotenv.config()` y lee `process.env` (`PORT`, `NODE_ENV`, `PERSISTENCE_TYPE`, `SQLITE_PATH`, `NOTIFIER_TYPE`, `NOTIFIER_FILE_PATH`). |
| **Plantilla `.env.example` sin versionar `.env`** | `.env.example` y `.gitignore` | `L1–L14` y `L1–L10` | `.env.example` documenta las variables; `.gitignore` bloquea `.env`, `node_modules/` y `*.sqlite`. |

---

### Sección 2.2 del PDF — Entidades, CRUD Completo y Reglas de Negocio

#### A. Recorrido completo del CRUD de las 3 Entidades
| Entidad | 1. Ruta (`src/routes/`) | 2. Schema Zod (`src/schemas/`) | 3. Controlador (`src/controllers/`) | 4. Caso de Uso (`src/usecases/`) | 5. DAOs (`memory/` y `sequelize/`) |
|---|---|---|---|---|---|
| **Equipos** (`/equipos`) | `equipoRoutes.js` (`L9–L38`) | `equipoSchema.js` (`L3–L35`) | `equipoController.js` (`L1–L48`) | `equipoUseCases.js` (`L3–L79`) | `EquipoMemoryDao.js` / `EquipoSequelizeDao.js` |
| **Jugadores** (`/jugadores`) | `jugadorRoutes.js` (`L10–L44`) | `jugadorSchema.js` (`L3–L56`) | `jugadorController.js` (`L1–L51`) | `jugadorUseCases.js` (`L5–L131`) | `JugadorMemoryDao.js` / `JugadorSequelizeDao.js` |
| **Partidos** (`/partidos`) | `partidoRoutes.js` (`L11–L51`) | `partidoSchema.js` (`L3–L71`) | `partidoController.js` (`L1–L63`) | `partidoUseCases.js` (`L4–L171`) | `PartidoMemoryDao.js` / `PartidoSequelizeDao.js` |

#### B. Ubicación exacta de las 12 Reglas de Negocio (Todas en `src/usecases/`)
| # | Regla de Negocio | Archivo | Líneas | Qué hace exactamente el código | Código HTTP y Error |
|---|---|---|---|---|---|
| 1 | **Nombre de club único al crear** | `src/usecases/equipoUseCases.js` | `L18–L24` | Llama a `equipoDao.findByNombre(data.nombre)` (ignora mayúsculas). Si existe, lanza conflicto. | `409 EQUIPO_NAME_DUPLICATED` |
| 2 | **Nombre de club único al actualizar** | `src/usecases/equipoUseCases.js` | `L36–L44` | Si cambia el nombre, verifica que no pertenezca a otro ID (`otroConMismoNombre.id !== equipoActual.id`). | `409 EQUIPO_NAME_DUPLICATED` |
| 3 | **Prohibido borrar club con jugadores** | `src/usecases/equipoUseCases.js` | `L56–L62` | Llama a `jugadorDao.countByEquipo(id)`. Si es `> 0`, impide el borrado. | `409 EQUIPO_CON_JUGADORES` |
| 4 | **Prohibido borrar club con partidos** | `src/usecases/equipoUseCases.js` | `L65–L73` | Llama a `partidoDao.countByEquipo(id)` (cuenta local o visitante). Si es `> 0`, impide el borrado. | `409 EQUIPO_CON_PARTIDOS` |
| 5 | **El club debe existir al fichar/transferir jugador** | `src/usecases/jugadorUseCases.js` | `L21–L27` y `L73–L79` | Llama a `equipoDao.findById(data.equipoId)`. Si es `null`, lanza no encontrado. | `404 EQUIPO_NOT_FOUND` |
| 6 | **Cupo máximo de 25 jugadores por equipo** | `src/usecases/jugadorUseCases.js` | `L3`, `L30–L36`, `L81–L87` | Compara `jugadorDao.countByEquipo(...) >= LIMITE_JUGADORES_POR_EQUIPO` (`25`). Se valida al crear y al cambiar de equipo. | `409 EQUIPO_CUPO_MAXIMO` |
| 7 | **DNI único en toda la liga** | `src/usecases/jugadorUseCases.js` | `L39–L45` y `L91–L99` | Llama a `jugadorDao.findByDni(data.dni)`. Impide dos jugadores con el mismo DNI. | `409 JUGADOR_DNI_DUPLICATED` |
| 8 | **Número de camiseta único dentro del mismo club** | `src/usecases/jugadorUseCases.js` | `L48–L57` y `L102–L117` | Llama a `jugadorDao.findByEquipoAndCamiseta(equipoId, numeroCamiseta)`. Permite repetir dorsal en clubes distintos, pero no en el mismo. | `409 CAMISETA_DUPLICATED` |
| 9 | **Un equipo no puede jugar contra sí mismo** | `src/usecases/partidoUseCases.js` | `L20–L25` y `L67–L72` | Compara `Number(localId) === Number(visitanteId)` tanto al crear como con los valores resultantes al editar. | `400 PARTIDO_EQUIPOS_IGUALES` |
| 10 | **Ambos equipos de un partido deben existir** | `src/usecases/partidoUseCases.js` | `L28–L42` y `L75–L93` | Busca `localId` y `visitanteId` con `equipoDao.findById(...)`. | `404 EQUIPO_NOT_FOUND` |
| 11 | **Un partido finalizado no se puede editar ni borrar** | `src/usecases/partidoUseCases.js` | `L55–L60` (`PUT`) y `L106–L111` (`DELETE`) | Verifica `if (partido.estado === 'finalizado')` y bloquea cualquier cambio o eliminación. | `409 PARTIDO_FINALIZADO` |
| 12 | **Un partido finalizado no se puede volver a finalizar** | `src/usecases/partidoUseCases.js` | `L125–L130` | En `finalizarPartido`, si `partido.estado === 'finalizado'`, rechaza la operación. | `409 PARTIDO_YA_FINALIZADO` |

---

### Sección 2.3 del PDF — Validación con Zod y Manejo de Errores
| Requisito del PDF | Archivo donde se cumple | Líneas exactas | Cómo funciona |
|---|---|---|---|
| **Middleware reutilizable de validación Zod** | `src/middlewares/validate.js` | `L7–L32` | Recibe `{ params, query, body }`. Ejecuta `parseAsync` (`L10–L18`). Si Zod lanza error, extrae `path` y `message` de cada campo inválido y pasa a `next()` un `AppError` `400 VALIDATION_ERROR` (`L21–L29`). |
| **Clase propia `AppError`** | `src/errors/AppError.js` | `L1–L32` | Extiende de `Error`. Guarda `message`, `statusCode`, `code` y `details`. Tiene métodos estáticos `.badRequest()` (`400`), `.notFound()` (`404`), `.conflict()` (`409`) e `.internal()` (`500`). |
| **Middleware `notFound`** | `src/middlewares/notFound.js` | `L3–L5` | Captura cualquier ruta inexistente y pasa `AppError.notFound(..., 'ROUTE_NOT_FOUND')` (`404`). |
| **Middleware único `errorHandler`** | `src/middlewares/errorHandler.js` | `L4–L38` | Si es `AppError` (`L5–L13`), responde con su código y formato `{ error: { code, message, details } }`. Si el JSON enviado está roto (`entity.parse.failed`, `L16–L24`), responde `400 INVALID_JSON`. Si es un fallo imprevisto (`L27–L37`), responde `500 INTERNAL_SERVER_ERROR`. |

---

### Sección 2.4 del PDF — Persistencia Intercambiable (Memoria vs Sequelize/SQLite)
| Requisito del PDF | Archivo donde se cumple | Líneas exactas | Cómo funciona |
|---|---|---|---|
| **Contrato formal de la interfaz DAO** | `src/dao/DAO_INTERFACE.md` | `L1–L70` | Documenta los métodos, parámetros y tipos de retorno que cumplen ambos modos. |
| **Factory de DAOs según `PERSISTENCE_TYPE`** | `src/dao/daoFactory.js` | `L11–L49` | `switch (type)`: si es `'memory'` (`L15–L25`), instancia los 3 `*MemoryDao` con `init: async () => {}`. Si es `'sequelize'` (`L27–L43`), crea la instancia de Sequelize, inicializa modelos/asociaciones, instancia los 3 `*SequelizeDao` y devuelve `init: async () => { await sequelize.sync(); }`. |
| **Conexión SQLite con Sequelize** | `src/dao/sequelize/sequelize.js` | `L4–L17` | Configura `dialect: 'sqlite'`, `storage: './database.sqlite'` y `logging: false`. |
| **Modelos SQL y restricciones** | `src/dao/sequelize/models/EquipoModel.js`, `JugadorModel.js`, `PartidoModel.js` | Todos | Define tablas `equipos` (`nombre` único), `jugadores` (`dni` único e índice compuesto único `unique_equipo_camiseta` en `L41–L47`) y `partidos` (`golesLocal: 0`, `golesVisitante: 0`, `estado: 'programado'`). |
| **Asociaciones centralizadas de Sequelize** | `src/dao/sequelize/models/index.js` | `L5–L46` | Define en un solo lugar `Equipo.hasMany(Jugador)`, `Jugador.belongsTo(Equipo)`, `Partido.belongsTo(Equipo, { as: 'local' / 'visitante' })` y `Equipo.hasMany(Partido)` con `onDelete: 'RESTRICT'`. |
| **Conversión a Objetos Planos (`toPlain`)** | `src/dao/sequelize/helpers.js` | `L12–L33` | Ejecuta `row.get({ plain: true })` y convierte `createdAt` y `updatedAt` a string ISO (`toISOString()`) para que Sequelize devuelva objetos idénticos a los de Memoria. |
| **Comprobación automática de paridad** | `scripts/smoke.mjs` y `scripts/parity.mjs` | `L1–L360` y `L1–L140` | `npm run parity` corre 29 peticiones contra `memory` y luego contra `sequelize` y verifica que códigos HTTP, estructura JSON y orden sean 100% idénticos. |

---

### Sección 2.5 del PDF — Contenedor e Inyección de Dependencias
* **Archivo:** `src/container/container.js` (`L16–L82`).
* **Orden exacto de ensamblaje que tenés que explicar:**
  1. `L18–L25`: Instancia `eventBus`, instancia `notifier` con `createNotifier(...)` y registra el listener con `registerPartidoListeners({ eventBus, notifier })`.
  2. `L28–L31`: Llama a `createDaoFactory(...)` y obtiene `daos` (`equipoDao`, `jugadorDao`, `partidoDao`, `init`).
  3. `L34–L49`: Crea `equipoUseCases`, `jugadorUseCases` y `partidoUseCases` inyectándoles los DAOs (y `eventBus` a partidos).
  4. `L52–L62`: Crea los 3 controladores inyectándoles los casos de uso.
  5. `L65–L70`: Crea el `Router()` principal y monta `/equipos`, `/jugadores` y `/partidos`.

---

### Sección 2.6 del PDF — Eventos (`EventEmitter`), Listener y Notificador
| Requisito del PDF | Archivo donde se cumple | Líneas exactas | Cómo funciona |
|---|---|---|---|
| **Bus de eventos (`EventEmitter`)** | `src/events/eventBus.js` | `L7–L11` | Crea `new EventEmitter()` de `node:events`. |
| **Constante del evento** | `src/events/eventNames.js` | `L4` | `export const PARTIDO_FINALIZADO = 'partido.finalizado';` |
| **Emisión desde el caso de uso** | `src/usecases/partidoUseCases.js` | `L133–L166` | En `finalizarPartido`, **después** de guardar en el DAO (`L133`), calcula el resultado (`'LOCAL'`, `'VISITANTE'` o `'EMPATE'`) y ejecuta `eventBus.emit(PARTIDO_FINALIZADO, payload)` (`L165`). |
| **Listener desacoplado con captura de errores propia** | `src/events/listeners/partidoListeners.js` | `L10–L20` | Escucha con `eventBus.on(PARTIDO_FINALIZADO, async (payload) => { try { await notifier.notify(...); } catch (error) { console.error(...); } })`. Si el notificador falla, el `catch` evita que la petición HTTP se caiga. |
| **Notificadores con interfaz común (`notify`)** | `src/events/notifiers/ConsoleNotifier.js`, `FileNotifier.js`, `createNotifier.js` | Todos | Ambos tienen el método `async notify(eventName, payload)`. `ConsoleNotifier` imprime en pantalla; `FileNotifier` escribe JSON Lines en `./logs/eventos.log`; `createNotifier` elige cuál usar según `NOTIFIER_TYPE` (`console`, `file` o `both`). |

---

### Sección 2.7 y 2.8 del PDF — Swagger (`/api-docs`) y `README.md`
* **Montaje de Swagger UI:** `src/app.js` (`L11–L13` parsea el archivo YAML y `L22` lo sirve en `/api-docs`).
* **Especificación OpenAPI 3.0.3:** `src/docs/openapi.yaml` (documenta los 17 endpoints en `paths`, define todos los moldes en `components/schemas` en `L517–L734` y respuestas de error en `components/responses` en `L736–L788`, reutilizados con `$ref`).

---

## 4. Cómo Resolver lo que Piden en Vivo en la Defensa Oral (Sección 5.4 del PDF)

En la página 4 del PDF dice:
> *"4. Defensa oral breve: se te pedirá cambiar de persistencia en vivo y agregar o modificar una regla pequeña."*

Acá tenés el paso a paso exacto para ambas cosas:

### A. Cómo cambiar de persistencia en vivo (30 segundos)
1. Abrí el archivo `.env`.
2. Donde dice `PERSISTENCE_TYPE=memory`, cambialo por `PERSISTENCE_TYPE=sequelize` (o al revés).
3. En la terminal, frená el servidor con `Ctrl + C` y volvé a arrancarlo con `npm run dev`.
4. Mostrá en la consola (`Persistencia activa: sequelize`) o en `http://localhost:3000/health` que cambió el motor de datos sin haber tocado ni una línea de rutas, controladores ni casos de uso.

---

### B. Recetario de Reglas Pequeñas para Agregar o Modificar en Vivo

Si el profesor te pide agregar o cambiar una regla durante la defensa, acá tenés las **4 más probables con el código exacto** que tenés que escribir y en qué línea va:

#### Caso 1: "Cambiá el límite máximo de jugadores por equipo de 25 a 22" (o cualquier otro número)
* **Archivo a abrir:** `src/usecases/jugadorUseCases.js`
* **Línea 3:**
  ```js
  // Cambiar esto:
  const LIMITE_JUGADORES_POR_EQUIPO = 25;
  // Por esto:
  const LIMITE_JUGADORES_POR_EQUIPO = 22;
  ```
* **Explicación al profesor:** *"Como la regla de negocio vive únicamente en el caso de uso, cambiando esta constante ya aplica tanto al crear un jugador (`L31`) como al transferirlo de equipo (`L82`), y funciona automáticamente en Memoria y en Sequelize."*

---

#### Caso 2: "Impedí que un equipo juegue dos partidos en la misma fecha"
*(Esta regla es excelente porque **reutiliza `partidoDao.findAll({ equipoId })`** que ya existe en ambos DAOs, así que solo tocás `partidoUseCases.js`).*
* **Archivo a abrir:** `src/usecases/partidoUseCases.js`
* **Dónde agregarlo:** Dentro de `crearPartido(data)`, justo después de verificar que ambos equipos existen (después de la **línea 42**, antes de `return await partidoDao.create(data)`):
  ```js
  // 3. Validar que ni el local ni el visitante tengan ya un partido en esa misma fecha
  const partidosLocal = await partidoDao.findAll({ equipoId: data.localId });
  if (partidosLocal.some((p) => p.fecha === data.fecha)) {
    throw AppError.conflict(
      `El equipo local "${local.nombre}" ya tiene un partido programado en la fecha ${data.fecha}`,
      'PARTIDO_FECHA_OCUPADA'
    );
  }

  const partidosVisitante = await partidoDao.findAll({ equipoId: data.visitanteId });
  if (partidosVisitante.some((p) => p.fecha === data.fecha)) {
    throw AppError.conflict(
      `El equipo visitante "${visitante.nombre}" ya tiene un partido programado en la fecha ${data.fecha}`,
      'PARTIDO_FECHA_OCUPADA'
    );
  }
  ```

---

#### Caso 3: "No permitas programar un partido si alguno de los equipos tiene menos de 5 jugadores"
* **Archivos a tocar:**
  1. En `src/container/container.js` (**línea 45**), pasarle también `jugadorDao: daos.jugadorDao` a `makePartidoUseCases`:
     ```js
     const partidoUseCases = makePartidoUseCases({
       partidoDao: daos.partidoDao,
       equipoDao: daos.equipoDao,
       jugadorDao: daos.jugadorDao, // <-- agregamos esta línea
       eventBus,
     });
     ```
  2. En `src/usecases/partidoUseCases.js` (**línea 4**), recibir `jugadorDao`:
     ```js
     export const makePartidoUseCases = ({ partidoDao, equipoDao, jugadorDao, eventBus }) => {
     ```
     Y dentro de `crearPartido(data)` (después de la **línea 42**):
     ```js
     const [cantLocal, cantVisitante] = await Promise.all([
       jugadorDao.countByEquipo(data.localId),
       jugadorDao.countByEquipo(data.visitanteId),
     ]);
     if (cantLocal < 5 || cantVisitante < 5) {
       throw AppError.conflict(
         'Ambos equipos deben tener al menos 5 jugadores registrados para programar un partido',
         'EQUIPO_SIN_JUGADORES_SUFICIENTES'
       );
     }
     ```

---

#### Caso 4: "No permitas que haya más de 3 arqueros en un mismo equipo"
*(También reutiliza `jugadorDao.findAll({ equipoId, posicion })` que ya existe en ambos DAOs).*
* **Archivo a abrir:** `src/usecases/jugadorUseCases.js`
* **Dónde agregarlo:** Dentro de `crearJugador(data)` (después de la **línea 36**):
  ```js
  if (data.posicion === 'ARQUERO') {
    const arqueros = await jugadorDao.findAll({
      equipoId: data.equipoId,
      posicion: 'ARQUERO',
    });
    if (arqueros.length >= 3) {
      throw AppError.conflict(
        `El equipo "${equipo.nombre}" ya alcanzó el máximo de 3 arqueros`,
        'MAXIMO_ARQUEROS_ALCANZADO'
      );
    }
  }
  ```

---

## 5. Cómo Agregar Requisitos Opcionales Sencillos (Sección 3 del PDF — Punto Extra)

Si querés sumar puntos extra de la **Sección 3 del PDF** con muy pocas líneas y usando solo lo visto en clase:

### Extra A: Segundo Evento (`equipo.completo`) con otro Notificador
El PDF pide: *"Segundo evento con un notificador adicional (por ejemplo, archivo y consola)."*
Como ya tenés creados `ConsoleNotifier` y `FileNotifier`, se agrega en 4 pasos cortos:
1. En `src/events/eventNames.js`:
   ```js
   export const PARTIDO_FINALIZADO = 'partido.finalizado';
   export const EQUIPO_COMPLETO = 'equipo.completo';
   ```
2. En `src/events/listeners/partidoListeners.js` (o en un nuevo `equipoListeners.js`), registrar el listener para `EQUIPO_COMPLETO` con su propio `try/catch`.
3. En `src/container/container.js` (`L40`), pasarle `eventBus` a `makeJugadorUseCases({ jugadorDao: daos.jugadorDao, equipoDao: daos.equipoDao, eventBus })`.
4. En `src/usecases/jugadorUseCases.js`, recibir `eventBus` (`L5`) y al final de `crearJugador` (`L59`):
   ```js
   const creado = await jugadorDao.create(data);
   if (eventBus && totalJugadores + 1 === LIMITE_JUGADORES_POR_EQUIPO) {
     eventBus.emit(EQUIPO_COMPLETO, {
       equipoId: equipo.id,
       equipoNombre: equipo.nombre,
       totalJugadores: totalJugadores + 1,
     });
   }
   return creado;
   ```

### Extra B: Tests Automatizados de Casos de Uso con DAO en Memoria como Doble (¡YA IMPLEMENTADO!)
El PDF pide: *"Tests automatizados de los casos de uso (con un DAO en memoria como doble)."*
Ya está implementado y funcionando con `npm test` en dos archivos siguiendo la **Clase 14 de `Repaso.md`**:
* **`tests/helpers/ligaScenario.js`**: Implementa el patrón *Builder de escenarios* (`buildLigaScenario()`). En cada test instancia DAOs en memoria nuevos (**Fakes**) para que ningún test comparta estado con otro, e inyecta un `eventBus` con un espía `mock.fn()` (**Spy**).
* **`tests/usecases.test.js`**: 12 tests unitarios con estructura **Arrange / Act / Assert** que prueban:
  * **Equipos:** Creación exitosa, rechazo `409 EQUIPO_NAME_DUPLICATED` (insensible a mayúsculas y comprobando que **el estado no cambió**), bloqueo de borrado con jugadores (`409 EQUIPO_CON_JUGADORES`) y bloqueo de borrado con partidos (`409 EQUIPO_CON_PARTIDOS`).
  * **Jugadores:** Equipo inexistente (`404 EQUIPO_NOT_FOUND`), DNI duplicado (`409 JUGADOR_DNI_DUPLICATED`), camiseta repetida en el mismo club (`409 CAMISETA_DUPLICATED`) vs permitida en otro club, y **caso de borde del cupo de 25 jugadores** (el jugador 25 pasa, el 26 falla con `409 EQUIPO_CUPO_MAXIMO` y el conteo queda en 25).
  * **Partidos y Eventos:** Equipos iguales (`400 PARTIDO_EQUIPOS_IGUALES`), finalización que emite `partido.finalizado` **exactamente 1 vez** con el payload completo verificado por el espía, e inmutabilidad de partidos finalizados (`409 PARTIDO_FINALIZADO` y `409 PARTIDO_YA_FINALIZADO` sin re-emitir el evento).

---

## 6. Las 11 Preguntas Clásicas y "Trampa" del Profesor en la Defensa Oral (Según `Repaso.md`)

1. **"¿Por qué el Caso de Uso no importa directamente el DAO (por ejemplo `import EquipoSequelizeDao`)?"**
   * **Respuesta:** *"Por el principio de Inversión de Dependencias (Clase 7). Si el caso de uso importara `EquipoSequelizeDao`, las reglas de negocio quedarían soldadas a SQLite y no podríamos cambiar a memoria ni correr los tests unitarios de la Clase 14 sin base de datos. En cambio, recibe cualquier `equipoDao` por parámetro desde `container.js`."*

2. **"¿Qué diferencia hay entre lo que valida Zod y lo que valida el Caso de Uso?"**
   * **Respuesta:** *"Como vimos en la Clase 13 (tabla de tipos de validación), Zod valida la **forma** mirando solo el pedido HTTP sin consultar datos (tipos, longitudes, regex de DNI, `refine` de `localId !== visitanteId`) y devuelve `400`. El Caso de Uso valida **existencia** (`404`) y **reglas de negocio / estado** consultando los DAOs (`409`), siguiendo el orden fail-fast: del chequeo más barato al más caro."*

3. **"¿Por qué el DAO de Sequelize usa `toPlain()` antes de devolver los datos?"**
   * **Respuesta:** *"Porque Sequelize devuelve instancias de su clase `Model` con métodos internos y objetos `Date`. Si devolviéramos eso, romperíamos el contrato del puerto DAO y acoplaríamos el caso de uso al ORM. `toPlain()` ejecuta `row.get({ plain: true })` y pasa las fechas a strings ISO para que ambos adaptadores devuelvan objetos planos idénticos."*

4. **"¿Qué pasa si falla el notificador cuando finalizás un partido (por ejemplo, falla la escritura del archivo `.log`)?"**
   * **Respuesta:** *"Como vimos en la Clase 10, notificar es un efecto secundario y no debe abortar la regla de negocio. En `partidoListeners.js` (`L12–L19`) el listener `async` envuelve `await notifier.notify(...)` en su propio `try / catch`: si falla, lo registra por `console.error` sin relanzar, evitando un unhandled rejection y permitiendo que la API responda `200 OK` con el partido ya finalizado."*

5. **"¿Por qué tus controladores tienen `try / catch` con `next(err)` si en la Clase 7 vimos que no hacía falta?" (Pregunta trampa de `Repaso.md`)**
   * **Respuesta:** *"Porque en el proyecto de clase se usó **Express 5** (`^5.1.0`), que captura automáticamente las promesas rechazadas en handlers `async`. Nuestro proyecto usa **Express 4** (`^4.21.2` en `package.json`), donde si una función `async` rechaza una promesa sin `try/catch → next(err)`, Express 4 no la envía al `errorHandler`."*

6. **"¿Por qué en `equipoSchema.js` y `jugadorSchema.js` usaste `.partial()` para el `PUT` si en la Clase 6 vimos que `.partial()` tenía una trampa?" (Pregunta trampa de `Repaso.md`)**
   * **Respuesta:** *"En la Clase 6 vimos que `.partial()` es peligroso cuando el schema de creación tiene un `.default(...)` (como `stock: default(0)`), porque en un `PUT` parcial Zod completaría ese campo con `0` y pisaría el valor real guardado. En `createEquipoSchema` y `createJugadorSchema` ningún campo tiene `.default()`, por lo que `.partial()` es 100% seguro. Y en `partidoSchema.js` sí definimos `updatePartidoSchema` por separado sin `.partial()` para prohibir que se modifiquen los goles o el estado en un `PUT`."*

7. **"¿Por qué en `daoFactory.js` usaron `sequelize.sync()` a secas y no `sequelize.sync({ alter: true })`?" (Pregunta de Clase 13 de `Repaso.md`)**
   * **Respuesta:** *"Porque como vimos en la Clase 13, en SQLite `alter: true` recrea las tablas al reiniciar y puede corromper claves foráneas o índices únicos compuestos como el de `(equipoId, numeroCamiseta)` de `JugadorModel.js`. Por eso usamos `sequelize.sync()` simple."*

8. **"¿Qué diferencia hay entre un Fake y un Spy en sus tests unitarios (`tests/usecases.test.js`)?" (Pregunta de Clase 14 de `Repaso.md`)**
   * **Respuesta:** *"Un **Fake** es una implementación que funciona de verdad pero simplificada en memoria (`EquipoMemoryDao`, `JugadorMemoryDao`, `PartidoMemoryDao`), con la que verificamos el **estado resultante** (por ejemplo, que tras rechazar al jugador 26 el conteo sigue en 25). Un **Spy** (`eventBus.emit = mock.fn()`) registra **cómo fue llamado**, y lo usamos cuando la interacción misma es el comportamiento que queremos probar: que `finalizarPartido` emitió `partido.finalizado` exactamente una vez con ese payload."*

9. **"¿Qué limitaciones conocidas tiene el sistema hoy?" (Pregunta de Clase 15 de `Repaso.md`)**
   * **Respuesta:** *"Las documentamos en la sección 9 del `README.md`: 1) La condición de carrera del tipo 'contar y después insertar' en el cupo de 25 jugadores si entran dos peticiones exactamente al mismo tiempo cuando hay 24 jugadores (para los duplicados de DNI, nombre y camiseta sí hay índices `UNIQUE` en la base como última línea de defensa); y 2) que `EventEmitter` corre en memoria dentro de un único proceso."*

---

## 7. Pitch para la Defensa Oral (Guion de 2 minutos + Qué se actualizó con Clases 14 y 15)

Podés arrancar la defensa diciendo esto con total seguridad:

> **1. Presentación del Dominio y Arquitectura (30 seg):**
> *"Construimos una API REST para gestionar una **Liga Amateur de Fútbol** con tres entidades relacionadas: **Equipos**, **Jugadores** (relación 1 a N con Equipo) y **Partidos** (doble relación 1 a N con Equipo como local y visitante). Aplicamos **Arquitectura en Capas con Inversión de Dependencias**: la petición entra por las **Rutas**, se valida su forma con **Zod** mediante el middleware reutilizable `validate.js`, pasa al **Controlador** (que solo traduce HTTP), y delega en los **Casos de Uso**, donde viven las 12 reglas de negocio puras sin conocer Express ni el motor de base de datos."*
>
> **2. Persistencia Intercambiable y Contenedor (30 seg):**
> *"El acceso a datos está abstraído detrás de un contrato DAO común con dos adaptadores por entidad: uno en **Memoria** (con copias defensivas) y otro en **Sequelize + SQLite** (con asociaciones centralizadas en `models/index.js`, `onDelete: 'RESTRICT'`, índices únicos y conversión a objetos planos con `toPlain()`). Todo se ensambla en un único **Composition Root** (`src/container/container.js`) usando factories con closures (`makeXxxUseCases`), lo que nos permite cambiar entre memoria y SQLite desde `.env` con `PERSISTENCE_TYPE` manteniendo paridad total verificada en 29 pasos con `npm run parity`."*
>
> **3. Eventos Desacoplados (20 seg):**
> *"Cuando se ejecuta `POST /partidos/:id/finalizar`, una vez persistido el resultado, el caso de uso emite el hecho `partido.finalizado` por un `EventEmitter` inyectado. Un listener separado (`partidoListeners.js`) escucha el evento y ejecuta el notificador (`ConsoleNotifier`, `FileNotifier` o ambos) dentro de un `try/catch` propio, garantizando que si falla el archivo de log, el partido quede finalizado igual y la API responda `200 OK`."*
>
> **4. Qué actualizamos aplicando las Clases 14 y 15 (40 seg):**
> *"Además de todos los requisitos obligatorios, aplicamos las mejoras de cierre de las **Clases 14 y 15**:*
> * *De la **Clase 14 (Testing Unitario)**: sumamos la suite `tests/usecases.test.js` con el runner nativo `node:test` y un helper `buildLigaScenario()` que instancia DAOs en memoria nuevos como **Fakes** y un `eventBus` con **Spy** (`mock.fn()`). Probamos casos felices, el borde exacto del jugador 25 y rechazo del 26, que el estado no cambie tras un error y que el evento `partido.finalizado` se emita una sola vez, corriendo en milisegundos sin servidor ni base de datos.*
> * *De la **Clase 15 (OpenAPI, README y Checklist)**: eliminamos cualquier desfasaje entre los `code` de error de los casos de uso y la documentación, agregamos ejemplos con nombre por cada `code` (`400`, `404`, `409`) en `openapi.yaml`, declaramos `engines` en `package.json` y documentamos en el `README.md` la sección de **Limitaciones conocidas** (como la condición de carrera en reglas de conteo e inserción y el alcance en memoria de `EventEmitter`)."*

