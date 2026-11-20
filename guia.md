# Guía Completa para Principiantes — Proyecto API REST Liga Amateur de Fútbol

Esta guía está escrita **desde cero absoluto**, pensada para que entiendas qué hace todo tu proyecto, por qué está construido así según el enunciado de la materia (`.gemini/guia-tp-grupal.md`), cómo funciona cada carpeta y qué hace exactamente cada archivo línea por línea.

---

## 1. Conceptos Básicos (Sin tecnicismos)

Antes de ver los archivos del proyecto, entendamos qué construiste usando una analogía de la vida real:

### 🍽️ La Analogía del Restaurante
Imaginate un **restaurante**:
* Vos sos el **cliente** (desde el navegador web o una aplicación). No entrás a la cocina a revolver las ollas; le hacés un pedido a un mozo mirando el menú.
* La **API REST** es ese sistema de recepción y mozos que recibe pedidos por internet (usando el protocolo **HTTP**), los procesa en la cocina y te devuelve un plato listo en un formato de texto ordenado llamado **JSON**.

### 📬 ¿Qué son los verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`)?
Son las intenciones de tu pedido:
* **`GET` (Leer):** *"Quiero consultar información"* (por ejemplo, ver la lista de equipos o buscar un jugador por su ID).
* **`POST` (Crear / Accionar):** *"Quiero registrar algo nuevo o ejecutar una acción especial"* (por ejemplo, inscribir un club nuevo o finalizar un partido).
* **`PUT` (Actualizar):** *"Quiero modificar datos de algo que ya existe"* (por ejemplo, cambiarle el número de camiseta a un jugador).
* **`DELETE` (Eliminar):** *"Quiero borrar un registro"* (por ejemplo, dar de baja a un jugador).

### 🗂️ ¿Qué significa CRUD?
Son las siglas en inglés de las 4 operaciones básicas que se pueden hacer sobre cualquier entidad:
* **C**reate (Crear — `POST`)
* **R**ead (Leer — `GET`)
* **U**pdate (Actualizar — `PUT`)
* **D**elete (Borrar — `DELETE`)

### 🚦 ¿Qué son los códigos de estado HTTP (`200`, `201`, `204`, `400`, `404`, `409`, `500`)?
Son el "semáforo" numérico con el que el servidor avisa cómo salió la operación:
* **`200 OK`:** Todo salió bien; acá tenés los datos pedidos o actualizados.
* **`201 Created`:** Se creó un registro nuevo con éxito.
* **`204 No Content`:** Se eliminó con éxito (y como ya no existe, no devuelve cuerpo de texto).
* **`400 Bad Request`:** Mandaste datos mal escritos o con formato inválido (ej. pusiste letras donde iba un número, una fecha inexistente o un equipo jugando contra sí mismo).
* **`404 Not Found`:** Lo que buscás no existe (ej. pediste el equipo con ID `999` o entraste a una ruta que no existe).
* **`409 Conflict`:** Los datos tienen formato válido, pero **violan una regla de negocio del torneo** (ej. querés anotar dos jugadores con el mismo DNI, superar los 25 jugadores por plantel, o borrar un club que ya tiene jugadores).
* **`500 Internal Server Error`:** Ocurrió una falla técnica inesperada dentro del servidor.

---

## 2. ¿Cómo cumple tu proyecto con el Enunciado del TP (`guia-tp-grupal.md`)?

Repasemos punto por punto qué pedía la cátedra en `.gemini/guia-tp-grupal.md` y qué se implementó en tu proyecto:

| Punto del Enunciado | Qué pedía la cátedra | Qué hace tu proyecto |
|---|---|---|
| **1. Dominio** | Elegir un dominio propio (prohibido usar la biblioteca de clase) con al menos 2 entidades relacionadas. | **Liga Amateur de Fútbol** con **3 entidades**: `Equipos`, `Jugadores` y `Partidos`. |
| **2.1. Servidor y Estructura** | Node.js con ES Modules (`import`/`export`), Express, `index.js` limpio, carpetas separadas por responsabilidad y `config/config.js` con `.env.example`. | Todo el código usa ES Modules (`"type": "module"`). `src/index.js` tiene solo 18 líneas. Configuración centralizada en `src/config/config.js`. |
| **2.2. Entidades, Relaciones y Reglas** | Mínimo 2 entidades con CRUD completo, relación `1 a N` y reglas de negocio en los casos de uso. | 3 entidades con CRUD completo. Relaciones `1 a N`: 1 Equipo tiene N Jugadores (`equipoId`) y 1 Equipo participa en N Partidos (`localId` / `visitanteId`). 12 reglas de negocio en `src/usecases/`. |
| **2.3. Validación y Errores** | Validación con **Zod** (body, params y query) con middleware reutilizable. Clase `AppError`. Un único `errorHandler` y `notFound`. | Esquemas Zod en `src/schemas/`, middleware en `src/middlewares/validate.js`, clase `src/errors/AppError.js`, y manejo global en `errorHandler.js` y `notFound.js`. |
| **2.4. Persistencia Intercambiable** | Dos adaptadores DAO por entidad (**Memoria** y **Base de datos real**) con la misma interfaz, elegidos por variable de entorno (`PERSISTENCE_TYPE`) mediante una factory, devolviendo **objetos planos** y respondiendo 100% igual. | Adaptadores en `src/dao/memory/` (arrays JS) y `src/dao/sequelize/` (base SQLite con Sequelize). Fábrica en `src/dao/daoFactory.js`. Paridad verificada con `npm run parity` (29/29 pruebas idénticas). |
| **2.5. Inyección de Dependencias** | Un contenedor (`container.js`) que resuelva los DAOs, los inyecte en casos de uso, los casos de uso en controladores y arme el router. Casos de uso y controladores no importan DAOs concretos. | `src/container/container.js` actúa como *Composition Root* enchufando todas las piezas. Ningún controlador ni caso de uso importa un DAO concreto. |
| **2.6. Eventos** | Un `EventEmitter` inyectado desde el contenedor, al menos un evento emitido por un caso de uso, un listener separado con un notificador intercambiable y `try/catch` para que un fallo no tumbe la operación. | Al finalizar un partido se emite `partido.finalizado`. El listener en `src/events/listeners/partidoListeners.js` captura sus propios errores y delega en `ConsoleNotifier`, `FileNotifier` o ambos (`CompositeNotifier`). |
| **2.7. Documentación Swagger** | OpenAPI 3 publicada en `/api-docs` cubriendo todos los endpoints, ejemplos, códigos de error, `components/schemas` con `$ref` y botón "Try it out". | Especificación completa en `src/docs/openapi.yaml` servida en `http://localhost:3000/api-docs`. |
| **2.8. README** | Explicación del dominio, diagrama de relaciones, instalación, cambio de persistencia, ruta `/api-docs` y evento implementado. | Documentado de forma completa en `README.md`. |

