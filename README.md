# TP Integrador — API REST con Arquitectura en Capas: Liga Amateur de Fútbol

**Asignatura:** Taller de Programación 2  
**Integrantes:** Nehuel Mousseigne, Spadavecchia  
**Tecnologías:** Node.js (ES Modules), Express, Zod, Sequelize, SQLite  

---

## 1. Descripción del Dominio

El proyecto implementa una API REST para la gestión integral de una **Liga Amateur de Fútbol**. El sistema administra tres entidades principales interconectadas: **Equipos**, **Jugadores** y **Partidos**, aplicando reglas de negocio estrictas en la capa de casos de uso.

### Entidades

- **Equipos (`/equipos`):** Representa a los clubes participantes del torneo.
  - Campos: `id` (numérico autoincremental), `nombre` (único, no distingue mayúsculas/minúsculas), `barrio`, `colores`, `fechaFundacion` (`YYYY-MM-DD`), `createdAt`, `updatedAt`.
- **Jugadores (`/jugadores`):** Deportistas fichados en los respectivos clubes.
  - Campos: `id`, `nombre`, `apellido`, `dni` (único en todo el torneo), `numeroCamiseta` (único por equipo), `posicion` (`ARQUERO`, `DEFENSOR`, `MEDIOCAMPISTA`, `DELANTERO`), `equipoId` (referencia al club), `createdAt`, `updatedAt`.
- **Partidos (`/partidos`):** Encuentros disputados entre dos equipos de la liga.
  - Campos: `id`, `localId`, `visitanteId`, `fecha` (`YYYY-MM-DD`), `golesLocal`, `golesVisitante`, `estado` (`programado`, `finalizado`), `createdAt`, `updatedAt`.

---

## 2. Relaciones entre Entidades y Reglas de Negocio

### Diagrama de Relaciones

```
       1             N
  +--------+   posee   +----------+
  | Equipo | --------< | Jugador  |
  +--------+           +----------+
    1    1
    |    |
    |    +-------------+ (como visitante)
    |                  |
    | (como local)     |
    v                  v
  +----------------------+
  |       Partido        |
  +----------------------+
```

### Reglas de Negocio Implementadas en Casos de Uso

1. **Gestión de Equipos:**
   - No se permiten nombres de equipo duplicados (`409 EQUIPO_NAME_DUPLICATED`).
   - No se puede eliminar un equipo que tenga jugadores registrados (`409 EQUIPO_CON_JUGADORES`).
   - No se puede eliminar un equipo que tenga partidos asignados, sea como local o como visitante (`409 EQUIPO_CON_PARTIDOS`).
2. **Gestión de Jugadores:**
   - El DNI del jugador es único a nivel liga (`409 JUGADOR_DNI_DUPLICATED`).
   - No pueden coexistir dos jugadores con el mismo número de camiseta en el mismo equipo (`409 JUGADOR_CAMISETA_DUPLICATED`).
   - Todo jugador debe asignarse a un equipo existente (`404 EQUIPO_NOT_FOUND`).
   - **Límite de plantilla:** Un equipo no puede superar el cupo máximo de 25 jugadores registrados (`409 EQUIPO_MAX_JUGADORES`).
3. **Gestión de Partidos:**
   - El equipo local y el visitante deben ser distintos (`400 PARTIDO_EQUIPOS_IGUALES`).
   - Ambos equipos deben existir en el sistema (`404 EQUIPO_NOT_FOUND`).
   - Los partidos se crean en estado `programado` con goles en `0`.
   - Un partido en estado `finalizado` es inmutable: no se puede editar (`409 PARTIDO_FINALIZADO`) ni eliminar (`409 PARTIDO_FINALIZADO`).
   - La finalización de un partido (`POST /partidos/:id/finalizar`) establece los goles definitivos y el estado `finalizado`; no se puede finalizar un partido ya finalizado (`409 PARTIDO_YA_FINALIZADO`).

---

## 3. Arquitectura del Proyecto

