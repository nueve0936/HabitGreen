// Prueba la app por cable, sin Wi-Fi: sirve con el teléfono en modo avión y en redes que bloquean la
// conexión entre equipos. Uso: npm run usb
//
// Elige un puerto libre para Metro, abre el túnel USB (adb reverse) y abre la app. Mientras corre,
// vuelve a abrir el túnel si desconectas el cable o lo cambias a otro puerto USB.

import { execFile, execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ejecutar = promisify(execFile);
const PRIMER_PUERTO = 8081;
const ULTIMO_PUERTO = 8099;
const INTERVALO_MS = 2000;
// Solo para comprobar el script sin abrir la app en el teléfono.
const abrirApp = !process.argv.includes('--sin-abrir');

const { expo } = JSON.parse(readFileSync(join(raiz, 'app.json'), 'utf8'));
const paquete = expo.android.package;
const esquema = Array.isArray(expo.scheme) ? expo.scheme[0] : expo.scheme;

function buscarAdb() {
  const archivo = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const sdks = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);
  for (const sdk of sdks) {
    const ruta = join(sdk, 'platform-tools', archivo);
    if (existsSync(ruta)) return ruta;
  }
  return archivo; // Último intento: que esté en el PATH.
}

const adb = buscarAdb();

function puertoLibre(puerto) {
  return new Promise((resolver) => {
    const prueba = createServer();
    prueba.once('error', () => resolver(false));
    prueba.once('listening', () => prueba.close(() => resolver(true)));
    prueba.listen(puerto);
  });
}

async function elegirPuerto() {
  for (let puerto = PRIMER_PUERTO; puerto <= ULTIMO_PUERTO; puerto++) {
    if (await puertoLibre(puerto)) return puerto;
  }
  throw new Error(`No hay puertos libres entre ${PRIMER_PUERTO} y ${ULTIMO_PUERTO}.`);
}

async function telefonos() {
  const { stdout } = await ejecutar(adb, ['devices']);
  return stdout
    .split('\n')
    .slice(1)
    .map((linea) => linea.trim().split(/\s+/))
    .filter(([serie]) => serie)
    .map(([serie, estado]) => ({ serie, estado }));
}

async function metroListo(puerto) {
  try {
    const respuesta = await fetch(`http://127.0.0.1:${puerto}/status`);
    return (await respuesta.text()).includes('packager-status:running');
  } catch {
    return false;
  }
}

async function tunelActivo(serie, puerto) {
  const { stdout } = await ejecutar(adb, ['-s', serie, 'reverse', '--list']);
  return stdout.includes(`tcp:${puerto}`);
}

async function abrirEnTelefono(serie, puerto) {
  const url = `${esquema}://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${puerto}`;
  await ejecutar(adb, [
    '-s',
    serie,
    'shell',
    'am',
    'start',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `'${url}'`,
    paquete,
  ]);
}

const puerto = await elegirPuerto();
if (puerto !== PRIMER_PUERTO) {
  console.log(`[usb] El puerto ${PRIMER_PUERTO} está ocupado: Metro usará el ${puerto}.`);
}

// EXPO_OFFLINE: Expo no usa internet, así que también funciona sin red en la computadora. Va como
// variable porque Expo no permite combinar `--offline` con `--localhost`.
const metro = spawn(
  process.execPath,
  [
    join(raiz, 'node_modules', 'expo', 'bin', 'cli'),
    'start',
    '--dev-client',
    '--localhost',
    '--port',
    String(puerto),
  ],
  { cwd: raiz, stdio: 'inherit', env: { ...process.env, EXPO_OFFLINE: '1' } },
);

const conectados = new Set();
const abiertos = new Set();
const avisados = new Set();
let adbDisponible = true;

async function revisar() {
  let lista;
  try {
    lista = await telefonos();
    adbDisponible = true;
  } catch {
    if (adbDisponible) {
      console.log('[usb] No encontré adb. Instala Android SDK Platform-Tools.');
    }
    adbDisponible = false;
    return;
  }

  const presentes = new Set(lista.filter((t) => t.estado === 'device').map((t) => t.serie));
  for (const serie of conectados) {
    if (!presentes.has(serie)) {
      conectados.delete(serie);
      console.log('[usb] Teléfono desconectado. Conéctalo a cualquier puerto USB.');
    }
  }

  for (const { serie, estado } of lista) {
    if (estado === 'unauthorized' && !avisados.has(serie)) {
      avisados.add(serie);
      console.log('[usb] En el teléfono, acepta el permiso de «Depuración USB».');
    }
    if (estado !== 'device') continue;

    if (!(await tunelActivo(serie, puerto))) {
      await ejecutar(adb, ['-s', serie, 'reverse', `tcp:${puerto}`, `tcp:${puerto}`]);
    }
    if (!conectados.has(serie)) {
      conectados.add(serie);
      console.log('[usb] Teléfono conectado por cable.');
    }
    // Solo se abre una vez: al reconectar el cable, la app ya abierta se conecta sola.
    if (abrirApp && !abiertos.has(serie) && (await metroListo(puerto))) {
      abiertos.add(serie);
      await abrirEnTelefono(serie, puerto);
    }
  }
}

let activo = true;
async function vigilar() {
  while (activo) {
    try {
      await revisar();
    } catch {
      // Un cable que se desconecta a media revisión no debe detener el script.
    }
    await new Promise((resolver) => setTimeout(resolver, INTERVALO_MS));
  }
}
void vigilar();

function cerrarTuneles() {
  for (const serie of conectados) {
    try {
      execFileSync(adb, ['-s', serie, 'reverse', '--remove', `tcp:${puerto}`], { stdio: 'ignore' });
    } catch {
      // El teléfono ya no está conectado.
    }
  }
}

metro.on('exit', (codigo) => {
  activo = false;
  cerrarTuneles();
  process.exit(codigo ?? 0);
});

// Ctrl+C llega también a Metro; aquí solo se evita que el script termine antes de limpiar.
process.on('SIGINT', () => {});
process.on('SIGTERM', () => metro.kill());
