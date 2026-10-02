// Genera docs/auditoria-objetos.md: todos los objetos mágicos de la Guía del Dungeon Master (2024) con lo que hace la app con cada uno.
// Uso: node tools/auditoria-objetos.mjs [libro.json]
//   Sin argumento lee www/libros/guia-del-dungeon-master-2024.json (lo deja `node tools/preparar-libros.mjs`)
//   o, si no está, el PDF de tools/resources (descargado con Git LFS).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { anadirObjeto, equipar, alternarSintonia, claseArmadura } from '../web/src/domain/equipo/equipo.js';
import { pasosVariante, concretar } from '../web/src/domain/equipo/variantesObjeto.js';
import { efectoDe, describirEfecto } from '../web/src/domain/equipo/objetosEfecto.js';
import { usoDe, efectoAlUsar } from '../web/src/domain/equipo/usarObjeto.js';
import { accionesDe } from '../web/src/domain/equipo/accionesObjeto.js';
import { reglas, etiquetaRecarga } from '../web/src/domain/clases/rasgos.js';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
async function objetosDelLibro() {
  const json = process.argv[2] || path.join(RAIZ, 'www/libros/guia-del-dungeon-master-2024.json');
  if (fs.existsSync(json)) return JSON.parse(fs.readFileSync(json, 'utf8')).objetos;
  const pdf = fs.readdirSync(path.join(RAIZ, 'tools/resources')).find(f => /DMG/i.test(f));
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs'), { analizarLibro } = await import('../web/src/domain/libros/libroCompleto.js');
  const doc = await pdfjs.getDocument({ url: path.join(RAIZ, 'tools/resources', pdf), disableFontFace: true, isEvalSupported: false, verbosity: 0 }).promise, paginas = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p), tc = await page.getTextContent(), w = page.getViewport({ scale: 1 }).width;
    paginas.push({ p, w, items: tc.items.filter(i => i.str).map(i => ({ str: i.str, transform: i.transform, width: i.width, height: i.height })) });
  }
  return analizarLibro(paginas).objetos;
}

