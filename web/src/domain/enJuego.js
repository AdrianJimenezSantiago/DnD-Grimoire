/**
 * «En juego»: los rasgos de clase y subclase del personaje agrupados por cuándo se usan en la mesa
 * (acción, acción adicional, reacción, siempre activo, fuera de combate), con una línea de resumen,
 * los números que escalan con el nivel y el recurso que gastan. Puro: los textos llegan de los libros importados.
 */
import { norm } from '../core/util.js';
import { progresion, escalas } from './clases2024.js';

export const GRUPOS = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['pasivo', 'Siempre activo'], ['fuera', 'Fuera de combate']];
export const NOMBRE_GRUPO = Object.fromEntries(GRUPOS);

// Rasgos de construcción del personaje: no se usan en la partida (se eligen al subir de nivel o ya los cubre la sección de conjuros)
const NO_JUEGO = /^(mejora de caracteristica|don epico|subclase de |rasgo de subclase|lanzamiento de conjuros|conjuros (del|de|de la) |hechiceria innata)/;

/** Cuándo se usa un rasgo, por su texto: la primera mención de un tipo de acción manda. */
export function clasificar(texto, nombre = '') {
  const t = norm(texto || '');
  const pos = [
    ['reaccion', /\b(como|usar|usa|utilizar|gastar|emplear|realizar|llevar a cabo)( tu| una| la)? reaccion\b|\bcon tu reaccion\b/],
    ['adicional', /\bcomo( una| tu)? accion adicional\b|\busar( tu| una)? accion adicional\b|\bcon una accion adicional\b/],
    ['accion', /\bcomo( una| tu)? accion( de magia| de utilizar| de atacar)?\b(?! adicional)|\b(realizar|llevar a cabo|usar) la accion de (atacar|magia|utilizar)\b|\bcuando (realices|lleves a cabo) la accion de atacar\b/],
  ].map(([g, re]) => { const m = re.exec(t); return m ? [g, m.index] : null; }).filter(Boolean).sort((a, b) => a[1] - b[1]);
  if (pos.length) return pos[0][0];
  // sin tipo de acción: siempre activo si toca el combate; si no, es de exploración o de interacción
  return /\b(ataque|dano|turno|salvacion|iniciativa|furia|combate|enemig|puntos de golpe|clase de armadura|velocidad|critico|armas?)\b/.test(t) || /furia|golpe|ataque/.test(norm(nombre)) ? 'pasivo' : 'fuera';
}

