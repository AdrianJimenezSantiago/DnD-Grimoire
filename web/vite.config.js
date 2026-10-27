import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function rama() {
  const env = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (env) return env;
  try { return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
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
const sw = (version, precache) => `const V = 'grimorio-${version}', PRE = ${JSON.stringify(['./', ...precache])};
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('grimorio-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const guardar = (req, res) => { if (res.ok && res.type === 'basic') { const c = res.clone(); caches.open(V).then(k => k.put(req, c)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => guardar('./', res)).catch(() => caches.match('./'))); return; }
  if (u.pathname.includes('/assets/')) { e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => guardar(r, res)))); return; }
  if (u.pathname.includes('/data/')) { e.respondWith(caches.match(r).then(x => { const red = fetch(r).then(res => guardar(r, res)); if (x) { e.waitUntil(red.catch(() => {})); return x; } return red; })); }
});
`;
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "script-src-attr 'none'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
const appWeb = () => ({
  name: 'grimorio-app-web', apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'link', attrs: { rel: 'manifest', href: 'manifest.webmanifest' }, injectTo: 'head' },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', href: 'icons/apple-touch-icon.png' }, injectTo: 'head' },
  ],
  generateBundle(_, bundle) {
    const pre = Object.keys(bundle).filter(f => !/pdf|\.map$|\.woff$/.test(f) && !f.endsWith('.html')).sort();
    const version = createHash('sha1').update(pre.join('|')).digest('hex').slice(0, 10);
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw(version, [...pre, 'data/compendio.json', 'data/vocabulario.json']) });
  },
});
const personajesPrueba = () => (process.env.PERSONAJES_PRUEBA ? process.env.PERSONAJES_PRUEBA === '1' : !['main', 'master', ''].includes(rama()));

export default defineConfig(({ mode }) => {
  const windows = mode === 'windows';
  return {
    root: new URL('.', import.meta.url).pathname,
    base: './',
    define: { __PERSONAJES_PRUEBA__: JSON.stringify(personajesPrueba()), __RAMA__: JSON.stringify(rama()) },
    plugins: windows ? [viteSingleFile({ removeViteModuleLoader: true })] : [appWeb()],
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