// Lo que la app no automatiza aunque el objeto tenga números: se dice para que nadie lo dé por hecho
const NOTAS = {
  'Piedra ioun': 'Maestría (+1 a la competencia), Regeneración, Reserva, Sustento y Absorción se consultan; las de característica, Protección y Consciencia son automáticas.',
  Defensora: 'Pasar el bonificador del arma a la CA se anota a mano.',
  'Hoja lunar': 'Las runas adicionales se anotan a mano (la primera da +1).',
  'Ojo y mano de Vecna': 'La Fuerza 20 de la mano y los conjuros del ojo se consultan.',
  'Martillo de rayos': 'Suma 4 a la Fuerza que dan el cinturón de fuerza de gigante o los guanteletes (hasta 30).',
  'Vara del pacto': 'Suma a la CD y al ataque de todos tus conjuros (la Guía lo limita a los de brujo).',
  'Escudo atrapaflechas': '+2 a la CA solo contra ataques a distancia: se consulta.',
  'Anillo de calidez': 'Reduce en 2d8 el daño de frío: se aplica a mano.',
  'Armadura de vulnerabilidad': 'La resistencia y la vulnerabilidad dependen del tipo elegido: se consultan.',
  'Talismán del bien puro': 'El +2 al ataque de conjuro es automático; el daño a los malvados al tocarlo, no.',
  'Talismán del mal definitivo': 'El +2 al ataque de conjuro es automático; el daño a los buenos al tocarlo, no.',
  'Baraja de múltiples cosas': 'Cada carta se resuelve a mano.',
  'Libro de la oscuridad vil': 'El aumento de característica se anota a mano.',
  'Libro de las obras elevadas': 'El aumento de Sabiduría se anota a mano.',
  'Bastón de poder': '+2 a la CA, salvaciones y ataque de conjuro mientras lo empuñas (equipado).',
  'Bastón de los magos': '+2 al ataque de conjuro y ventaja contra conjuros mientras lo empuñas.',
};
const fmt = s => String(s || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const ESTADO = { A: 'Automático', P: 'En parte', T: 'Se consulta' };

const objetos = (await objetosDelLibro()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
const filas = [], cuenta = { A: 0, P: 0, T: 0 };
for (const o of objetos) {
  const pasos = pasosVariante(o), eleccion = Object.fromEntries(pasos.map(p => [p.id, p.opciones[0].valor]));
  const x = concretar(o, eleccion), c = normChar(blankChar({ clase: 'Mago', nivel: 5 })), e = anadirObjeto(c, x, () => 1);
  if (e.sintonia) alternarSintonia(c, e.id);
  if (e.arma || e.armadura) equipar(c, e.id);
  // Lo que cambia en la hoja: efecto por nombre (de cualquier variante), ataque o CA, uso al beber o leer
  const efs = new Set();
  for (const op of pasos.length ? pasos[pasos.length - 1].opciones : [null]) {
    const y = op ? concretar(o, { ...eleccion, [pasos[pasos.length - 1].id]: op.valor }) : x;
    for (const t of describirEfecto(efectoDe(y.nombre))) efs.add(t);
  }
  const hace = [...efs];
  if (e.arma) { hace.unshift(`arma (${e.arma.base || e.base || 'base'}${e.arma.bono ? ` +${e.arma.bono}` : ''}): ataque y daño en combate`); if (e.arma.alImpactar) hace.push('daño adicional anotado junto al ataque'); }
  if (e.armadura) hace.unshift(`CA de ${e.armadura.tipo === 'escudo' ? 'escudo' : 'armadura'}${e.armadura.bono ? ` +${e.armadura.bono}` : ''} (${claseArmadura(c).detalle})`);
  const uso = usoDe(e);
  const alUsar = efectoAlUsar(e);
  if (uso?.accion === 'leer') hace.push(`${uso.etiqueta} permanente (máx. 30)`);
  else if (alUsar) hace.push(`«${uso.etiqueta}»: ${alUsar.charAt(0).toLowerCase()}${alUsar.slice(1)}`);
  const gasta = uso && !alUsar && uso.accion !== 'leer' ? `consumible: «${uso.etiqueta}» gasta uno` : '';
  const rs = reglas(c).filter(r => r.objetoId === e.id);
  const cargas = rs.map(r => `${r.nombre.replace(`${e.nombre}: `, '').replace(`${o.nombre}: `, '').replace(e.nombre, '').replace(/^ \(|\)$/g, '') || 'uso'}: ${o.cargas?.dado && r.id === e.rasgo ? o.cargas.dado : r.max}, ${etiquetaRecarga(r).toLowerCase()}`).join('; ');
  const variantes = pasos.map(p => `${p.titulo}: ${p.opciones.length}`).join(', ');
  const sintonia = o.sintonia ? (o.sintoniaCon ? `Sí (${o.sintoniaCon.replace(/^parte de /, '')}; se comprueba)` : 'Sí') : '—';
  // Acciones del objeto: recuperar espacios, curar, lanzar conjuros con cargas (se ejecutan desde el inventario o el contador de la hoja)
  const coste = a => (a.uso === 'diario' ? '1/día' : a.uso === 'largo' ? '1/descanso largo' : a.uso === 'libre' ? 'a voluntad' : a.porNivel ? '1 carga/nivel' : a.escala ? `${a.coste}–${a.coste + a.escala - 1} cargas` : a.coste ? `${a.coste} c.` : 'a voluntad');
  const acs = accionesDe(x);
  if (acs.length) hace.push(`usos: ${acs.map(a => `${a.tipo === 'conjuro' ? `${a.nombre}${a.nivel && !a.escala ? ` (${a.nivel})` : ''}${a.cd ? ` CD ${a.cd}` : ''}` : a.titulo} [${coste(a)}]`).join(', ')}`);
  const numerico = hace.length > 0, cont = rs.length > 0 || !!gasta;
  if (gasta) hace.length ? hace.push(gasta) : null;
  const k = NOTAS[o.nombre] && numerico ? 'P' : numerico ? 'A' : cont ? 'P' : 'T';
  cuenta[k]++;
  filas.push(`| ${fmt(o.nombre)} | ${fmt(o.tipo)}${o.subtipo ? ` (${fmt(o.subtipo)})` : ''} | ${fmt(o.rareza)} | ${sintonia} | ${fmt(cargas) || '—'} | ${fmt(variantes) || '—'} | ${ESTADO[k]} | ${fmt([hace.join('; '), NOTAS[o.nombre] || (k === 'P' && !numerico ? (gasta ? `${gasta[0].toUpperCase()}${gasta.slice(1)}; el efecto se consulta en el texto.` : 'Contadores en la hoja; el efecto se consulta en el texto.') : '')].filter(Boolean).join('. ')) || 'Texto en la biblioteca.'} |`);
}

const md = `# Auditoría de objetos mágicos (Guía del Dungeon Master de 2024)

Generado por \`tools/auditoria-objetos.mjs\` con los ${objetos.length} objetos que el lector saca del PDF de la Guía. Para cada uno:
si pide sintonización (y quién puede), las cargas y usos que pasan a la hoja como contadores con su recarga, las variantes que la app
pide elegir al añadirlo, y lo que la hoja aplica sola.

- **Automático**: la hoja aplica sus números (CA, salvaciones, características, ataque y daño, ventajas, resistencias, curación…).
- **En parte**: lleva la cuenta de cargas o usos, o automatiza una parte; el resto se consulta en el texto.
- **Se consulta**: efectos narrativos o de situación (volar, ver, invocar…): el texto está en la biblioteca.

Resumen: ${cuenta.A} automáticos, ${cuenta.P} en parte y ${cuenta.T} que se consultan.

## Cómo funcionan en la hoja

- **Sintonía**: hasta 3 objetos. No deja sintonizar si falta el requisito (clase, lanzador de conjuros, especie) ni con el objeto en el alijo; guardarlo en el alijo deshace la sintonía.
- **Cuándo cuenta un efecto**: el objeto tiene que ir encima (no en el alijo), sintonizado si lo pide y, si es arma o armadura, equipado. Excepciones que funcionan con solo llevarlas: Arma de advertencia, Filo de la fortuna, Hacha de los señores enanos, Espada de Kas, Martillo de rayos y Garrote grande atronador.
- **Cargas**: se crean como contador al añadir el objeto; si el libro da las cargas en dados («1d3 cargas», «1d6 + 3 cuentas») se tiran entonces. Se recargan al amanecer (descanso largo) con su tirada, todas o ninguna, y la nota dice qué pasa al gastar la última. Solo se ven en la hoja mientras el objeto se puede usar.
- **Usos diarios**: las propiedades que «no pueden volver a usarse hasta el siguiente amanecer» (o hasta un descanso) tienen su propio contador.
- **Consumibles**: pociones, pergaminos, aceites, polvos, fichas de pluma, gemas elementales, munición… se apilan y «Beber» o «Usar» gasta uno. Las dosis («1d4 + 1 dosis», «3d4 judías») se tiran al añadirlo.
- **Usos del objeto**: botones en el inventario (y al gastar su contador en la hoja) que hacen lo que dice el objeto: recuperar un espacio de conjuro (Perla de poder, Vara del pacto), curarte (Talismán de salud), tirar su daño (Bastón de impacto) o lanzar un conjuro gastando sus cargas, con la versión de nivel que pagan y la CD del objeto si la fija; la tirada del conjuro se abre sola.
- **Manuales y tomos**: «Leer» sube la característica 2 (hasta 30) y el libro pierde su magia.

## Objetos

| Objeto | Tipo | Rareza | Sintonía | Cargas y usos | Variantes | Estado | Qué hace la app |
|---|---|---|---|---|---|---|---|
${filas.join('\n')}
`;
fs.writeFileSync(path.join(RAIZ, 'docs/auditoria-objetos.md'), md);
console.log(`ok: ${objetos.length} objetos (${cuenta.A} automáticos, ${cuenta.P} en parte, ${cuenta.T} se consultan)`);