El sistema aplica **Clean Architecture** (Arquitectura en Capas) junto con **Inversión de Dependencias (IoC)**:

```
[ Cliente HTTP ]
       │
       ▼
 [ src/routes ] ───> Valida con Zod (params, query, body)
       │
       ▼
[ src/controllers ] ───> Traduce HTTP a llamadas de caso de uso
       │
       ▼
 [ src/usecases ] ───> Reglas de negocio puras (independientes del framework)
       │
       ▼
   [ src/dao ] ───> Adaptadores de persistencia (Memory / Sequelize)
```

### Estructura de Directorios

- `src/config/`: Configuración centralizada leída desde variables de entorno.
- `src/container/`: Composition Root (`container.js`). Ensambla las dependencias de toda la aplicación.
- `src/controllers/`: Controladores HTTP encargados del flujo req/res y captura de excepciones hacia `next(err)`.
- `src/dao/`: Adaptadores de acceso a datos:
  - `memory/`: Persistencia en arrays de memoria con IDs autoincrementales.
  - `sequelize/`: Persistencia relacional en base de datos SQLite con modelos y asociaciones centralizadas.
  - `DAO_INTERFACE.md`: Contrato unificado que garantiza la paridad de firmas entre ambos adaptadores.
  - `daoFactory.js`: Fábrica que resuelve dinámicamente los DAOs según la configuración.
- `src/errors/`: Clase de excepción `AppError` con códigos de error de dominio y códigos HTTP.
- `src/middlewares/`: Middlewares de validación Zod (`validate.js`), manejo global de excepciones (`errorHandler.js`) y rutas no encontradas (`notFound.js`).
- `src/routes/`: Definición de endpoints y asociación con validadores y controladores.
- `src/schemas/`: Esquemas de validación con Zod para cada entidad.
- `src/usecases/`: Casos de uso de negocio puros sin dependencias a librerías de infraestructura.
- `scripts/`: Scripts automatizados de pruebas de humo y comprobación de paridad.

---

## 4. Persistencia Intercambiable (Memoria y Sequelize/SQLite)

El proyecto cuenta con dos implementaciones completas de DAO para cada una de las entidades:
1. **Memoria (`memory`):** Almacenamiento volátil en arrays de JavaScript, ideal para entornos de desarrollo rápido y pruebas unitarias aisladas.
2. **Sequelize (`sequelize`):** Base de datos relacional SQLite mediante el ORM Sequelize, con esquema relacional estructurado, claves foráneas e integridad referencial (`RESTRICT`).

Ambos adaptadores devuelven siempre **objetos planos de JavaScript** (`plain objects`), garantizando que los casos de uso y los controladores se mantengan totalmente desacoplados de la base de datos subyacente.

### Cómo Cambiar de Persistencia en Vivo (Defensa Oral)

1. En el archivo `.env`, modificar la variable `PERSISTENCE_TYPE`:

   ```env
   # Para persistir en disco con SQLite:
   PERSISTENCE_TYPE=sequelize
   SQLITE_PATH=./database.sqlite

   # Para utilizar persistencia volátil en memoria:
   PERSISTENCE_TYPE=memory
   ```

2. Reiniciar el servidor:
   ```bash
   npm run dev
   ```

3. El endpoint de diagnóstico `GET /health` reporta el modo activo:
   ```json
   {
     "status": "OK",
     "timestamp": "2026-10-27T21:15:00.000Z",
     "persistence": "sequelize"
   }
   ```

---

## 5. Instalación y Ejecución

### Requisitos Previos

- **Node.js** v18 o superior.
- **npm** v9 o superior.

### Pasos de Instalación

1. Clonar el repositorio y acceder a la carpeta del proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Tp-Final-TP2-Mousseigne-Spadavecchia
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Iniciar el servidor en modo desarrollo (con hot-reload):
   ```bash
   npm run dev
   ```

El servidor quedará disponible por defecto en `http://localhost:3000`.

---

## 6. Pruebas y Verificación de Paridad