---

## 3. Las 3 Entidades y Todas las Reglas del Torneo

### 3.1. Diagrama de Relaciones
```
       1             N
  +--------+   posee   +----------+
  | Equipo | --------< | Jugador  |  (un jugador pertenece a un equipo mediante equipoId)
  +--------+           +----------+
    1    1
    |    |
    |    +-------------+ (como visitante: visitanteId)
    |                  |
    | (como local:     |
    |  localId)        |
    v                  v
  +----------------------+
  |       Partido        |
  +----------------------+
```

### 3.2. Tabla de las 12 Reglas de Negocio (Viven en `src/usecases/`)

| Entidad | Regla de Negocio | Qué pasa si se incumple (Código HTTP y Error) |
|---|---|---|
| **Equipos** | No puede haber dos clubes con el mismo nombre (sin importar mayúsculas o minúsculas). | `409 Conflict` — `EQUIPO_NAME_DUPLICATED` |
| **Equipos** | No se puede borrar un equipo si tiene al menos 1 jugador fichado. | `409 Conflict` — `EQUIPO_CON_JUGADORES` |
| **Equipos** | No se puede borrar un equipo si tiene partidos programados o jugados (como local o visitante). | `409 Conflict` — `EQUIPO_CON_PARTIDOS` |
| **Jugadores** | Para fichar o transferir un jugador, el club (`equipoId`) debe existir. | `404 Not Found` — `EQUIPO_NOT_FOUND` |
| **Jugadores** | Un club puede tener como máximo **25 jugadores** en su plantel. | `409 Conflict` — `EQUIPO_CUPO_MAXIMO` |
| **Jugadores** | El DNI de cada jugador es único en toda la liga. | `409 Conflict` — `JUGADOR_DNI_DUPLICATED` |
| **Jugadores** | No puede haber dos jugadores con el mismo `numeroCamiseta` dentro del **mismo equipo** (en distintos equipos sí se puede repetir). | `409 Conflict` — `CAMISETA_DUPLICATED` |
| **Partidos** | Un equipo no puede jugar un partido contra sí mismo (`localId !== visitanteId`). | `400 Bad Request` — `PARTIDO_EQUIPOS_IGUALES` |
| **Partidos** | Tanto el equipo local como el visitante deben existir. | `404 Not Found` — `EQUIPO_NOT_FOUND` |
| **Partidos** | Un partido ya `finalizado` es histórico e inmutable: **no se puede modificar (`PUT`)**. | `409 Conflict` — `PARTIDO_FINALIZADO` |
| **Partidos** | Un partido ya `finalizado` **no se puede eliminar (`DELETE`)**. | `409 Conflict` — `PARTIDO_FINALIZADO` |
| **Partidos** | No se puede volver a finalizar un partido que ya estaba `finalizado`. | `409 Conflict` — `PARTIDO_YA_FINALIZADO` |

---

## 4. ¿Cómo funciona la Arquitectura en Capas?

El flujo de cualquier petición sigue siempre un camino de **4 capas en línea recta**:

```
[ Petición HTTP del Usuario ]
         │
         ▼
1. RUTAS (`src/routes/`) + VALIDACIÓN ZOD (`src/schemas/` + `src/middlewares/validate.js`)
   "El Recepcionista y el Guardia de Seguridad en la Puerta"
   Revisa a qué URL entraste (/equipos, /jugadores, /partidos) y verifica con Zod que los datos
   tengan el tipo y formato correctos (ej. que el DNI tenga 7 u 8 números). Si el formato está mal,
   rebota el pedido inmediatamente con un Error 400.
         │
         ▼
2. CONTROLADORES (`src/controllers/`)
   "El Mozo"
   No toma decisiones del torneo ni sabe qué base de datos existe. Solo agarra los datos validados
   de la petición (`req.params`, `req.query`, `req.body`), llama al Caso de Uso correspondiente y
   devuelve la respuesta HTTP (`res.status(...).json(...)`). Si algo falla, pasa el error a `next(err)`.
         │
         ▼
3. CASOS DE USO (`src/usecases/`)
   "El Árbitro / Cerebro con el Reglamento del Torneo"
   Acá viven TODAS las reglas de negocio. No importa nada de Express ni de SQL.
   Verifica que no haya duplicados, que no se supere el cupo de 25 jugadores, que el partido no esté
   finalizado, etc. Si todo es válido, le pide al DAO que guarde o busque la información, y si se
   finalizó un partido, toca la campana de eventos (`eventBus.emit`).
         │
         ▼
4. DAOs - Data Access Objects (`src/dao/`)
   "El Encargado del Archivo (Memoria o SQLite)"
   Es el único que sabe dónde se guardan los datos físicamente:
   - En Modo Memoria (`src/dao/memory/`): guarda en listas (arrays) en la memoria RAM.
   - En Modo Sequelize (`src/dao/sequelize/`): guarda en tablas SQL dentro del archivo `database.sqlite`.
   Ambos hablan exactamente el mismo idioma y devuelven objetos planos de JavaScript.
```

### ¿Qué significa "Inversión de Dependencias" e "Inyección de Dependencias"?
En un programa común (sin arquitectura limpia), el Caso de Uso tendría arriba de todo `import EquipoSequelizeDao...`. El problema de hacer eso es que el cerebro del negocio queda "casado" para siempre con esa base de datos.

Con **Inversión de Dependencias**, el Caso de Uso no importa ningún DAO concreto: simplemente dice *"para funcionar, necesito que alguien me pase por parámetro un objeto `equipoDao` que tenga los métodos `findAll`, `findById`, `create`, `update` y `delete`"*.
A ese acto de pasarle las piezas ya creadas desde afuera se lo llama **Inyección de Dependencias**, y el encargado de hacerlo en un único lugar es el **Contenedor** (`src/container/container.js`).

