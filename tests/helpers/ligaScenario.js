import { mock } from 'node:test';
import { EquipoMemoryDao } from '../../src/dao/memory/EquipoMemoryDao.js';
import { JugadorMemoryDao } from '../../src/dao/memory/JugadorMemoryDao.js';
import { PartidoMemoryDao } from '../../src/dao/memory/PartidoMemoryDao.js';
import { makeEquipoUseCases } from '../../src/usecases/equipoUseCases.js';
import { makeJugadorUseCases } from '../../src/usecases/jugadorUseCases.js';
import { makePartidoUseCases } from '../../src/usecases/partidoUseCases.js';

/**
 * Helper de escenario (patrón Builder de la Clase 14):
 * Arma un mundo aislado por cada test con instancias nuevas de los DAOs en memoria (Fakes)
 * y un bus de eventos con espía (Spy) para verificar emisiones sin efectos secundarios reales.
 */
export function buildLigaScenario() {
  const equipoDao = new EquipoMemoryDao();
  const jugadorDao = new JugadorMemoryDao();
  const partidoDao = new PartidoMemoryDao();

  const eventBus = {
    emit: mock.fn(),
  };

  const equipoUseCases = makeEquipoUseCases({
    equipoDao,
    jugadorDao,
    partidoDao,
  });

  const jugadorUseCases = makeJugadorUseCases({
    jugadorDao,
    equipoDao,
  });

  const partidoUseCases = makePartidoUseCases({
    partidoDao,
    equipoDao,
    eventBus,
  });

  return {
    equipoDao,
    jugadorDao,
    partidoDao,
    eventBus,
    equipoUseCases,
    jugadorUseCases,
    partidoUseCases,
  };
}
