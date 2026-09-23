// Deja el resultado de «npm run build:windows» como dist-windows/grimorio.html
import fs from 'node:fs';
const dir = new URL('../dist-windows/', import.meta.url);
fs.renameSync(new URL('index.html', dir), new URL('grimorio.html', dir));
for (const f of fs.readdirSync(dir)) if (f !== 'grimorio.html') fs.rmSync(new URL(f, dir), { recursive: true, force: true });
const kb = Math.round(fs.statSync(new URL('grimorio.html', dir)).size / 1024);
console.log(`dist-windows/grimorio.html (${kb} kB)`);
