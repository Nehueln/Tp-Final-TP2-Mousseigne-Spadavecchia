/**
 * Notificador que emite la información del evento por consola estándar.
 * Cumple con la interfaz: notify(eventName, payload) -> Promise<void>
 */
export class ConsoleNotifier {
  async notify(eventName, payload) {
    console.log(`\n📢 [NOTIFICACIÓN] Evento recibido: "${eventName}"`);
    console.log(JSON.stringify(payload, null, 2));
  }
}
