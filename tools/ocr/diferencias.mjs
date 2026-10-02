// Muestra las líneas que cambian el corrector (y la fusión, si hay segunda lectura) en una página:
//   node tools/ocr/diferencias.mjs phb 182
import fs from 'node:fs';
import path from 'node:path';
import { DIR, abrir, textoPagina, textoLibro } from './comun.mjs';
import { crearVocabulario, corregirLineas } from '../../web/src/domain/corrector.js';
import { fusionar } from '../../web/src/domain/fusion.js';
const [id, p] = process.argv.slice(2), textos = [];
for (const b of ['phb', 'dmg', 'faerun']) textos.push(...await textoLibro(b));
const voc = crearVocabulario(textos), doc = await abrir(id), lineas = (await textoPagina(doc, +p)).split('\n');
let c = corregirLineas(lineas, voc);
const f = path.join(DIR, 'lecturas', `${id}.json`), otra = fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).paginas[+p - 1];
if (otra) { const vivas = c.map((l, i) => [l, i]).filter(([l]) => l), fund = fusionar(vivas.map(([l]) => l), corregirLineas(otra.split('\n'), voc).filter(Boolean).join(' '), voc); vivas.forEach(([, i], k) => { c[i] = fund[k]; }); }
lineas.forEach((l, i) => { if (l !== c[i]) console.log(`- ${l}\n+ ${c[i]}`); });
await doc.destroy();
