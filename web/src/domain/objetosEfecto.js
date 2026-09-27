import { norm } from '../core/util.js';

// Efectos numéricos de los objetos mágicos (Guía del Dungeon Master de 2024) que la hoja aplica sola.
// Se reconocen por el nombre, así que valen igual los importados del libro que los escritos a mano.
//   ca, salv, pruebas: bonificadores; fija: la característica pasa a ese valor si es menor;
//   suma: +n a una característica hasta un máximo; cd/atk: CD y ataque de conjuro;
//   sinArmadura: solo sin armadura ni escudo; caBase: CA base sin armadura (10 + Des pasa a caBase + Des).
const GIGANTE = [[/colinas?/, 21], [/escarcha|hielo/, 23], [/piedra/, 23], [/fuego/, 25], [/nubes?/, 27], [/tormentas?/, 29]];
const IONIANA = [[/fuerza/, 'fue'], [/agilidad|destreza/, 'des'], [/fortaleza|constitucion/, 'con'], [/perspicacia|intelecto|inteligencia/, 'int'], [/perspicacia|sabiduria|intuicion/, 'sab'], [/liderazgo|carisma/, 'car']];
const masN = n => { const m = /\+\s*(\d)\b/.exec(n); return m ? +m[1] : 0; };
export const OBJETOS_EFECTO = [
  { re: /^capa de proteccion/, sintonia: true, ca: 1, salv: 1 },
  { re: /^anillo de proteccion/, sintonia: true, ca: 1, salv: 1 },
  { re: /^piedra de la (buena )?suerte|^piedra de la fortuna/, sintonia: true, salv: 1, pruebas: 1 },
  { re: /^brazales de (la )?defensa/, sintonia: true, ca: 2, sinArmadura: true },
  { re: /^(ropajes?|tunica|tunicas|tunica) (del|de los) archimagos?/, sintonia: true, caBase: 15, cd: 2, atk: 2 },
  { re: /^baston de(l)? poder/, sintonia: true, ca: 2, salv: 2, atk: 2 },
  { re: /^baston de(l)? (los )?magos?\b/, sintonia: true, atk: 2 },
  { re: /^guanteletes de (fuerza|poder) de ogro/, sintonia: true, fija: { fue: 19 } },
  { re: /^(diadema|cinta) de(l)? intelecto/, sintonia: true, fija: { int: 19 } },
  { re: /^amuleto de (la )?salud/, sintonia: true, fija: { con: 19 } },
  { re: /^cinturon de (la )?fuerza de(l)? gigante/, sintonia: true, fija: n => { const x = GIGANTE.find(([r]) => r.test(n)); return x ? { fue: x[1] } : null; } },
  { re: /^piedra ioniana de(l)? proteccion|^piedra ioun de proteccion/, sintonia: true, ca: 1 },
  { re: /^piedra ioniana|^piedra ioun/, sintonia: true, suma: n => { const x = IONIANA.find(([r]) => r.test(n.replace(/^piedra (ioniana|ioun) de(l)? /, ''))); return x ? { [x[1]]: 2 } : null; } },
  // Focos de lanzamiento +1/+2/+3: ataque de conjuro y CD
  { re: /^(amuleto del devoto|grimorio arcano|vial de(l)? pozo de sangre|vial de sangre|hoz lunar|hoz de la luna|tambor del? (marca)?ritmos?|vara del guardian del pacto|vara del guardian de pactos)\b/, sintonia: true, foco: true },
  { re: /^varita del mago de (la )?guerra/, sintonia: true, soloAtk: true },
];

export function efectoDe(nombre) {
  const n = norm(nombre || '').replace(/\s+/g, ' ').trim(); if (!n) return null;
  const x = OBJETOS_EFECTO.find(e => e.re.test(n)); if (!x) return null;
  const N = masN(n), out = { sintonia: !!x.sintonia, ca: x.ca || 0, salv: x.salv || 0, pruebas: x.pruebas || 0, cd: x.cd || 0, atk: x.atk || 0, sinArmadura: !!x.sinArmadura, caBase: x.caBase || 0 };
  if (x.foco) { out.cd += N; out.atk += N; }
  if (x.soloAtk) out.atk += N;
  const fija = typeof x.fija === 'function' ? x.fija(n) : x.fija, suma = typeof x.suma === 'function' ? x.suma(n) : x.suma;
  if (fija) out.fija = fija;
  if (suma) out.suma = suma;
  return out;
}
// Un objeto cuenta si está sintonizado (cuando lo pide) y, si es arma o armadura, equipado
export const objetoActivo = o => o && o.cantidad !== 0 && (!o.sintonia || o.sintonizado) && (!(o.arma || o.armadura) || o.equipado);
export function objetosActivos(ch) {
  const out = [];
  for (const o of ch?.equipo?.objetos || []) { if (!objetoActivo(o)) continue; const e = efectoDe(o.nombre); if (e) out.push({ o, e }); }
  return out;
}
// Características con los objetos puestos: Guanteletes de fuerza de ogro, Diadema de intelecto, Piedras ioniana…
export function statsEfectivos(ch) {
  const st = { ...(ch?.stats || {}) }, act = objetosActivos(ch);
  for (const { e } of act) for (const [k, v] of Object.entries(e.suma || {})) st[k] = Math.max(st[k] || 10, Math.min(20, (st[k] || 10) + v));
  for (const { e } of act) for (const [k, v] of Object.entries(e.fija || {})) st[k] = Math.max(st[k] || 10, v);
  return st;
}
// De dónde sale cada característica cambiada, para enseñarlo en la hoja
export function statsPorObjeto(ch) {
  const out = {};
  for (const { o, e } of objetosActivos(ch)) for (const k of Object.keys({ ...(e.fija || {}), ...(e.suma || {}) })) (out[k] ||= []).push(o.nombre);
  return out;
}
const suma = (ch, k) => objetosActivos(ch).reduce((s, { e }) => s + (e[k] || 0), 0);
export const bonoSalvObjetos = ch => suma(ch, 'salv');
export const bonoPruebasObjetos = ch => suma(ch, 'pruebas');
export const bonoMagiaObjetos = ch => ({ cd: suma(ch, 'cd'), atk: suma(ch, 'atk') });
export const fuentesDe = (ch, k) => objetosActivos(ch).filter(({ e }) => e[k]).map(({ o, e }) => `${o.nombre} ${e[k] > 0 ? '+' : ''}${e[k]}`);

// Armas y armaduras mágicas: «Espada larga +1», «Escudo +2», «Armadura de placas +3»…
export const bonoDeNombre = nombre => masN(norm(nombre || ''));
