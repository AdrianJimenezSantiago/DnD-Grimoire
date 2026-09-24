import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';

// Rama que se compila: Vercel y GitHub la dan en variables de entorno; en local se pregunta a git.
function rama() {
  const env = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (env) return env;
  try { return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
// Personajes de prueba (uno por subclase, nivel 8): en todas las ramas salvo main.
// PERSONAJES_PRUEBA=1 o =0 lo fuerza en cualquier rama.
const personajesPrueba = () => (process.env.PERSONAJES_PRUEBA ? process.env.PERSONAJES_PRUEBA === '1' : !['main', 'master', ''].includes(rama()));

// «npm run build»          → web para Android (Capacitor) en www/
// «npm run build:windows»  → un único grimorio.html que se abre con doble clic, sin servidor ni conexión
export default defineConfig(({ mode }) => {
  const windows = mode === 'windows';
  return {
    root: new URL('.', import.meta.url).pathname,
    base: './',
    define: { __PERSONAJES_PRUEBA__: JSON.stringify(personajesPrueba()), __RAMA__: JSON.stringify(rama()) },
    plugins: windows ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
    publicDir: windows ? false : 'public',       // en Windows el compendio va dentro del HTML
    build: {
      outDir: windows ? '../dist-windows' : '../www',
      emptyOutDir: true,
      target: ['chrome100', 'safari15'],
      cssMinify: true,
      assetsInlineLimit: windows ? 100_000_000 : 0,
      chunkSizeWarningLimit: windows ? 5000 : 500,
      reportCompressedSize: !windows,
    },
    server: { host: true },
  };
});
