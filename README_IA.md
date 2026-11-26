# 🤖 Uso de la IA como Herramienta de Apoyo — TP Integrador (Liga Amateur de Fútbol)

Este documento describe de forma transparente **cómo se utilizó el asistente de IA (Antigravity) como herramienta de consulta, auditoría y estudio** durante el desarrollo y cierre del Trabajo Práctico Integrador de **Taller de Programación 2**, cuyos autores y responsables son **Nehuel Mousseigne y Spadavecchia**.

---

## 1. Rol de la herramienta (Qué SÍ y qué NO fue la IA)

* **Autoría y decisiones:** La definición del dominio (**Liga Amateur de Fútbol**), la estructura del repositorio, el historial de ramas y commits, la revisión del código y la defensa técnica corresponden a los integrantes del grupo.
* **Rol de la IA:** Se utilizó como un **asistente técnico de apoyo** bajo dirección del estudiante, funcionando de forma similar a un tutor de consulta y revisor de checklist: respondiendo dudas puntuales sobre el código, auditando el proyecto frente a la consigna y colaborando en ajustes específicos solicitados explícitamente.

---

## 2. En qué áreas concretas ayudó la herramienta

### 🔍 1. Auditoría contra la Consigna y el Checklist de la Cátedra
A pedido del estudiante, se contrastó el código existente del proyecto contra los requisitos de `consigna-tp-integrador.pdf` y los apuntes de la cursada (`Repaso.md`, Clases 1 a 15). Esta revisión permitió detectar y corregir detalles puntuales de cierre:
* **Eliminación de desfasaje (*drift*):** Se detectó que dos códigos de error figuraban en el `README.md` con nombres anteriores (`JUGADOR_CAMISETA_DUPLICATED` y `EQUIPO_MAX_JUGADORES`), mientras que los casos de uso reales lanzaban `CAMISETA_DUPLICATED` y `EQUIPO_CUPO_MAXIMO`. Se alineó la documentación con el código real.
* **Completitud del Checklist (Clase 15):** Se sugirió y agregó `"engines": { "node": ">=18.0.0" }` en `package.json`, la sección **Limitaciones Conocidas** en `README.md` y ejemplos nombrados por cada código de error (`400`, `404`, `409`) en `src/docs/openapi.yaml`.

### 🧪 2. Apoyo en Tests Unitarios de Casos de Uso (Clase 14)
A partir de la solicitud del estudiante de incorporar las prácticas de la Clase 14:
* Se colaboró en la redacción de `tests/helpers/ligaScenario.js` (`buildLigaScenario`) y `tests/usecases.test.js` utilizando el runner nativo `node:test` y `node:assert/strict` (sin sumar dependencias externas).
* Se ejecutó y verificó la suite (`npm test`: 12/12 tests aprobados) probando casos felices, bordes (límite de 25 jugadores), inmutabilidad de partidos finalizados y el espía sobre `eventBus.emit`.

### 📚 3. Explicación y Estudio del Código para la Defensa Oral
Uno de los usos principales de la herramienta fue **pedagógico**: ayudar al estudiante a comprender en profundidad cada capa y línea del proyecto antes de la defensa oral:
* Se respondieron preguntas conceptuales y prácticas directamente sobre el código del repositorio (qué hace `Express`, `async/await`, `validate.js` vs. `schemas/` de Zod, por qué se necesitan dos DAOs, qué hace `toPlain()` frente a `{ ...obj }`, cómo ensambla `container.js`, cómo funcionan `eventBus.js` y `partidoListeners.js`, y cuándo se responde `200`, `201` o `204`).
* Se elaboraron documentos de repaso y navegación interna (`.gemini/1_CONCEPTOS_DESDE_CERO.md` y `.gemini/PITCH_DEFENSA.md`) para estudiar y recorrer el proyecto durante la presentación.

### 🔀 4. Acompañamiento en el Flujo de Git
* La herramienta **no realizó commits ni pushes por cuenta propia**, respetando la regla de la cátedra de que cada integrante debe gestionar sus propios commits.
* Se limitó a consultar el estado remoto (`git fetch` / `git status`) para verificar que no hubiera conflictos con cambios de otros integrantes y proponer los comandos para que el estudiante los ejecutara en su terminal.

---

## 3. Dinámica de Trabajo (Estudiante ↔ Herramienta)

| Responsabilidad | Quién la llevó adelante |
|---|---|
| Definir qué pedir, qué cambiar y qué dejar afuera | **Estudiante** |
| Revisar, preguntar hasta entender cada línea y validar el funcionamiento | **Estudiante** |
| Ejecutar `git add`, `git commit`, `git push` y pruebas manuales en Swagger | **Estudiante** |
| Explicar conceptos, auditar contra el enunciado y asistir en borradores de tests/docs | **Asistente de IA (Herramienta)** |