---

## 5. Recorrido Exhaustivo por Todas las Carpetas y Archivos

### 📁 Raíz del Proyecto (Archivos generales)

* **`package.json`**: Es la ficha técnica del proyecto Node.js.
  * Define `"type": "module"` para habilitar los `import` y `export` estándar de JavaScript.
  * Define los comandos (`scripts`):
    * `npm start`: ejecuta `node src/index.js` (modo normal).
    * `npm run dev`: ejecuta `nodemon src/index.js` (reinicia solo cada vez que guardás un cambio).
    * `npm run smoke`: corre el script `scripts/smoke.mjs` con 29 pruebas automáticas.
    * `npm run parity`: corre `scripts/parity.mjs` para demostrar que Memoria y SQLite responden idéntico.
  * Lista las librerías instaladas (`express`, `zod`, `sequelize`, `sqlite3`, `dotenv`, `swagger-ui-express`, `yaml`).
* **`.env.example`**: Plantilla de ejemplo con las variables de entorno que usa el sistema (`PORT`, `NODE_ENV`, `PERSISTENCE_TYPE`, `SQLITE_PATH`, `NOTIFIER_TYPE`, `NOTIFIER_FILE_PATH`).
* **`.gitignore`**: Lista de archivos y carpetas que Git tiene prohibido subir al repositorio (`node_modules/`, `.env`, `*.sqlite`, `logs/`, etc.), cumpliendo con la sección 4 de la guía del TP.
* **`README.md`**: Documentación principal del repositorio para quien lo visita o evalúa.

---

### 📁 Arranque del Servidor: `src/index.js` y `src/app.js`

* **`src/index.js`**: Punto de entrada minimalista (18 líneas).
  1. Llama a `createApp()` para obtener la aplicación Express y el contenedor.
  2. Ejecuta `await container.daos.init()` (en memoria no hace nada; en Sequelize crea las tablas SQL si no existen).
  3. Levanta el servidor con `app.listen(config.port, ...)` e imprime en consola las rutas útiles.
* **`src/app.js`**: Configura la aplicación HTTP Express:
  1. Carga el archivo `src/docs/openapi.yaml`.
  2. Configura `express.json()` para poder leer cuerpos JSON en las peticiones.
  3. Publica la documentación interactiva Swagger en `/api-docs`.
  4. Define la ruta de diagnóstico `GET /health` que informa el estado `"OK"` y qué persistencia está activa (`"memory"` o `"sequelize"`).
  5. Invoca a `createContainer({ config })` y monta todas las rutas del negocio con `app.use(container.router)`.
  6. Registra al final los middlewares `notFound` (para rutas inexistentes) y `errorHandler` (para capturar cualquier error).

---

### 📁 `src/config/` — Configuración Centralizada

* **`src/config/config.js`**: Único lugar de todo el proyecto que ejecuta `dotenv.config()` y lee `process.env`. Exporta un objeto `config` ordenado con:
  * `port`: Puerto del servidor (por defecto `3000`).
  * `nodeEnv`: Entorno (`'development'` por defecto).
  * `persistence.type`: `'memory'` o `'sequelize'` (leído de `PERSISTENCE_TYPE`).
  * `persistence.sqlite.path`: Ruta del archivo SQLite (por defecto `'./database.sqlite'`).
  * `notifier.type`: `'console'`, `'file'` o `'both'` (leído de `NOTIFIER_TYPE`).
  * `notifier.filePath`: Ruta del archivo de logs (por defecto `'./logs/eventos.log'`).

---

### 📁 `src/container/` — El Contenedor (Composition Root)

* **`src/container/container.js`**: Es el corazón del ensamblaje de dependencias. Su función `createContainer({ config })` hace 4 pasos:
  1. **Eventos:** Crea el bus de eventos (`createEventBus()`), crea el notificador (`createNotifier(...)`) y registra el listener de partidos (`registerPartidoListeners({ eventBus, notifier })`).
  2. **DAOs:** Llama a `createDaoFactory(...)` pasándole el tipo de persistencia configurado y recibe `{ equipoDao, jugadorDao, partidoDao, init }`.
  3. **Casos de Uso y Controladores:**
     * Crea `equipoUseCases` inyectándole `equipoDao`, `jugadorDao` y `partidoDao` (necesita los tres para verificar que un equipo no tenga jugadores ni partidos antes de borrarlo).
     * Crea `jugadorUseCases` inyectándole `jugadorDao` y `equipoDao`.
     * Crea `partidoUseCases` inyectándole `partidoDao`, `equipoDao` y `eventBus`.
     * Crea `equipoController`, `jugadorController` y `partidoController` inyectándoles sus respectivos casos de uso.
  4. **Routers:** Monta `/equipos`, `/jugadores` y `/partidos` en un `Router` de Express y lo devuelve listo a `app.js`.

---

### 📁 `src/schemas/` — Esquemas de Validación de Entrada con Zod

Antes de que una petición llegue al controlador, Zod verifica que los datos tengan el tipo y formato adecuados:

* **`src/schemas/equipoSchema.js`**:
  * `createEquipoSchema`: Valida `nombre`, `barrio` y `colores` (textos obligatorios de 2 a 100 caracteres, quitando espacios sobrantes con `.trim()`) y `fechaFundacion` (formato fecha `YYYY-MM-DD`).
  * `updateEquipoSchema`: Convierte los campos de creación en opcionales (`.partial()`), pero exige que se envíe al menos 1 campo para actualizar.
  * `equipoIdParamSchema`: Verifica que el `:id` de la URL (ej. `/equipos/3`) esté formado solo por dígitos y lo convierte a tipo `Number`.
* **`src/schemas/jugadorSchema.js`**:
  * `POSICIONES`: Constante con las 4 posiciones válidas: `['ARQUERO', 'DEFENSOR', 'MEDIOCAMPISTA', 'DELANTERO']`.
  * `createJugadorSchema`: Valida `nombre`, `apellido`, `dni` (expresión regular `/^\d{7,8}$/` que exige 7 u 8 números sin puntos), `numeroCamiseta` (entero de 1 a 99), `posicion` (una de las 4 válidas) y `equipoId` (entero positivo).
  * `updateJugadorSchema`: Campos opcionales exigiendo al menos uno.
  * `jugadorIdParamSchema`: Valida el `:id` numérico en la URL.
  * `jugadorQuerySchema`: Valida los filtros opcionales de búsqueda en `GET /jugadores` (`?equipoId=` y `?posicion=`).
