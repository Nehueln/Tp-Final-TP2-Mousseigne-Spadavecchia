import { EventEmitter } from 'node:events';

/**
 * Fábrica para instanciar el bus de eventos de la aplicación.
 * Desacopla la lógica de negocio de los efectos secundarios.
 */
export const createEventBus = () => {
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(20);
  return eventBus;
};