/** Frase de resumen: la que dice cómo se usa (si la hay) o la primera que no sea de ambientación. */
export function resumen(texto) {
  const plano = String(texto || '').replace(/^#{3,4} .+$/gm, '').replace(/\|[^\n]*\|/g, '').replace(/\s+/g, ' ').trim();
  const frases = plano.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(f => f.trim()) || (plano ? [plano] : []);
  // la que dice cómo se usa («…como acción adicional…», «…llevar a cabo una reacción…»); si no, la primera
  const uso = frases.find(f => /\b(como( una| tu)? (accion|reaccion)|(usar|llevar a cabo|emplear)( tu| una)? reaccion)\b/.test(norm(f)));
  // después, la primera con reglas (ventaja, tiradas, daño, números…) antes que una de ambientación
  const regla = frases.find(f => /\b(ventaja|desventaja|tirada|dano|bonificador|competencia|pericia|velocidad|clase de armadura|puntos de golpe|resistencia|maestria|\d+d\d+|\d+ m)\b/.test(norm(f)));
  const f = uso || regla || frases[0] || '';
  return f.length > 220 ? f.slice(0, 217).replace(/\s+\S*$/, '') + '…' : f;
}

// Valores de «Tu clase a nivel N» que acompañan a cada rasgo
const NUMEROS = { furia: ['Daño por furia'], 'ataque furtivo': ['Ataque furtivo'], 'artes marciales': ['Artes marciales'], 'golpe brutal': ['Golpe brutal'],
  'maestria con armas': ['Maestría con armas'], 'inspiracion bardica': ['Dado de inspiración'], 'forma salvaje': ['Forma salvaje'], 'golpes benditos': ['Golpes benditos'],
  'aura de proteccion': ['Aura de protección'], 'ataque adicional': ['Ataques por acción'], 'dos ataques adicionales': ['Ataques por acción'], 'tres ataques adicionales': ['Ataques por acción'],
  'movimiento sin armadura': ['Movimiento sin armadura'], 'invocaciones sobrenaturales': ['Invocaciones'], 'arcanum mistico': ['Arcanum místico'], metamagia: ['Opciones de metamagia'] };

/** Texto de un rasgo en los libros importados: los de clase por nombre (y nivel si se repite) y los de subclase dentro de su texto. */
function textoDe(r, ch, lib) {
  const n = norm(r.nombre);
  if (r.origen === 'subclase') {
    const sc = (lib.subclases || []).find(x => x.clase === ch.clase && norm(x.nombre) === norm(ch.subclase || ''));
    if (!sc) return null;
    const partes = sc.texto.split(/^### /m), p = partes.find(x => { const m = /^Nivel (\d+): (.+)$/m.exec(x); return m && norm(m[2]) === n; });
    return p ? { texto: p.replace(/^Nivel \d+: .+\n*/, '').trim(), fuente: sc.fuente } : null;
  }
  const c = (lib.rasgosClase || []).find(x => x.clase === ch.clase); if (!c) return null;
  const x = c.rasgos.find(y => norm(y.nombre) === n && y.nivel === r.nivel) || c.rasgos.find(y => norm(y.nombre) === n);
  return x ? { texto: x.texto, fuente: c.fuente } : null;
}

/**
 * Rasgos en juego del personaje: [{clave, nombre, nivel, origen, grupo, auto, resumen, texto, fuente, numeros: [{nombre, valor}], recurso}].
 * ch.enJuego.grupo[clave] cambia el grupo a mano; los rasgos repetidos («Golpe brutal mejorado» en 13 y 17) se juntan.
 */
export function rasgosEnJuego(ch, lib = {}, recursos = []) {
  const esc = escalas(ch), manual = ch.enJuego?.grupo || {}, out = [];
  for (const r0 of progresion(ch)) {
    // «Acción súbita (un uso)», «Indómito (dos usos)»: el libro lo llama sin el paréntesis
    const r = { ...r0, nombre: r0.nombre.replace(/\s*\(.*\)$/, '') }, n = norm(r.nombre); if (NO_JUEGO.test(n)) continue;
    const clave = `${r.origen}:${n}`, t = textoDe(r, ch, lib), ya = out.find(x => x.clave === clave);
    if (ya) { if (t?.texto && !ya.texto.includes(t.texto)) ya.texto += `\n\n#### Nivel ${r.nivel}\n\n${t.texto}`; continue; }
    const auto = t ? clasificar(t.texto, r.nombre) : clasificar('', r.nombre);
    const numeros = (NUMEROS[n] || []).map(k => esc.find(e => e.nombre === k)).filter(Boolean).map(e => ({ nombre: e.nombre, valor: e.valor }));
    const recurso = recursos.find(x => x.tipo === 'recurso' && (norm(x.nombre) === n || norm(x.nombre).startsWith(n + ' ('))) || null;
    out.push({ clave, nombre: r.nombre, nivel: r.nivel, origen: r.origen, auto, grupo: manual[clave] || auto, resumen: t ? resumen(t.texto) : '', texto: t?.texto || '', fuente: t?.fuente || '', numeros, recurso });
  }
  return out;
}

/** Agrupa para pintar: primero los fijados, después cada grupo en su orden. */
export function agrupar(lista, fijados = []) {
  const fij = new Set(fijados);
  const grupos = GRUPOS.map(([k, t]) => ({ clave: k, titulo: t, rasgos: lista.filter(r => r.grupo === k && !fij.has(r.clave)) })).filter(g => g.rasgos.length);
  const arriba = lista.filter(r => fij.has(r.clave));
  return arriba.length ? [{ clave: 'fijados', titulo: 'Fijados', rasgos: arriba }, ...grupos] : grupos;
}

/** Números clave de un personaje que no lanza conjuros, para la cabecera de la hoja (máximo 4). */
export function numerosMarciales(ch) {
  const e = escalas(ch).filter(x => !/^(Puntos de golpe|Dado de golpe|Competencia|Salvaciones)/.test(x.nombre));
  const base = escalas(ch);
  const extra = [base.find(x => x.nombre === 'Competencia'), base.find(x => x.nombre === 'Dado de golpe'), base.find(x => /^Puntos de golpe/.test(x.nombre))].filter(Boolean);
  return [...e, ...extra].slice(0, 4).map(x => ({ nombre: x.nombre.replace(' (media)', ''), valor: x.valor }));
}
