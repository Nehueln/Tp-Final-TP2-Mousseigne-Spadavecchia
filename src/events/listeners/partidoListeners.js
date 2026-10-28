import { PARTIDO_FINALIZADO } from '../eventNames.js';

/**
 * Registra los listeners asociados al ciclo de vida de los partidos.
 * 
 * Regla de arquitectura: El listener captura sus propios errores en un bloque try/catch
 * garantizando que una falla en la notificación (ej. consola o archivo) jamás impacte
 * en la regla de negocio ni propague promesas rechazadas no manejadas.
 */
export const registerPartidoListeners = ({ eventBus, notifier }) => {
  eventBus.on(PARTIDO_FINALIZADO, async (payload) => {
    try {
      await notifier.notify(PARTIDO_FINALIZADO, payload);
    } catch (error) {
      console.error(
        `[LISTENER ERROR] Error capturado al procesar evento "${PARTIDO_FINALIZADO}":`,
        error.message || error
      );
    }
  });
};
