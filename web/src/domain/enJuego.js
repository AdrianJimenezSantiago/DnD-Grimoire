/**
 * «En juego»: los rasgos del personaje (clases, subclases, especie y dotes) agrupados por cuándo se usan en la mesa
 * (acción, acción adicional, reacción, siempre activo, fuera de combate), con una línea de resumen,
 * los números que escalan con el nivel y el recurso que gastan. Puro: los textos llegan de los libros importados.
 */
import { norm } from '../core/util.js';
import { progresion, escalas } from './clases2024.js';
import { clasesDe, vistaClase, nivelTotal, dotesDe, competencia } from './reglas2024.js';

/** De dónde sale un rasgo, para filtrar en la hoja: clase (con subclase y multiclase), especie o dote. */
export const FUENTES = [['', 'Todo'], ['clase', 'Clase'], ['especie', 'Especie'], ['dote', 'Dotes']];
const tipoFuente = origen => (origen === 'especie' || origen === 'dote' ? origen : 'clase');

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
  // coletillas de las dotes que no dicen qué hace: «Obtienes los siguientes beneficios:», «Mejora de característica. Aumenta…»
  const util = f => !/^(obtienes los siguientes beneficios|mejora de caracteristica\b|aumenta (tu|una) puntuacion)/.test(norm(f));
  const frases = (plano.replace(/^Obtienes los siguientes beneficios:\s*/i, '').match(/[^.!?]+[.!?]+(\s|$)/g)?.map(f => f.trim()) || (plano ? [plano] : [])).filter(util)
    // títulos de beneficio («Competencia en iniciativa.», «Dos trucos.»): la frase que sigue dice qué hacen
    .filter((f, i, a) => f.split(/\s+/).length > 5 || i === a.length - 1);
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

/** Especie del personaje en los libros importados («Elfo» también encaja con «Elfo (alto elfo)»). */
export function especieDe(ch, lib = {}) {
  const e = norm(ch.especie || ''); if (!e) return null;
  return (lib.especies || []).find(x => norm(x.nombre) === e) || (lib.especies || []).find(x => e.startsWith(norm(x.nombre) + ' ') || e.includes(`(${norm(x.nombre)}`)) || null;
}
const dotePorNombre = (lib, nombre) => (lib.dotes || []).find(x => norm(x.nombre) === norm(nombre)) || null;

/**
 * Rasgos en juego del personaje: [{clave, nombre, nivel, origen, fuente: 'clase'|'especie'|'dote', etiqueta, grupo, auto,
 *   resumen, texto, libro, numeros: [{nombre, valor}], recurso}].
 * origen: 'clase' | 'subclase' | 'multiclase' | 'especie' | 'dote'. ch.enJuego.grupo[clave] cambia el grupo a mano;
 * los rasgos repetidos («Golpe brutal mejorado» en 13 y 17) se juntan en uno.
 */
