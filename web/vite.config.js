import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';

function rama() {
  const env = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (env) return env;
  try { return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
const personajesPrueba = () => (process.env.PERSONAJES_PRUEBA ? process.env.PERSONAJES_PRUEBA === '1' : !['main', 'master', ''].includes(rama()));

export default defineConfig(({ mode }) => {
  const windows = mode === 'windows';
  return {
    root: new URL('.', import.meta.url).pathname,
    base: './',
    define: { __PERSONAJES_PRUEBA__: JSON.stringify(personajesPrueba()), __RAMA__: JSON.stringify(rama()) },
    plugins: windows ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
    publicDir: windows ? false : 'public',
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
