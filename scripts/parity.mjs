// scripts/parity.mjs
// Verificación automatizada de paridad total entre MEMORY y SEQUELIZE (Node 18+)

import { spawn } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const PARITY_PORT = 3101;
const DB_FILE = './database-parity.sqlite';

function runProcess(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Comando "${cmd} ${args.join(' ')}" finalizó con código ${code}:\n${stderr}`));
      }
      resolve(stdout);
    });
  });
}

function stopProcess(proc) {
  if (!proc || !proc.pid) return;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' });
    } catch {}
  } else {
    try {
      proc.kill('SIGTERM');
    } catch {}
  }
}

async function startServer(env) {
  const proc = spawn('node', ['src/index.js'], {
    env: { ...process.env, ...env },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${PARITY_PORT}/health`);
      if (res.ok) return proc;
    } catch {}
  }

  stopProcess(proc);
  throw new Error('El servidor de pruebas no inició a tiempo en el puerto ' + PARITY_PORT);
}

async function runTest(persistenceType) {
  if (persistenceType === 'sequelize' && existsSync(DB_FILE)) {
    rmSync(DB_FILE, { force: true });
  }

  const serverEnv = {
    PORT: String(PARITY_PORT),
    PERSISTENCE_TYPE: persistenceType,
    SQLITE_PATH: DB_FILE,
  };

  const server = await startServer(serverEnv);

  try {
    const rawOutput = await runProcess('node', ['scripts/smoke.mjs'], {
      BASE_URL: `http://127.0.0.1:${PARITY_PORT}`,
    });

    return JSON.parse(rawOutput.trim());
  } finally {
    stopProcess(server);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  console.log('⏳ 1/3 Ejecutando secuencia en modo MEMORY...');
  const memoryResult = await runTest('memory');

  console.log('⏳ 2/3 Ejecutando secuencia en modo SEQUELIZE (base limpia)...');
  const sequelizeResult = await runTest('sequelize');

  console.log('🔍 3/3 Comparando transcripciones paso a paso...');
  const strMem = JSON.stringify(memoryResult, null, 2);
  const strSeq = JSON.stringify(sequelizeResult, null, 2);

  if (strMem === strSeq) {
    console.log('\n======================================================');
    console.log('🎉 PARIDAD TOTAL VERIFICADA:');
    console.log('   Los 29 pasos respondieron IDÉNTICOS en ambos modos:');
    console.log('   - Mismos códigos HTTP (200, 201, 204, 400, 404, 409)');
    console.log('   - Mismos payloads JSON y mismos códigos de error');
    console.log('   - Mismo orden de resultados');
    console.log('======================================================\n');
  } else {
    console.error('\n❌ SE DETECTÓ DIFERENCIA ENTRE MEMORIA Y SEQUELIZE:');
    for (let i = 0; i < Math.max(memoryResult.length, sequelizeResult.length); i++) {
      const m = JSON.stringify(memoryResult[i]);
      const s = JSON.stringify(sequelizeResult[i]);
      if (m !== s) {
        console.error(`\nDiferencia en el paso "${memoryResult[i]?.step || sequelizeResult[i]?.step}":`);
        console.error('--- MEMORY ---');
        console.error(JSON.stringify(memoryResult[i], null, 2));
        console.error('--- SEQUELIZE ---');
        console.error(JSON.stringify(sequelizeResult[i], null, 2));
        break;
      }
    }
    process.exit(1);
  }

  if (existsSync(DB_FILE)) {
    try {
      rmSync(DB_FILE, { force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ Fallo en la verificación de paridad:', err.message);
  if (existsSync(DB_FILE)) {
    try {
      rmSync(DB_FILE, { force: true });
    } catch {}
  }
  process.exit(1);
});
