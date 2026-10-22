// scripts/smoke.mjs
// Script de prueba de humo automatizado (Node 18+, fetch nativo, sin dependencias)

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

function sanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj !== null && typeof obj === 'object') {
    const copy = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k !== 'createdAt' && k !== 'updatedAt') {
        copy[k] = sanitize(v);
      }
    }
    return copy;
  }
  return obj;
}

const transcript = [];

async function step(name, { method = 'GET', path, body, rawBody, headers = {}, expectedStatus }) {
  const url = `${BASE_URL}${path}`;
  const reqHeaders = { ...headers };

  let requestBody = undefined;
  if (rawBody !== undefined) {
    requestBody = rawBody;
    if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body);
    reqHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: requestBody,
  });

  let responseData = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    responseData = await res.json();
  } else {
    const text = await res.text();
    responseData = text ? { raw: text } : null;
  }

  if (res.status !== expectedStatus) {
    console.error(`\n❌ FALLO EN PASO "${name}"`);
    console.error(`Esperado HTTP ${expectedStatus}, recibido HTTP ${res.status}`);
    console.error(`URL: ${method} ${url}`);
    console.error(`Respuesta:`, JSON.stringify(responseData, null, 2));
    process.exit(1);
  }

  transcript.push({
    step: name,
    method,
    path,
    status: res.status,
    response: sanitize(responseData),
  });
}