El proyecto incluye dos herramientas automatizadas de testing para asegurar la robustez de la API:

### 1. Pruebas de Humo (`npm run smoke`)

Ejecuta una secuencia fija de 29 peticiones que evalúa:
- Healthcheck.
- Operaciones CRUD completas para Equipos, Jugadores y Partidos.
- Todas las reglas de negocio (duplicados, límites de plantilla, inmutabilidad).
- Respuestas de error con códigos semánticos (`400`, `404`, `409`).
- Manejo de JSON mal formado y rutas inexistentes.

```bash
npm run smoke
```

### 2. Verificación de Paridad Total (`npm run parity`)

Levanta de manera sucesiva el servidor en modo `memory` y luego en modo `sequelize` (con base limpia), ejecuta la batería completa de 29 pruebas y realiza un análisis comparativo estricto paso a paso:

```bash
npm run parity
```

Resultado verificado:
```
🎉 PARIDAD TOTAL VERIFICADA:
   Los 29 pasos respondieron IDÉNTICOS en ambos modos:
   - Mismos códigos HTTP (200, 201, 204, 400, 404, 409)
   - Mismos payloads JSON y mismos códigos de error
   - Mismo orden de resultados
```

---

## 7. Eventos de Dominio y Notificadores

El sistema implementa una arquitectura orientada a eventos mediante `EventEmitter` para desacoplar las reglas de negocio de los efectos secundarios (como notificaciones o logging):

- **Evento Emitido:** `partido.finalizado`.
- **Emisor:** Caso de uso `finalizarPartido` (`src/usecases/partidoUseCases.js`), emitido únicamente tras persistir el cambio de estado de forma exitosa en la base de datos o memoria.
- **Payload del Evento:**
  ```json
  {
    "partidoId": 1,
    "localId": 1,
    "localNombre": "Boca Juniors",
    "visitanteId": 2,
    "visitanteNombre": "River Plate",
    "golesLocal": 3,
    "golesVisitante": 1,
    "resultado": "LOCAL",
    "fecha": "2026-11-15"
  }
  ```
- **Notificadores Intercambiables:**
  - `ConsoleNotifier`: Imprime la notificación formateada en la consola estándar.
  - `FileNotifier`: Escribe una línea estructurada en JSON Lines en el archivo configurado (por defecto `./logs/eventos.log`), creando la carpeta automáticamente si no existe.
  - `CompositeNotifier`: Permite emitir simultáneamente a consola y archivo (`NOTIFIER_TYPE=both`).
- **Aislamiento de Fallos:** El listener (`src/events/listeners/partidoListeners.js`) ejecuta el notificador dentro de un bloque `try/catch`. Si el notificador falla (por ejemplo, problemas de escritura en disco), el error se captura y se reporta en logs sin interrumpir la respuesta HTTP 200 ni cancelar la operación de negocio.

---

## 8. Documentación OpenAPI / Swagger

La documentación interactiva de la API estará disponible en la ruta:
```
http://localhost:3000/api-docs
```

Permite inspeccionar esquemas, contratos de respuesta y ejecutar pruebas interactivas ("Try it out") contra el servidor en cualquiera de los modos de persistencia.

---

## 9. Estado del Proyecto

| Componente / Módulo | Memoria | Sequelize (SQLite) | Swagger UI |
|---|:---:|:---:|:---:|
| **Equipos** | ✅ Listo | ✅ Listo | ⏳ Fase 5 |
| **Jugadores** | ✅ Listo | ✅ Listo | ⏳ Fase 5 |
| **Partidos** | ✅ Listo | ✅ Listo | ⏳ Fase 5 |
| **Eventos (`partido.finalizado`)** | ✅ Listo | ✅ Listo | — |
| **Smoke Test (`npm run smoke`)** | ✅ Listo (29/29) | ✅ Listo (29/29) | — |
| **Test de Paridad (`npm run parity`)** | ✅ Verificado (29/29) | ✅ Verificado (29/29) | — |

