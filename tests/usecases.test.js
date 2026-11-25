import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLigaScenario } from './helpers/ligaScenario.js';
import { PARTIDO_FINALIZADO } from '../src/events/eventNames.js';

describe('Casos de Uso — Equipos (con DAO en memoria como Fake)', () => {
  it('crea un equipo válido y lo devuelve como objeto plano con id numérico', async () => {
    // Arrange
    const { equipoUseCases } = buildLigaScenario();

    // Act
    const creado = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });

    // Assert
    assert.equal(creado.id, 1);
    assert.equal(creado.nombre, 'Boca Juniors');
  });

  it('nombre duplicado (insensible a mayúsculas) → rechaza con 409 EQUIPO_NAME_DUPLICATED y no agrega otro registro', async () => {
    // Arrange
    const { equipoUseCases, equipoDao } = buildLigaScenario();
    await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });

    // Act & Assert
    await assert.rejects(
      () =>
        equipoUseCases.crearEquipo({
          nombre: '  boca juniors  ',
          barrio: 'Otro Barrio',
          colores: 'Azul',
          fechaFundacion: '1910-01-01',
        }),
      (err) => err.statusCode === 409 && err.code === 'EQUIPO_NAME_DUPLICATED'
    );

    // El estado no cambió
    const equipos = await equipoDao.findAll();
    assert.equal(equipos.length, 1);
  });

  it('actualizar nombre al de otro equipo existente → rechaza con 409 EQUIPO_NAME_DUPLICATED', async () => {
    // Arrange
    const { equipoUseCases } = buildLigaScenario();
    await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    const river = await equipoUseCases.crearEquipo({
      nombre: 'River Plate',
      barrio: 'Núñez',
      colores: 'Blanco y Rojo',
      fechaFundacion: '1901-05-25',
    });

    // Act & Assert
    await assert.rejects(
      () => equipoUseCases.actualizarEquipo(river.id, { nombre: 'boca juniors' }),
      (err) => err.statusCode === 409 && err.code === 'EQUIPO_NAME_DUPLICATED'
    );
  });

  it('eliminar equipo con jugadores registrados → rechaza con 409 EQUIPO_CON_JUGADORES y el equipo sigue existiendo', async () => {
    // Arrange
    const { equipoUseCases, jugadorUseCases, equipoDao } = buildLigaScenario();
    const equipo = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    await jugadorUseCases.crearJugador({
      nombre: 'Edinson',
      apellido: 'Cavani',
      dni: '11111111',
      numeroCamiseta: 10,
      posicion: 'DELANTERO',
      equipoId: equipo.id,
    });

    // Act & Assert
    await assert.rejects(
      () => equipoUseCases.eliminarEquipo(equipo.id),
      (err) => err.statusCode === 409 && err.code === 'EQUIPO_CON_JUGADORES'
    );

    assert.notEqual(await equipoDao.findById(equipo.id), null);
  });

  it('eliminar equipo con partidos asignados (local o visitante) → rechaza con 409 EQUIPO_CON_PARTIDOS', async () => {
    // Arrange
    const { equipoUseCases, partidoUseCases } = buildLigaScenario();
    const local = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    const visitante = await equipoUseCases.crearEquipo({
      nombre: 'River Plate',
      barrio: 'Núñez',
      colores: 'Blanco y Rojo',
      fechaFundacion: '1901-05-25',
    });
    await partidoUseCases.crearPartido({
      localId: local.id,
      visitanteId: visitante.id,
      fecha: '2026-11-20',
    });

    // Act & Assert
    await assert.rejects(
      () => equipoUseCases.eliminarEquipo(visitante.id),
      (err) => err.statusCode === 409 && err.code === 'EQUIPO_CON_PARTIDOS'
    );
  });
});