async function run() {
  // 1. Healthcheck
  await step('1. Healthcheck', {
    path: '/health',
    expectedStatus: 200,
  });

  // 2. Crear equipos
  await step('2. Crear Equipo Boca Juniors', {
    method: 'POST',
    path: '/equipos',
    body: {
      nombre: 'Boca Juniors',
      barrio: 'La Boca',
      colores: 'Azul y Oro',
      fechaFundacion: '1905-04-03',
    },
    expectedStatus: 201,
  });

  await step('3. Crear Equipo River Plate', {
    method: 'POST',
    path: '/equipos',
    body: {
      nombre: 'River Plate',
      barrio: 'Nuñez',
      colores: 'Rojo y Blanco',
      fechaFundacion: '1901-05-25',
    },
    expectedStatus: 201,
  });

  await step('4. Crear Equipo Racing Club', {
    method: 'POST',
    path: '/equipos',
    body: {
      nombre: 'Racing Club',
      barrio: 'Avellaneda',
      colores: 'Celeste y Blanco',
      fechaFundacion: '1903-03-25',
    },
    expectedStatus: 201,
  });

  // 3. Regla: Nombre de equipo duplicado (409)
  await step('5. Error duplicar nombre de equipo', {
    method: 'POST',
    path: '/equipos',
    body: {
      nombre: 'Boca Juniors',
      barrio: 'Otro',
      colores: 'Otros',
      fechaFundacion: '2000-01-01',
    },
    expectedStatus: 409,
  });

  // 4. Listar y obtener equipo
  await step('6. Listar equipos', {
    path: '/equipos',
    expectedStatus: 200,
  });

  await step('7. Obtener equipo por ID', {
    path: '/equipos/1',
    expectedStatus: 200,
  });

  await step('8. Actualizar equipo', {
    method: 'PUT',
    path: '/equipos/1',
    body: { colores: 'Azul y Amarillo Oro' },
    expectedStatus: 200,
  });

  // 5. Crear jugadores y reglas de negocio
  await step('9. Crear Jugador en Boca', {
    method: 'POST',
    path: '/jugadores',
    body: {
      nombre: 'Edinson',
      apellido: 'Cavani',
      dni: '11111111',
      numeroCamiseta: 10,
      posicion: 'DELANTERO',
      equipoId: 1,
    },
    expectedStatus: 201,
  });

  await step('10. Error camiseta duplicada en mismo equipo', {
    method: 'POST',
    path: '/jugadores',
    body: {
      nombre: 'Miguel',
      apellido: 'Merentiel',
      dni: '22222222',
      numeroCamiseta: 10,
      posicion: 'DELANTERO',
      equipoId: 1,
    },
    expectedStatus: 409,
  });

  await step('11. Error DNI duplicado en el torneo', {
    method: 'POST',
    path: '/jugadores',
    body: {
      nombre: 'Clon',
      apellido: 'Cavani',
      dni: '11111111',
      numeroCamiseta: 9,
      posicion: 'DELANTERO',
      equipoId: 2,
    },
    expectedStatus: 409,
  });

  await step('12. Error jugador con equipo inexistente', {
    method: 'POST',
    path: '/jugadores',
    body: {
      nombre: 'Fantasma',
      apellido: 'Perez',
      dni: '33333333',
      numeroCamiseta: 1,
      posicion: 'ARQUERO',
      equipoId: 9999,
    },
    expectedStatus: 404,
  });

  await step('13. Listar jugadores', {
    path: '/jugadores',
    expectedStatus: 200,
  });

  await step('14. Filtrar jugadores por equipo', {
    path: '/jugadores?equipoId=1',
    expectedStatus: 200,
  });

  // 6. Regla: no eliminar equipo con jugadores (409)
  await step('15. Error eliminar equipo con jugadores', {
    method: 'DELETE',
    path: '/equipos/1',
    expectedStatus: 409,
  });

  // 7. Partidos: creación y reglas
  await step('16. Crear partido Boca vs River', {
    method: 'POST',
    path: '/partidos',
    body: {
      localId: 1,
      visitanteId: 2,
      fecha: '2026-11-10',
    },
    expectedStatus: 201,
  });

  await step('17. Error partido con equipos iguales', {
    method: 'POST',
    path: '/partidos',
    body: {
      localId: 1,
      visitanteId: 1,
      fecha: '2026-11-10',
    },
    expectedStatus: 400,
  });

  await step('18. Error partido con equipo inexistente', {
    method: 'POST',
    path: '/partidos',
    body: {
      localId: 1,
      visitanteId: 9999,
      fecha: '2026-11-10',
    },
    expectedStatus: 404,
  });

  await step('19. Listar partidos', {
    path: '/partidos',
    expectedStatus: 200,
  });

  await step('20. Obtener partido por ID', {
    path: '/partidos/1',
    expectedStatus: 200,
  });

  // 8. Regla: no eliminar equipo con partidos (409)
  await step('21. Error eliminar equipo con partidos', {
    method: 'DELETE',
    path: '/equipos/2',
    expectedStatus: 409,
  });

  // 9. Finalizar partido y reglas de partido finalizado
  await step('22. Finalizar partido con resultado 2-1', {
    method: 'POST',
    path: '/partidos/1/finalizar',
    body: {
      golesLocal: 2,
      golesVisitante: 1,
    },
    expectedStatus: 200,
  });

  await step('23. Error finalizar partido ya finalizado', {
    method: 'POST',
    path: '/partidos/1/finalizar',
    body: {
      golesLocal: 3,
      golesVisitante: 1,
    },
    expectedStatus: 409,
  });

  await step('24. Error modificar partido finalizado', {
    method: 'PUT',
    path: '/partidos/1',
    body: {
      fecha: '2026-11-20',
    },
    expectedStatus: 409,
  });

  await step('25. Error eliminar partido finalizado', {
    method: 'DELETE',
    path: '/partidos/1',
    expectedStatus: 409,
  });

  // 10. Regla de cupo máximo de 25 jugadores
  // Llenar Racing (equipo 3) hasta 25 jugadores
  for (let i = 1; i <= 25; i++) {
    const dni = String(40000000 + i);
    await step(`26. Inscribir jugador ${i}/25 en Racing`, {
      method: 'POST',
      path: '/jugadores',
      body: {
        nombre: `Jugador${i}`,
        apellido: 'Test',
        dni,
        numeroCamiseta: i,
        posicion: i === 1 ? 'ARQUERO' : 'MEDIOCAMPISTA',
        equipoId: 3,
      },
      expectedStatus: 201,
    });
  }

  // Jugador 26 en Racing debe ser rechazado con 409
  await step('27. Error cupo maximo de 25 jugadores alcanzado', {
    method: 'POST',
    path: '/jugadores',
    body: {
      nombre: 'Excedente',
      apellido: 'Test',
      dni: '40000099',
      numeroCamiseta: 26,
      posicion: 'DELANTERO',
      equipoId: 3,
    },
    expectedStatus: 409,
  });

  // 11. Errores de formato JSON y ruta no encontrada
  await step('28. Error JSON mal formado en body', {
    method: 'POST',
    path: '/equipos',
    rawBody: '{ esto no es json valido ',
    headers: { 'Content-Type': 'application/json' },
    expectedStatus: 400,
  });

  await step('29. Error ruta no encontrada', {
    path: '/ruta-que-no-existe-nunca',
    expectedStatus: 404,
  });

  // Imprimir transcripción final formateada en stdout
  console.log(JSON.stringify(transcript, null, 2));
}

run().catch((err) => {
  console.error('Error fatal al ejecutar smoke tests:', err);
  process.exit(1);
});