export function rasgosEnJuego(ch, lib = {}, recursos = []) {
  const manual = ch.enJuego?.grupo || {}, out = [], clases = clasesDe(ch);
  const nuevo = (clave, base, t, numeros = [], recurso = null) => {
    const auto = clasificar(t?.texto || '', base.nombre);
    out.push({ clave, ...base, fuente: tipoFuente(base.origen), auto, grupo: manual[clave] || auto, resumen: t ? resumen(t.texto) : '', texto: t?.texto || '', libro: t?.fuente || '', numeros, recurso });
  };
  // 1. Clases: la principal (claves «clase:…», «subclase:…») y las de multiclase («multiclase:clase:…»)
  for (const c of clases) {
    const v = vistaClase(ch, c), esc = escalas(v);
    for (const r0 of progresion(v)) {
      // «Acción súbita (un uso)», «Indómito (dos usos)»: el libro lo llama sin el paréntesis
      const r = { ...r0, nombre: r0.nombre.replace(/\s*\(.*\)$/, '') }, n = norm(r.nombre); if (NO_JUEGO.test(n)) continue;
      const clave = c.principal ? `${r.origen}:${n}` : `multiclase:${norm(c.clase)}:${n}`, t = textoDe(r, v, lib), ya = out.find(x => x.clave === clave);
      if (ya) { if (t?.texto && !ya.texto.includes(t.texto)) ya.texto += `\n\n#### Nivel ${r.nivel}\n\n${t.texto}`; continue; }
      // el mismo rasgo por dos clases (Maestría con armas, Ataque adicional…): una sola tarjeta que nombra las dos
      const igual = out.find(x => x.fuente === 'clase' && x.clase !== c.clase && norm(x.nombre) === n);
      if (igual) { if (!igual.etiqueta.includes(c.clase)) igual.etiqueta += ` y ${c.clase}`; continue; }
      const numeros = (NUMEROS[n] || []).map(k => esc.find(e => e.nombre === k)).filter(Boolean).map(e => ({ nombre: e.nombre, valor: e.valor }));
      const recurso = recursos.find(x => x.tipo === 'recurso' && (norm(x.nombre) === n || norm(x.nombre).startsWith(n + ' ('))) || null;
      const origen = c.principal ? r.origen : 'multiclase';
      const etiqueta = `Nivel ${r.nivel} · ${r.origen === 'subclase' ? c.subclase : c.clase}`;
      nuevo(clave, { nombre: r.nombre, nivel: r.nivel, origen, clase: c.clase, etiqueta }, t, numeros, recurso);
    }
  }
  // 2. Especie: sus atributos (algunos llegan con el nivel de personaje, como Revelación celestial a nivel 3)
  const esp = especieDe(ch, lib), total = nivelTotal(ch);
  if (esp) for (const r of esp.rasgos) if ((r.nivel || 1) <= total) nuevo(`especie:${norm(r.nombre)}`, { nombre: r.nombre, nivel: r.nivel || 1, origen: 'especie', etiqueta: esp.nombre + (r.nivel > 1 ? ` · nivel ${r.nivel}` : '') }, { texto: r.texto, fuente: esp.fuente });
  // 3. Dotes: la de origen del trasfondo y las elegidas (la mejora de característica no cambia la partida)
  for (const d of dotesDe(ch, lib.trasfondos || [])) {
    const n = norm(d.nombre); if (NO_JUEGO.test(n)) continue;
    const x = dotePorNombre(lib, d.nombre), nombre = d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre;
    // «Dote de origen · Soldado» (la del trasfondo) o «Dote elegida · general» (las demás, con su categoría si hay libro)
    const etiqueta = d.origen === 'trasfondo' ? `Dote de origen · ${ch.trasfondo}` : `Dote elegida${x?.cat ? ` · ${x.cat.toLowerCase()}` : ''}`;
    // recurso de una dote: el que la nombra en su nota («Dote Afortunado: …»)
    const recurso = recursos.find(r => r.tipo === 'recurso' && norm(r.nota || '').includes(`dote ${n}`)) || null;
    nuevo(`dote:${norm(nombre)}`, { nombre, nivel: 0, origen: 'dote', etiqueta }, x ? { texto: x.texto, fuente: x.fuente } : null, [], recurso);
  }
  return out;
}

/** Agrupa para pintar: primero los fijados, después cada grupo en su orden. */
export function agrupar(lista, fijados = [], fuente = '') {
  if (fuente) lista = lista.filter(r => r.fuente === fuente);
  const fij = new Set(fijados);
  const grupos = GRUPOS.map(([k, t]) => ({ clave: k, titulo: t, rasgos: lista.filter(r => r.grupo === k && !fij.has(r.clave)) })).filter(g => g.rasgos.length);
  const arriba = lista.filter(r => fij.has(r.clave));
  return arriba.length ? [{ clave: 'fijados', titulo: 'Fijados', rasgos: arriba }, ...grupos] : grupos;
}

/** Números clave de un personaje que no lanza conjuros, para la cabecera de la hoja (máximo 4). */
export function numerosMarciales(ch) {
  const e = escalas(ch).filter(x => !/^(Puntos de golpe|Dado de golpe|Competencia|Salvaciones)/.test(x.nombre));
  const base = escalas(ch);
  // competencia por el nivel total y dados de golpe de todas las clases («5d12 + 3d10»)
  const dados = clasesDe(ch).map(c => escalas(vistaClase(ch, c)).find(x => x.nombre === 'Dado de golpe')?.valor).filter(Boolean).join(' + ');
  const extra = [{ nombre: 'Competencia', valor: '+' + competencia(nivelTotal(ch)) }, dados && { nombre: 'Dado de golpe', valor: dados }, base.find(x => /^Puntos de golpe/.test(x.nombre))].filter(Boolean);
  return [...e, ...extra].slice(0, 4).map(x => ({ nombre: x.nombre.replace(' (media)', ''), valor: x.valor }));
}