describe('Casos de Uso — Jugadores (con DAO en memoria como Fake)', () => {
  it('fichar jugador en equipo inexistente → rechaza con 404 EQUIPO_NOT_FOUND', async () => {
    // Arrange
    const { jugadorUseCases } = buildLigaScenario();

    // Act & Assert
    await assert.rejects(
      () =>
        jugadorUseCases.crearJugador({
          nombre: 'Juan',
          apellido: 'Román',
          dni: '22222222',
          numeroCamiseta: 10,
          posicion: 'MEDIOCAMPISTA',
          equipoId: 999,
        }),
      (err) => err.statusCode === 404 && err.code === 'EQUIPO_NOT_FOUND'
    );
  });

  it('DNI duplicado en la liga → rechaza con 409 JUGADOR_DNI_DUPLICATED', async () => {
    // Arrange
    const { equipoUseCases, jugadorUseCases } = buildLigaScenario();
    const equipo = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    await jugadorUseCases.crearJugador({
      nombre: 'Edinson',
      apellido: 'Cavani',
      dni: '11111111',
      numeroCamiseta: 10,
      posicion: 'DELANTERO',
      equipoId: equipo.id,
    });

    // Act & Assert
    await assert.rejects(
      () =>
        jugadorUseCases.crearJugador({
          nombre: 'Miguel',
          apellido: 'Merentiel',
          dni: '11111111',
          numeroCamiseta: 16,
          posicion: 'DELANTERO',
          equipoId: equipo.id,
        }),
      (err) => err.statusCode === 409 && err.code === 'JUGADOR_DNI_DUPLICATED'
    );
  });

  it('misma camiseta en el mismo equipo → rechaza con 409 CAMISETA_DUPLICATED, pero permite misma camiseta en otro equipo', async () => {
    // Arrange
    const { equipoUseCases, jugadorUseCases } = buildLigaScenario();
    const boca = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    const river = await equipoUseCases.crearEquipo({
      nombre: 'River Plate',
      barrio: 'Núñez',
      colores: 'Blanco y Rojo',
      fechaFundacion: '1901-05-25',
    });
    await jugadorUseCases.crearJugador({
      nombre: 'Edinson',
      apellido: 'Cavani',
      dni: '11111111',
      numeroCamiseta: 10,
      posicion: 'DELANTERO',
      equipoId: boca.id,
    });

    // Act & Assert 1: mismo equipo y misma camiseta -> 409
    await assert.rejects(
      () =>
        jugadorUseCases.crearJugador({
          nombre: 'Kevin',
          apellido: 'Zenón',
          dni: '22222222',
          numeroCamiseta: 10,
          posicion: 'MEDIOCAMPISTA',
          equipoId: boca.id,
        }),
      (err) => err.statusCode === 409 && err.code === 'CAMISETA_DUPLICATED'
    );

    // Act & Assert 2: otro equipo con la camiseta 10 -> permitido
    const jugadorRiver = await jugadorUseCases.crearJugador({
      nombre: 'Manuel',
      apellido: 'Lanzini',
      dni: '33333333',
      numeroCamiseta: 10,
      posicion: 'MEDIOCAMPISTA',
      equipoId: river.id,
    });
    assert.equal(jugadorRiver.numeroCamiseta, 10);
  });

  it('borde del cupo de plantilla: permite el jugador 25 y rechaza el 26 con 409 EQUIPO_CUPO_MAXIMO sin alterar el conteo', async () => {
    // Arrange
    const { equipoUseCases, jugadorUseCases, jugadorDao } = buildLigaScenario();
    const equipo = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });

    for (let i = 1; i <= 25; i++) {
      await jugadorUseCases.crearJugador({
        nombre: `Jugador${i}`,
        apellido: `Apellido${i}`,
        dni: String(10000000 + i),
        numeroCamiseta: i,
        posicion: 'DEFENSOR',
        equipoId: equipo.id,
      });
    }

    assert.equal(await jugadorDao.countByEquipo(equipo.id), 25);

    // Act & Assert: el jugador 26 se rechaza
    await assert.rejects(
      () =>
        jugadorUseCases.crearJugador({
          nombre: 'Jugador26',
          apellido: 'Extra',
          dni: '99999999',
          numeroCamiseta: 26,
          posicion: 'DELANTERO',
          equipoId: equipo.id,
        }),
      (err) => err.statusCode === 409 && err.code === 'EQUIPO_CUPO_MAXIMO'
    );

    // El estado no cambió
    assert.equal(await jugadorDao.countByEquipo(equipo.id), 25);
  });
});