* **`src/schemas/partidoSchema.js`**:
  * `ESTADOS_PARTIDO`: `['programado', 'finalizado']`.
  * `createPartidoSchema`: Valida `localId`, `visitanteId` (enteros positivos) y `fecha` (`YYYY-MM-DD`), e incluye una validación `.refine()` para asegurar que `localId !== visitanteId`.
  * `updatePartidoSchema`: Permite actualizar `localId`, `visitanteId` y/o `fecha` (no permite tocar goles ni estado por `PUT`).
  * `finalizarPartidoSchema`: Exige `golesLocal` y `golesVisitante` (enteros `>= 0`) para el endpoint `POST /partidos/:id/finalizar`.
  * `partidoIdParamSchema` y `partidoQuerySchema`: Validan el `:id` por parámetro y los filtros `?estado=` y `?equipoId=`.

---

### 📁 `src/errors/` y `src/middlewares/` — Manejo de Errores y Validaciones

* **`src/errors/AppError.js`**: Clase que extiende de `Error` de JavaScript para representar errores conocidos del sistema. Guarda `message`, `statusCode` (`400`, `404`, `409`, `500`), `code` (código semántico como `'EQUIPO_NOT_FOUND'`) y `details`. Incluye métodos fábrica estáticos:
  * `AppError.badRequest(message, code, details)` -> HTTP `400`
  * `AppError.notFound(message, code)` -> HTTP `404`
  * `AppError.conflict(message, code, details)` -> HTTP `409`
  * `AppError.internal(message, code)` -> HTTP `500`
* **`src/middlewares/validate.js`**: Middleware reutilizable que recibe `{ params, query, body }` con esquemas Zod y ejecuta `parseAsync`. Si Zod detecta datos inválidos, transforma la lista de fallos en un `AppError` con código `400` (`VALIDATION_ERROR`) indicando exactamente qué campo falló y por qué.
* **`src/middlewares/notFound.js`**: Si ninguna ruta coincidió con la URL pedida por el usuario, genera un `AppError.notFound` (`404 ROUTE_NOT_FOUND`) y lo envía al manejador de errores.
* **`src/middlewares/errorHandler.js`**: Único middleware global de errores de Express (recibe los 4 parámetros `(err, req, res, next)`).
  * Si el error es un `AppError`, responde con su `statusCode` y el JSON estándar `{ error: { code, message, details } }`.
  * Si el usuario mandó un JSON mal escrito (rota la sintaxis de llaves o comillas), detecta `err.type === 'entity.parse.failed'` y responde `400 INVALID_JSON`.
  * Si es cualquier otro error inesperado, lo imprime en consola y devuelve `500 INTERNAL_SERVER_ERROR`.

---

### 📁 `src/routes/` — Las Rutas HTTP

Asocian cada combinación de verbo HTTP + URL con el middleware `validate` y el método correspondiente del controlador:

* **`src/routes/equipoRoutes.js`**:
  * `GET /equipos` -> `equipoController.listar`
  * `GET /equipos/:id` -> valida `params` -> `equipoController.obtenerPorId`
  * `POST /equipos` -> valida `body` -> `equipoController.crear`
  * `PUT /equipos/:id` -> valida `params` y `body` -> `equipoController.actualizar`
  * `DELETE /equipos/:id` -> valida `params` -> `equipoController.eliminar`
* **`src/routes/jugadorRoutes.js`**:
  * `GET /jugadores` -> valida `query` (`?equipoId=`, `?posicion=`) -> `jugadorController.listar`
  * `GET /jugadores/:id`, `POST /jugadores`, `PUT /jugadores/:id`, `DELETE /jugadores/:id`.
* **`src/routes/partidoRoutes.js`**:
  * `GET /partidos` -> valida `query` (`?estado=`, `?equipoId=`) -> `partidoController.listar`
  * `GET /partidos/:id`, `POST /partidos`, `PUT /partidos/:id`, `DELETE /partidos/:id`.
  * `POST /partidos/:id/finalizar` -> valida `params` (`id`) y `body` (`golesLocal`, `golesVisitante`) -> `partidoController.finalizar`.

---

### 📁 `src/controllers/` — Los Controladores HTTP

* **`src/controllers/equipoController.js`**, **`src/controllers/jugadorController.js`** y **`src/controllers/partidoController.js`**:
  * Cada archivo exporta una función fábrica (`makeEquipoController`, `makeJugadorController`, `makePartidoController`) que recibe sus casos de uso por parámetro.
  * Sus métodos (`listar`, `obtenerPorId`, `crear`, `actualizar`, `eliminar`, y `finalizar` en partidos) extraen los datos de `req`, llaman al caso de uso con `await`, y devuelven:
    * `res.status(200).json({ data: ... })` en lecturas, actualizaciones y finalización de partido.
    * `res.status(201).json({ data: ... })` en creaciones.
    * `res.status(204).send()` en eliminaciones.
  * Si el caso de uso lanza un error, el bloque `catch (err)` llama a `next(err)` para delegarlo al `errorHandler`.

---

### 📁 `src/usecases/` — Los Casos de Uso (Reglas de Negocio Puras)

* **`src/usecases/equipoUseCases.js`** (`makeEquipoUseCases({ equipoDao, jugadorDao, partidoDao })`):
  * `listarEquipos()`: Devuelve todos los equipos.
  * `obtenerEquipoPorId(id)`: Busca el equipo; si es `null`, lanza `404 EQUIPO_NOT_FOUND`.
  * `crearEquipo(data)`: Comprueba con `equipoDao.findByNombre(data.nombre)` si el nombre ya está usado; si existe, lanza `409 EQUIPO_NAME_DUPLICATED`. Si no, lo crea.
  * `actualizarEquipo(id, data)`: Verifica que el equipo exista (`404`). Si se envió un nuevo nombre distinto al actual, verifica que no esté ocupado por otro club (`409 EQUIPO_NAME_DUPLICATED`). Luego actualiza.
  * `eliminarEquipo(id)`: Verifica que el equipo exista (`404`). Cuenta sus jugadores con `jugadorDao.countByEquipo(id)`; si tiene `> 0`, lanza `409 EQUIPO_CON_JUGADORES`. Cuenta sus partidos con `partidoDao.countByEquipo(id)`; si tiene `> 0`, lanza `409 EQUIPO_CON_PARTIDOS`. Solo si ambos contadores dan `0`, elimina el equipo.
