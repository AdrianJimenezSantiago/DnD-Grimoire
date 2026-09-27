import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';

function rama() {
  const env = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (env) return env;
  try { return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
// En pantallas táctiles un :hover se queda «pegado» tras tocar (y obliga a recalcular estilos al tocar cualquier cosa).
// Este plugin envuelve cada regla con :hover en @media (hover: hover), así solo se aplica con ratón o trackpad.
// Si una regla mezcla selectores con y sin :hover, se parte en dos para no perder los demás.
const hoverSoloConPuntero = () => ({
  postcssPlugin: 'hover-solo-con-puntero',
  Once(root, { AtRule }) {
    root.walkRules(rule => {
      if (!rule.selector.includes(':hover')) return;
      const p = rule.parent;
      if (p?.type === 'atrule' && (/keyframes$/.test(p.name) || (p.name === 'media' && /hover:\s*hover/.test(p.params)))) return;
      const con = rule.selectors.filter(s => s.includes(':hover')), sin = rule.selectors.filter(s => !s.includes(':hover'));
      const media = new AtRule({ name: 'media', params: '(hover: hover)' });
      if (sin.length) { rule.after(media); media.append(rule.clone({ selectors: con })); rule.selectors = sin; }
      else { rule.before(media); media.append(rule); }
    });
  },
});
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
    css: { postcss: { plugins: [hoverSoloConPuntero()] } },
    server: { host: true },
  };
});