describe('Casos de Uso — Partidos y Eventos (con Fake DAO y Spy EventBus)', () => {
  it('equipos iguales (localId === visitanteId) → rechaza con 400 PARTIDO_EQUIPOS_IGUALES', async () => {
    // Arrange
    const { equipoUseCases, partidoUseCases } = buildLigaScenario();
    const equipo = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });

    // Act & Assert
    await assert.rejects(
      () =>
        partidoUseCases.crearPartido({
          localId: equipo.id,
          visitanteId: equipo.id,
          fecha: '2026-11-20',
        }),
      (err) => err.statusCode === 400 && err.code === 'PARTIDO_EQUIPOS_IGUALES'
    );
  });

  it('finalizarPartido actualiza estado a finalizado y emite partido.finalizado exactamente una vez con el payload correcto', async () => {
    // Arrange
    const { equipoUseCases, partidoUseCases, eventBus } = buildLigaScenario();
    const local = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    const visitante = await equipoUseCases.crearEquipo({
      nombre: 'River Plate',
      barrio: 'Núñez',
      colores: 'Blanco y Rojo',
      fechaFundacion: '1901-05-25',
    });
    const partido = await partidoUseCases.crearPartido({
      localId: local.id,
      visitanteId: visitante.id,
      fecha: '2026-11-20',
    });

    // Act
    const finalizado = await partidoUseCases.finalizarPartido(partido.id, {
      golesLocal: 2,
      golesVisitante: 1,
    });

    // Assert: estado actualizado
    assert.equal(finalizado.estado, 'finalizado');
    assert.equal(finalizado.golesLocal, 2);
    assert.equal(finalizado.golesVisitante, 1);

    // Assert: espía del bus de eventos
    assert.equal(eventBus.emit.mock.callCount(), 1);
    const [eventName, payload] = eventBus.emit.mock.calls[0].arguments;
    assert.equal(eventName, PARTIDO_FINALIZADO);
    assert.deepEqual(payload, {
      partidoId: partido.id,
      localId: local.id,
      localNombre: 'Boca Juniors',
      visitanteId: visitante.id,
      visitanteNombre: 'River Plate',
      golesLocal: 2,
      golesVisitante: 1,
      resultado: 'LOCAL',
      fecha: '2026-11-20',
    });
  });

  it('un partido finalizado es inmutable: no se puede editar, eliminar ni volver a finalizar (y no re-emite evento)', async () => {
    // Arrange
    const { equipoUseCases, partidoUseCases, eventBus } = buildLigaScenario();
    const local = await equipoUseCases.crearEquipo({
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    });
    const visitante = await equipoUseCases.crearEquipo({
      nombre: 'River Plate',
      barrio: 'Núñez',
      colores: 'Blanco y Rojo',
      fechaFundacion: '1901-05-25',
    });
    const partido = await partidoUseCases.crearPartido({
      localId: local.id,
      visitanteId: visitante.id,
      fecha: '2026-11-20',
    });
    await partidoUseCases.finalizarPartido(partido.id, {
      golesLocal: 1,
      golesVisitante: 1,
    });

    // Act & Assert 1: no se puede editar
    await assert.rejects(
      () => partidoUseCases.actualizarPartido(partido.id, { fecha: '2026-12-01' }),
      (err) => err.statusCode === 409 && err.code === 'PARTIDO_FINALIZADO'
    );

    // Act & Assert 2: no se puede eliminar
    await assert.rejects(
      () => partidoUseCases.eliminarPartido(partido.id),
      (err) => err.statusCode === 409 && err.code === 'PARTIDO_FINALIZADO'
    );

    // Act & Assert 3: no se puede volver a finalizar
    await assert.rejects(
      () =>
        partidoUseCases.finalizarPartido(partido.id, {
          golesLocal: 3,
          golesVisitante: 0,
        }),
      (err) => err.statusCode === 409 && err.code === 'PARTIDO_YA_FINALIZADO'
    );

    // El evento solo se emitió 1 vez (en la primera finalización exitosa)
    assert.equal(eventBus.emit.mock.callCount(), 1);
  });
});
