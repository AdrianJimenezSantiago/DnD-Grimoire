// Muestra las líneas que cambia el corrector en una página: node tools/ocr/diferencias.mjs phb 182
import { abrir, textoPagina, textoLibro } from './comun.mjs';
import { crearVocabulario, corregirLineas } from '../../web/src/domain/corrector.js';
const [id, p] = process.argv.slice(2), textos = [];
for (const b of ['phb', 'dmg', 'faerun']) textos.push(...await textoLibro(b));
const voc = crearVocabulario(textos), doc = await abrir(id), lineas = (await textoPagina(doc, +p)).split('\n'), c = corregirLineas(lineas, voc);
lineas.forEach((l, i) => { if (l !== c[i]) console.log(`- ${l}\n+ ${c[i]}`); });
await doc.destroy();