* **`src/usecases/jugadorUseCases.js`** (`makeJugadorUseCases({ jugadorDao, equipoDao })`):
  * Define `LIMITE_JUGADORES_POR_EQUIPO = 25`.
  * `listarJugadores(filters)` y `obtenerJugadorPorId(id)`.
  * `crearJugador(data)`:
    1. Verifica que `data.equipoId` exista en `equipoDao` (`404 EQUIPO_NOT_FOUND`).
    2. Verifica que `jugadorDao.countByEquipo(data.equipoId)` sea menor a `25` (`409 EQUIPO_CUPO_MAXIMO`).
    3. Verifica que `jugadorDao.findByDni(data.dni)` no exista (`409 JUGADOR_DNI_DUPLICATED`).
    4. Verifica con `jugadorDao.findByEquipoAndCamiseta(data.equipoId, data.numeroCamiseta)` que esa camiseta esté libre en ese club (`409 CAMISETA_DUPLICATED`).
    5. Crea el jugador.
  * `actualizarJugador(id, data)`: Verifica que el jugador exista (`404`), y si cambia de equipo, de DNI o de número de camiseta, vuelve a validar exactamente las mismas reglas (existencia del nuevo club, cupo de 25 en el nuevo club, DNI único y camiseta libre en el club destino).
  * `eliminarJugador(id)`: Verifica que exista (`404`) y lo elimina.
* **`src/usecases/partidoUseCases.js`** (`makePartidoUseCases({ partidoDao, equipoDao, eventBus })`):
  * `listarPartidos(filters)` y `obtenerPartidoPorId(id)`.
  * `crearPartido(data)`: Verifica que `localId !== visitanteId` (`400 PARTIDO_EQUIPOS_IGUALES`) y que ambos clubes existan en `equipoDao` (`404 EQUIPO_NOT_FOUND`). Crea el partido (que nace en estado `'programado'` con goles en `0`).
  * `actualizarPartido(id, data)`: Verifica que el partido exista (`404`), que su estado **no sea `'finalizado'`** (`409 PARTIDO_FINALIZADO`), que los equipos resultantes de la edición no sean iguales (`400 PARTIDO_EQUIPOS_IGUALES`) y que los nuevos equipos existan (`404 EQUIPO_NOT_FOUND`).
  * `eliminarPartido(id)`: Verifica que exista (`404`) y que su estado **no sea `'finalizado'`** (`409 PARTIDO_FINALIZADO`) antes de borrarlo.
  * `finalizarPartido(id, { golesLocal, golesVisitante })`:
    1. Verifica que el partido exista (`404 PARTIDO_NOT_FOUND`).
    2. Verifica que no esté ya finalizado (`409 PARTIDO_YA_FINALIZADO`).
    3. Actualiza el partido en el DAO guardando `golesLocal`, `golesVisitante` y `estado: 'finalizado'`.
    4. Busca los nombres del club local y visitante, calcula si el `resultado` fue `'LOCAL'`, `'VISITANTE'` o `'EMPATE'`, arma el objeto `payload` y dispara `eventBus.emit(PARTIDO_FINALIZADO, payload)`.

---

### 📁 `src/dao/` — Los Adaptadores de Datos (Memoria y Sequelize)

* **`src/dao/DAO_INTERFACE.md`**: Documenta el contrato estricto que cumplen tanto Memoria como Sequelize (mismos nombres de métodos, mismos parámetros, ordenados por `id ASC`, fechas en ISO/`YYYY-MM-DD`, retornando siempre objetos planos).
* **`src/dao/daoFactory.js`**: Evalúa `persistenceType`:
  * Si es `'memory'`, instancia `EquipoMemoryDao`, `JugadorMemoryDao` y `PartidoMemoryDao`.
  * Si es `'sequelize'`, crea la conexión SQLite (`createSequelizeInstance`), inicializa los modelos y relaciones (`initModels`), instancia `EquipoSequelizeDao`, `JugadorSequelizeDao` y `PartidoSequelizeDao`, y define `init: async () => { await sequelize.sync(); }`.
* **Subcarpeta `src/dao/memory/`**:
  * **`EquipoMemoryDao.js`**, **`JugadorMemoryDao.js`** y **`PartidoMemoryDao.js`**: Guardan los registros en un array en memoria (`this.equipos = []`, `this.jugadores = []`, `this.partidos = []`), asignan IDs autoincrementales (`this.currentId++`), generan `createdAt` y `updatedAt` con `new Date().toISOString()` y devuelven siempre copias (`{ ...obj }`).
* **Subcarpeta `src/dao/sequelize/`**:
  * **`sequelize.js`**: Configura la instancia de `Sequelize` con `dialect: 'sqlite'` apuntando al archivo de base de datos.
  * **`models/EquipoModel.js`**, **`models/JugadorModel.js`**, **`models/PartidoModel.js`**: Definen las columnas, tipos de datos (`INTEGER`, `STRING`, `DATEONLY`) y restricciones (`unique: true`) de las tablas SQL `equipos`, `jugadores` y `partidos`.
  * **`models/index.js`**: Centraliza las relaciones entre tablas (`Equipo.hasMany(Jugador)`, `Jugador.belongsTo(Equipo)`, `Equipo.hasMany(Partido)` como local y visitante, con `onDelete: 'RESTRICT'` para proteger la integridad referencial a nivel base de datos).
  * **`helpers.js`**:
    * `toPlain(row)`: Convierte la instancia de Sequelize a un objeto común de JavaScript con `row.get({ plain: true })` y formatea las fechas a texto ISO/`YYYY-MM-DD`.
    * `handleSequelizeError(err, customEntity)`: Traduce errores internos de SQLite/Sequelize a instancias de `AppError`.
  * **`EquipoSequelizeDao.js`**, **`JugadorSequelizeDao.js`** y **`PartidoSequelizeDao.js`**: Ejecutan las consultas reales en SQLite (`findAll`, `findByPk`, `findOne`, `create`, `update`, `destroy`, `count`) y pasan cada resultado por `toPlain()`.

