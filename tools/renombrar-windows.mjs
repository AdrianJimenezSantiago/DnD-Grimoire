// Deja el resultado de «npm run build:windows» como dist-windows/grimorio.html
import fs from 'node:fs';
const dir = new URL('../dist-windows/', import.meta.url);
const src = new URL('index.html', dir);
if (!fs.existsSync(src)) {
  console.error('No existe dist-windows/index.html. ¿Está actualizado web/vite.config.js (modo «windows» con vite-plugin-singlefile)?');
  process.exit(1);
}
const html = fs.readFileSync(src, 'utf8');
if (/<script[^>]+src=/.test(html)) {
  console.error('dist-windows/index.html todavía enlaza archivos externos: el empaquetado en un solo archivo no se ha aplicado.');
  process.exit(1);
}
fs.renameSync(src, new URL('grimorio.html', dir));
for (const f of fs.readdirSync(dir)) if (f !== 'grimorio.html') fs.rmSync(new URL(f, dir), { recursive: true, force: true });
console.log(`dist-windows/grimorio.html (${Math.round(fs.statSync(new URL('grimorio.html', dir)).size / 1024)} kB)`);
