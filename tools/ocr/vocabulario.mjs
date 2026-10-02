// Genera web/public/data/vocabulario.json: frecuencia de cada palabra (3 o más apariciones) en los manuales con texto.
// La app lo usa como vocabulario de partida al corregir el OCR de cualquier PDF, aunque sea un suplemento corto.
//   node tools/ocr/vocabulario.mjs
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, textoLibro } from './comun.mjs';

const f = new Map();
for (const id of ['phb', 'dmg', 'faerun']) for (const t of await textoLibro(id)) for (const w of t.match(/\p{L}+/gu) || []) f.set(w, (f.get(w) || 0) + 1);
const out = Object.fromEntries([...f].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
const destino = path.join(RAIZ, 'web/public/data/vocabulario.json');
fs.writeFileSync(destino, JSON.stringify(out));
console.log(`${Object.keys(out).length} palabras en ${path.relative(RAIZ, destino)}`);