---

### 📁 `src/events/` — Bus de Eventos, Listeners y Notificadores

* **`src/events/eventBus.js`**: Crea y configura el emisor de eventos (`new EventEmitter()`).
* **`src/events/eventNames.js`**: Exporta la constante `PARTIDO_FINALIZADO = 'partido.finalizado'`.
* **`src/events/listeners/partidoListeners.js`**: Escucha el evento `PARTIDO_FINALIZADO` con `eventBus.on(...)` y ejecuta `await notifier.notify(PARTIDO_FINALIZADO, payload)` envuelto en un `try / catch`. Si el notificador falla (por ejemplo, un error de disco), atrapa el error y lo muestra por `console.error` sin interrumpir el flujo principal ni romper la respuesta HTTP.
* **`src/events/notifiers/`**:
  * **`ConsoleNotifier.js`**: Imprime en la terminal el aviso formateado del evento recibido.
  * **`FileNotifier.js`**: Crea automáticamente la carpeta `./logs` (si no existe) y agrega una línea JSON con fecha y hora en `./logs/eventos.log`.
  * **`createNotifier.js`**: Incluye `CompositeNotifier` (que permite ejecutar varios notificadores en serie) y la fábrica `createNotifier` que elige `ConsoleNotifier`, `FileNotifier` o ambos según `NOTIFIER_TYPE`.

---

### 📁 `src/docs/` y `scripts/` — Documentación OpenAPI y Scripts de Verificación

* **`src/docs/openapi.yaml`**: Especificación OpenAPI 3.0.3 con todas las rutas, parámetros, cuerpos de ejemplo y esquemas reutilizables (`$ref: '#/components/schemas/...'`) que alimenta a Swagger UI en `/api-docs`.
* **`scripts/smoke.mjs`**: Prueba automatizada de 29 pasos que verifica de punta a punta todos los endpoints, reglas de negocio y códigos HTTP (`200`, `201`, `204`, `400`, `404`, `409`).
* **`scripts/parity.mjs`**: Levanta automáticamente un servidor temporal en modo `memory`, guarda las 29 respuestas, luego levanta otro servidor en modo `sequelize` con una base SQLite limpia, guarda las 29 respuestas y las compara carácter por carácter para demostrar paridad absoluta.

---

## 6. Mapa de Evaluación (Criterio por Criterio): Qué debes saber, cómo funciona y dónde está ubicado

Esta sección sigue exactamente la **tabla de puntaje de `guia-tp-grupal.md` (Sección 6)** para que sepas qué concepto teórico te van a preguntar, cómo funciona en tu código y qué archivo/línea abrir para mostrarlo.

---

### Criterio 1: Persistencia Intercambiable — DAOs, Factory y Objetos Planos (2 puntos)

#### 🧠 ¿Qué es un DAO (Data Access Object) y cómo funciona acá?
* **Definición para el examen:** Un **DAO** es un patrón de diseño que **aísla por completo la lógica de negocio de la forma en que se guardan los datos**. Es un "traductor" o adaptador: hacia afuera ofrece funciones simples (`findAll`, `findById`, `create`, `update`, `delete`), y hacia adentro es el único que sabe si está tocando un array en memoria RAM o ejecutando consultas SQL con Sequelize.
* **¿Qué es la Interfaz Común (Contrato)?** Para que dos DAOs sean intercambiables, ambos deben tener **exactamente los mismos nombres de métodos, recibir los mismos parámetros y devolver el mismo formato de datos**. Si `EquipoMemoryDao` tiene `findByNombre(nombre)`, `EquipoSequelizeDao` está obligado a tener `findByNombre(nombre)` y comportarse igual (por ejemplo, ignorando mayúsculas/minúsculas en ambos).
* **¿Por qué los DAOs devuelven "Objetos Planos" (`plain objects`)?** Cuando Sequelize lee de SQLite, no devuelve un objeto común de JavaScript, sino una "instancia del modelo" llena de métodos internos (`.save()`, `.destroy()`, metadatos de SQL). Si el DAO devolviera eso al Caso de Uso, el Caso de Uso quedaría acoplado a Sequelize. Por eso siempre convertimos el resultado a un objeto común `{ id, nombre, ... }` antes de retornarlo.
* **¿Qué es el patrón Factory (`daoFactory.js`)?** Es una función "fábrica" que lee la configuración (`PERSISTENCE_TYPE`) y decide qué par de DAOs instanciar (`memory` o `sequelize`).

#### 📍 Dónde está ubicado en tus archivos:
| Qué buscar / mostrar | Archivo | Líneas exactas | Detalle técnico clave |
|---|---|---|---|
| **El Contrato de los DAOs** | `src/dao/DAO_INTERFACE.md` | `L1–L70` | Especifica los métodos obligatorios de las 3 entidades. |
| **La Fábrica (Factory)** | `src/dao/daoFactory.js` | `L11–L49` | `switch (type)`: en `L15–L25` crea los DAOs de memoria; en `L27–L43` conecta SQLite y crea los DAOs de Sequelize. |
| **Copia inmutable en Memoria** | `src/dao/memory/EquipoMemoryDao.js` | `L7–L20`, `L33` | Usa el operador spread `{ ...equipo }` para devolver una copia plana y que nadie modifique el array interno desde afuera. |
| **Conversión a Objeto Plano en SQL** | `src/dao/sequelize/helpers.js` | `L12–L33` | Función `toPlain(row)`: ejecuta `row.get({ plain: true })` y pasa las fechas `Date` a string ISO (`toISOString()`). |
| **Búsqueda igual en ambos modos** | `src/dao/memory/EquipoMemoryDao.js` vs `src/dao/sequelize/EquipoSequelizeDao.js` | `L16–L20` vs `L29–L39` | En memoria usa `.toLowerCase()`; en Sequelize usa `where(fn('lower', col('nombre')), normalized)` para que ambos ignoren mayúsculas. |

