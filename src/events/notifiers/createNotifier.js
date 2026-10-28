import { ConsoleNotifier } from './ConsoleNotifier.js';
import { FileNotifier } from './FileNotifier.js';

/**
 * Notificador compuesto que delega en múltiples notificadores simultáneamente.
 */
export class CompositeNotifier {
  constructor(notifiers = []) {
    this.notifiers = notifiers;
  }

  async notify(eventName, payload) {
    for (const notifier of this.notifiers) {
      await notifier.notify(eventName, payload);
    }
  }
}

/**
 * Factory de notificadores según la variable NOTIFIER_TYPE ('console' | 'file' | 'both').
 */
export const createNotifier = ({ type = 'console', filePath = './logs/eventos.log' } = {}) => {
  const normalizedType = (type || 'console').toLowerCase();

  switch (normalizedType) {
    case 'file':
      return new FileNotifier(filePath);
    case 'both':
      return new CompositeNotifier([
        new ConsoleNotifier(),
        new FileNotifier(filePath),
      ]);
    case 'console':
    default:
      return new ConsoleNotifier();
  }
};
