import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Notificador que persiste eventos en un archivo de log en formato JSON Lines.
 * Cumple con la interfaz: notify(eventName, payload) -> Promise<void>
 */
export class FileNotifier {
  constructor(filePath = './logs/eventos.log') {
    this.filePath = filePath;
  }

  async notify(eventName, payload) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event: eventName,
      payload,
    }) + '\n';

    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, entry, 'utf-8');
  }
}