---

### Criterio 2: Arquitectura en Capas e Inversión de Dependencias (2 puntos) + Contenedor (0,5 puntos)

#### 🧠 ¿Qué debes saber explicar?
* **Separación de responsabilidades:** Cada carpeta tiene un único trabajo y **prohibiciones claras**:
  * **Rutas (`src/routes/`):** Solo definen qué URL y verbo HTTP existen y qué middleware de validación se aplica.
  * **Controladores (`src/controllers/`):** Solo manejan HTTP (`req`, `res`, `next` y códigos `200`/`201`/`204`). **No tienen `if` de reglas del torneo ni conocen a ningún DAO.**
  * **Casos de Uso (`src/usecases/`):** Tienen el 100% de las reglas de la liga. **No conocen `req`/`res`, no importan Express, ni importan ningún DAO concreto.**
* **Inversión de Dependencias (DIP) e Inyección de Dependencias (DI):** En vez de que `equipoUseCases.js` haga `import EquipoMemoryDao` arriba del archivo (lo cual lo ataría a memoria), exporta una función fábrica `makeEquipoUseCases({ equipoDao, jugadorDao, partidoDao })` que **recibe las dependencias ya creadas por parámetro**.
* **Composition Root (Contenedor):** Es el único archivo de toda la aplicación (`src/container/container.js`) que conoce todas las piezas concretas, las instancia y las "enchufa" entre sí.

#### 📍 Dónde está ubicado en tus archivos:
| Qué buscar / mostrar | Archivo | Líneas exactas | Detalle técnico clave |
|---|---|---|---|
| **Arranque limpio** | `src/index.js` | `L1–L18` | Inicializa el DAO (`await container.daos.init()` en `L6`) y levanta el puerto (`L8`). |
| **Ensamblador (Composition Root)** | `src/container/container.js` | `L16–L82` | `L18–L25` (Eventos), `L28–L31` (Factory DAOs), `L34–L49` (Inyección en Casos de Uso), `L52–L62` (Inyección en Controladores), `L65–L70` (Montaje de Rutas). |
| **Prueba de desacoplamiento** | `src/usecases/equipoUseCases.js` | `L1–L3` | Mostrá que el único `import` es `AppError`. No hay imports de `dao/` ni de `express`. |
| **Controlador puro HTTP** | `src/controllers/equipoController.js` | `L1–L48` | Mostrá que no tiene ningún `import` y que cada método solo llama a `equipoUseCases` y devuelve `res.status(...)`. |

---

### Criterio 3: Validación con Zod y Manejo Centralizado de Errores (1,5 puntos)

#### 🧠 ¿Qué debes saber explicar?
* **¿Cuál es la diferencia entre validar con Zod (400) y validar en el Caso de Uso (404 / 409)?**
  * **Zod (en la puerta / ruta):** Valida **forma y tipo de datos** sin consultar la base de datos (ej. "¿mandó un texto vacío?", "¿el DNI tiene 7 u 8 dígitos?", "¿los goles son negativos?"). Si falla, responde `400 Bad Request` (`VALIDATION_ERROR`) y ni siquiera entra al controlador.
  * **Caso de Uso:** Valida **reglas del dominio contra el estado actual de los datos** (ej. "¿ese DNI que tiene formato válido ya lo tiene otro jugador en la base?", "¿el equipo ya llegó a 25 jugadores?"). Si falla, lanza `404 Not Found` o `409 Conflict`.
* **¿Cómo viaja un error hasta el cliente?** Cuando un Caso de Uso detecta una infracción, hace `throw AppError.conflict(...)`. El `catch (err)` del Controlador lo atrapa y hace `next(err)`. Express saltea todo y lleva ese `err` directamente al único middleware `errorHandler.js`, que arma el JSON uniforme `{ error: { code, message, details } }`.

#### 📍 Dónde está ubicado en tus archivos:
| Qué buscar / mostrar | Archivo | Líneas exactas | Detalle técnico clave |
|---|---|---|---|
| **Clase de Error de Dominio** | `src/errors/AppError.js` | `L1–L32` | Define `statusCode`, `code` y `details`, y los helpers `.badRequest()`, `.notFound()`, `.conflict()`, `.internal()`. |
| **Middleware reutilizable Zod** | `src/middlewares/validate.js` | `L7–L32` | Valida `req.params`, `req.query` y `req.body` con `parseAsync`. Si falla, empaqueta los errores en `AppError` `400` (`L21–L29`). |
| **Transformación de tipos en Zod** | `src/schemas/equipoSchema.js` | `L30–L35` | `equipoIdParamSchema` valida con regex `/^\d+$/` y usa `.transform(Number)` para que `req.params.id` pase de texto a número. |
| **Manejador único de errores** | `src/middlewares/errorHandler.js` | `L4–L38` | `L5–L13` atrapa `AppError`; `L16–L24` atrapa JSON mal formado (`entity.parse.failed`); `L27–L37` atrapa errores 500 no esperados. |

---

### Criterio 4: Relaciones entre Entidades y Reglas de Negocio (1 punto)

#### 🧠 ¿Qué debes saber explicar?
* **Cómo se relacionan las entidades:**
  * `Equipo (1) ──< (N) Jugador`: Un jugador guarda la clave foránea `equipoId`.
  * `Equipo (1) ──< (N) Partido`: Un partido guarda dos claves foráneas hacia `Equipo`: `localId` y `visitanteId`.
* **Integridad al borrar (Regla en Caso de Uso + Respaldo en SQL):** No se puede borrar un equipo que tenga jugadores o partidos. La verificación principal se hace en `equipoUseCases.js` (llamando a `countByEquipo` en ambos DAOs) para que funcione tanto en Memoria como en SQLite. Además, en Sequelize (`models/index.js`) se configuró `onDelete: 'RESTRICT'` como segunda barrera a nivel motor SQL.

#### 📍 Dónde está ubicado cada chequeo de negocio:
| Regla que te pueden pedir mostrar | Archivo | Líneas exactas |
|---|---|---|
| Nombre de equipo único (crear y actualizar) | `src/usecases/equipoUseCases.js` | `L18–L24` y `L36–L44` |
| Prohibido borrar equipo con jugadores o partidos | `src/usecases/equipoUseCases.js` | `L56–L62` (jugadores) y `L65–L73` (partidos) |
| Límite de 25 jugadores por plantel | `src/usecases/jugadorUseCases.js` | `L3` (constante), `L30–L36` (al crear) y `L81–L87` (al transferir de club) |
| DNI único en toda la liga | `src/usecases/jugadorUseCases.js` | `L39–L45` (al crear) y `L91–L99` (al editar) |
| Camiseta única dentro del mismo equipo | `src/usecases/jugadorUseCases.js` | `L48–L57` (al crear) y `L102–L117` (al editar camiseta o club) |
| Índice único compuesto en SQL `(equipoId, numeroCamiseta)` | `src/dao/sequelize/models/JugadorModel.js` | `L41–L47` |
| Asociaciones centralizadas de Sequelize | `src/dao/sequelize/models/index.js` | `L11–L39` |
| Inmutabilidad de partidos finalizados (`PUT` y `DELETE`) | `src/usecases/partidoUseCases.js` | `L55–L60` (`PUT`) y `L106–L111` (`DELETE`) |

---

### Criterio 5: Eventos de Dominio, Listener y Notificador Desacoplado (1 punto)

#### 🧠 ¿Qué debes saber explicar?
* **¿Por qué usamos `EventEmitter` en lugar de llamar a `console.log` o `appendFile` dentro de `finalizarPartido`?**
  Porque notificar por consola o guardar un log en un archivo es un **efecto secundario**, no parte de la regla de negocio del partido. Con `eventBus.emit('partido.finalizado', payload)`, el caso de uso solo avisa *"terminó este partido"* y se desentiende de quién lo escucha o qué se hace con ese aviso.
* **¿Qué pasa si el notificador falla (por ejemplo, no hay permisos para escribir en el disco)?**
  El listener (`partidoListeners.js`) envuelve la llamada al notificador en un bloque `try / catch` propio. Si falla, imprime el error en consola pero **no lo relanza**, de modo que el cliente igual recibe su `200 OK` y el partido queda finalizado en la base de datos.

#### 📍 Dónde está ubicado en tus archivos:
| Qué buscar / mostrar | Archivo | Líneas exactas | Detalle técnico clave |
|---|---|---|---|
| **Emisión del evento** | `src/usecases/partidoUseCases.js` | `L140–L166` | Se emite **después** de `await partidoDao.update(...)` (`L133`), asegurando que solo se emita si se guardó con éxito. |
| **Listener con aislamiento de fallos** | `src/events/listeners/partidoListeners.js` | `L10–L20` | `eventBus.on(PARTIDO_FINALIZADO, ...)` con el `try / catch` en `L12–L19`. |
| **Interfaz y Factory de Notificadores** | `src/events/notifiers/createNotifier.js` | `L7–L36` | Permite elegir `console`, `file` o `both` (`CompositeNotifier`) mediante `NOTIFIER_TYPE`. |

---

### Criterio 6: Documentación OpenAPI / Swagger (1 punto)

#### 📍 Dónde está ubicado en tus archivos:
* **Montaje en el servidor:** `src/app.js` (`L11–L13` lee el YAML y `L22` lo publica en `/api-docs`).
* **Especificación completa:** `src/docs/openapi.yaml` (define `paths` en `L19–L511`, esquemas reutilizables en `components/schemas` en `L517–L734` y respuestas de error reutilizables en `components/responses` en `L736–L788`, referenciadas mediante `$ref`).

---

## 7. Guía Práctica para la Defensa Oral (Paso a Paso)

### 🔄 Ejercicio 1: Cambiar de persistencia en vivo
1. Abrí `.env` y cambiá `PERSISTENCE_TYPE=memory` a `PERSISTENCE_TYPE=sequelize` (o viceversa).
2. Reiniciá el servidor en la terminal (`Ctrl + C` y luego `npm run dev`).
3. Abrí `http://localhost:3000/health` o `http://localhost:3000/api-docs` y mostrá que todo responde idéntico sin haber tocado ni un solo archivo `.js`.

### 🛠️ Ejercicio 2: Qué archivos tocar si el profesor te pide un cambio en vivo
En la defensa oral te van a pedir **agregar o modificar una regla pequeña**. Usá esta tabla para saber exactamente a dónde ir:

| Si el profesor te pide... | Qué archivo(s) tenés que abrir y editar |
|---|---|
| **Cambiar el cupo máximo de jugadores** (ej. de 25 a 22) | `src/usecases/jugadorUseCases.js` -> Línea `3`: cambiar `const LIMITE_JUGADORES_POR_EQUIPO = 25;` por `22`. |
| **Cambiar una validación de formato** (ej. que el nombre de un equipo tenga mínimo 4 caracteres o permitir números de camiseta hasta 120) | `src/schemas/equipoSchema.js` (`L7`) o `src/schemas/jugadorSchema.js` (`L24`). |
| **Agregar una regla con datos que ya devuelve el DAO** (ej. "no permitir programar partidos con fecha anterior a hoy") | `src/usecases/partidoUseCases.js` -> Dentro de `crearPartido` (`L18`), comparar `data.fecha` con la fecha actual y lanzar `throw AppError.badRequest(...)` o `AppError.conflict(...)`. |
| **Agregar una regla que requiere una nueva búsqueda en la base** (ej. "un equipo no puede jugar dos partidos en la misma fecha") | 1. Agregar el método (ej. `findByEquipoAndFecha(equipoId, fecha)`) en `src/dao/memory/PartidoMemoryDao.js`.<br>2. Agregar **el mismo método** en `src/dao/sequelize/PartidoSequelizeDao.js` (usando `toPlain`).<br>3. Llamar a `await partidoDao.findByEquipoAndFecha(...)` dentro de `crearPartido` en `src/usecases/partidoUseCases.js` y lanzar `AppError.conflict(...)` si ya existe. |
| **Emitir un evento nuevo** (ej. cuando se crea un equipo) | 1. Agregar la constante en `src/events/eventNames.js`.<br>2. Pasar `eventBus` a `makeEquipoUseCases` en `src/container/container.js` (`L34`).<br>3. Emitir `eventBus.emit(...)` en `crearEquipo` (`src/usecases/equipoUseCases.js`) y escuchar el evento en un listener con `try/catch`. |


