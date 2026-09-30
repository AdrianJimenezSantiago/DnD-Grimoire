import { estiloDe, esAlternativa } from './estilos.js';
import { norm } from '../core/util.js';
import { progresion, escalas, CLASES_INFO, SUBCLASES } from './clases2024.js';
import { clasesDe, vistaClase, nivelTotal, dotesDe, competencia, CLASES } from './reglas2024.js';
import { maniobrasDe, cdManiobras, dadoSupremacia } from './maniobras.js';
import { VARIANTES, varianteDe } from './variantes.js';
import { opcionDeRasgo, opcionDe, CAMBIA_TXT } from './opcionesRasgo.js';

export const FUENTES = [['', 'Todo'], ['clase', 'Clase'], ['especie', 'Especie'], ['dote', 'Dotes']];
const tipoFuente = origen => (origen === 'especie' || origen === 'dote' ? origen : 'clase');

export const GRUPOS = [['accion', 'Acción'], ['adicional', 'Acción adicional'], ['reaccion', 'Reacción'], ['pasivo', 'Siempre activo'], ['fuera', 'Fuera de combate']];

const NO_JUEGO = /^(mejora de caracteristica|don epico|subclase de |rasgo de subclase|lanzamiento de conjuros|conjuros (del|de|de la) |hechiceria innata)/;

const GRUPO_SIN_TEXTO = {
  furia: 'adicional', 'inspiracion bardica': 'adicional', 'forma salvaje': 'adicional', 'enemigo predilecto': 'adicional', 'tomar aliento': 'adicional',
  'desplazamiento tactico': 'adicional', 'fuente de magia': 'adicional', 'artes marciales': 'adicional', 'concentracion de monje': 'adicional',
  'imponer las manos': 'adicional', 'toque reparador': 'adicional', 'castigo de paladin': 'adicional', 'accion astuta': 'adicional', 'punteria certera': 'adicional',
  'canalizar divinidad': 'accion', 'intercesion divina': 'accion', 'intercesion divina mayor': 'accion', 'compañero salvaje': 'accion', 'companero salvaje': 'accion',
  'abjurar de los enemigos': 'accion', 'accion subita': 'accion',
  'desviar ataques': 'reaccion', 'desviar energia': 'reaccion', 'caida lenta': 'reaccion', 'esquiva asombrosa': 'reaccion', 'contraencantamiento': 'reaccion',
  'golpe aturdidor': 'pasivo', 'ataque furtivo': 'pasivo', 'golpe astuto': 'pasivo', 'evasion': 'pasivo', 'indomito': 'pasivo', 'metamagia': 'pasivo',
  'recuperacion arcana': 'fuera', 'recuperacion magica': 'fuera', 'mente tactica': 'fuera', 'talentos fiables': 'fuera', 'contactar patron': 'fuera', 'astucia magica': 'fuera',
};

export function clasificar(texto, nombre = '') {
  const t = norm(texto || ''), conocido = GRUPO_SIN_TEXTO[norm(nombre).replace(/\s*\(.*\)$/, '')];
  if (!t.trim() && conocido) return conocido;
  const pos = [
    ['reaccion', /\b(como|usar|usa|utilizar|gastar|emplear|realizar|llevar a cabo)( tu| una| la)? reaccion\b|\bcon tu reaccion\b/],
    ['adicional', /\bcomo( una| tu)? accion adicional\b|\busar( tu| una)? accion adicional\b|\bcon una accion adicional\b/],
    ['accion', /\bcomo( una| tu)? accion( de magia| de utilizar| de atacar)?\b(?! adicional)|\b(realizar|llevar a cabo|usar) la accion de (atacar|magia|utilizar)\b|\bcuando (realices|lleves a cabo) la accion de atacar\b/],
  ].map(([g, re]) => { const m = re.exec(t); return m ? [g, m.index] : null; }).filter(Boolean).sort((a, b) => a[1] - b[1]);
  if (pos.length) return pos[0][0];
  return /\b(ataque|dano|turno|salvacion|iniciativa|furia|combate|enemig|puntos de golpe|clase de armadura|velocidad|critico|armas?)\b/.test(t) || /furia|golpe|ataque/.test(norm(nombre)) ? 'pasivo' : 'fuera';
}

export function resumen(texto) {
  const plano = String(texto || '').replace(/^#{3,4} .+$/gm, '').replace(/\|[^\n]*\|/g, '').replace(/\s+/g, ' ').trim();
  const util = f => !/^(obtienes los siguientes beneficios|mejora de caracteristica\b|aumenta (tu|una) puntuacion)/.test(norm(f));
  const frases = (plano.replace(/^Obtienes los siguientes beneficios:\s*/i, '').match(/[^.!?]+[.!?]+(\s|$)/g)?.map(f => f.trim()) || (plano ? [plano] : [])).filter(util)
    .filter((f, i, a) => f.split(/\s+/).length > 5 || i === a.length - 1);
  const uso = frases.find(f => /\b(como( una| tu)? (accion|reaccion)|(usar|llevar a cabo|emplear)( tu| una)? reaccion)\b/.test(norm(f)));
  const regla = frases.find(f => /\b(ventaja|desventaja|tirada|dano|bonificador|competencia|pericia|velocidad|clase de armadura|puntos de golpe|resistencia|maestria|\d+d\d+|\d+ m)\b/.test(norm(f)));
  const f = uso || regla || frases[0] || '';
  return f.length > 220 ? f.slice(0, 217).replace(/\s+\S*$/, '') + '…' : f;
}

const NUMEROS = { furia: ['Daño por furia'], 'ataque furtivo': ['Ataque furtivo'], 'artes marciales': ['Artes marciales'], 'golpe brutal': ['Golpe brutal'],
  'maestria con armas': ['Maestría con armas'], 'inspiracion bardica': ['Dado de inspiración'], 'forma salvaje': ['Forma salvaje'], 'golpes benditos': ['Golpes benditos'], 'furia elemental': ['Furia elemental'], 'supremacia en combate': ['Dado de supremacía'],
  'aura de proteccion': ['Aura de protección'], 'ataque adicional': ['Ataques por acción'], 'dos ataques adicionales': ['Ataques por acción'], 'tres ataques adicionales': ['Ataques por acción'],
  'movimiento sin armadura': ['Movimiento sin armadura'], 'concentracion de monje': ['CD de concentración'], 'golpe aturdidor': ['CD de concentración'], 'desviar ataques': ['Desviar ataques'], 'caida lenta': ['Caída lenta'],
  'golpe astuto': ['CD de golpe astuto'], 'furia implacable': ['Furia implacable'], 'tomar aliento': ['Tomar aliento'], indomito: ['Indómito'], 'invocaciones sobrenaturales': ['Invocaciones'], 'arcanum mistico': ['Arcanum místico'], metamagia: ['Opciones de metamagia'] };

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

export function especieDe(ch, lib = {}) {
  const e = norm(ch.especie || ''); if (!e) return null;
  return (lib.especies || []).find(x => norm(x.nombre) === e) || (lib.especies || []).find(x => e.startsWith(norm(x.nombre) + ' ') || e.includes(`(${norm(x.nombre)}`)) || null;
}
const dotePorNombre = (lib, nombre) => (lib.dotes || []).find(x => norm(x.nombre) === norm(nombre)) || null;

export function rasgosEnJuego(ch, lib = {}, recursos = []) {
  const manual = ch.enJuego?.grupo || {}, out = [], clases = clasesDe(ch);
  const nuevo = (clave, base, t, numeros = [], recurso = null) => {
    const auto = clasificar(t?.texto || '', base.nombre);
    out.push({ clave, ...base, fuente: tipoFuente(base.origen), auto, grupo: manual[clave] || auto, resumen: t ? resumen(t.texto) : '', texto: t?.texto || '', libro: t?.fuente || '', numeros, recurso });
  };
  for (const c of clases) {
    const v = vistaClase(ch, c), esc = escalas(v);
    for (const r0 of progresion(v)) {
      const r = { ...r0, nombre: r0.nombre.replace(/\s*\(.*\)$/, '') }, n = norm(r.nombre); if (NO_JUEGO.test(n) && !opcionDeRasgo(v, r.nombre)) continue;
      const clave = c.principal ? `${r.origen}:${n}` : `multiclase:${norm(c.clase)}:${n}`, t = textoDe(r, v, lib), ya = out.find(x => x.clave === clave);
      if (ya) { if (t?.texto && !ya.texto.includes(t.texto)) ya.texto += `\n\n#### Nivel ${r.nivel}\n\n${t.texto}`; continue; }
      const igual = out.find(x => x.fuente === 'clase' && x.clase !== c.clase && norm(x.nombre) === n);
      if (igual) { if (!igual.etiqueta.includes(c.clase)) igual.etiqueta += ` y ${c.clase}`; continue; }
      const numeros = (NUMEROS[n] || []).map(k => esc.find(e => e.nombre === k)).filter(Boolean).map(e => ({ nombre: e.nombre, valor: e.valor }));
      const recurso = recursos.find(x => x.tipo === 'recurso' && (norm(x.nombre) === n || norm(x.nombre).startsWith(n + ' ('))) || null;
      const origen = c.principal ? r.origen : 'multiclase';
      const etiqueta = `Nivel ${r.nivel} · ${r.origen === 'subclase' ? c.subclase : c.clase}`;
      nuevo(clave, { nombre: r.nombre, nivel: r.nivel, origen, clase: c.clase, etiqueta }, t, numeros, recurso);
    }
  }
  // Golpes benditos / Furia elemental: la variante elegida, o que falta elegirla
  for (const r of out) {
    const def = VARIANTES[r.clase];
    if (def && norm(def.rasgo) === norm(r.nombre)) r.eleccion = { clase: r.clase, rasgo: def.rasgo, opciones: def.opciones, actual: varianteDe(ch, r.clase)?.nombre || '' };
    // Opciones de subclase (Aspecto de lo salvaje, terreno del Círculo de la tierra, Presa del cazador…)
    const op = r.origen !== 'especie' && r.origen !== 'dote' ? opcionDeRasgo(ch, r.nombre) : null;
    if (op) r.eleccion = { id: op.id, rasgo: op.rasgo, opciones: op.opciones, actual: opcionDe(ch, op.id)?.nombre || '', cambia: op.cambia, cuando: CAMBIA_TXT[op.cambia] };
    if (op && r.eleccion.actual) r.numeros = [{ nombre: op.rasgo, valor: r.eleccion.actual }, ...r.numeros];
  }
  // Maniobras del Maestro del combate: cada una en su grupo, con el recurso de los dados de supremacía
  const maniobras = maniobrasDe(ch);
  if (maniobras.length) {
    const g = clases.find(c => c.clase === 'Guerrero'), cd = cdManiobras(ch), dado = dadoSupremacia(g.nivel);
    const recurso = recursos.find(x => x.tipo === 'recurso' && norm(x.nombre) === 'dados de supremacia') || null;
    for (const m of maniobras) {
      const clave = `maniobra:${norm(m.nombre)}`, texto = m.texto ? `${m.texto}\n\nDado de supremacía: ${dado}. CD de salvación: ${cd}.` : '';
      out.push({ clave, nombre: m.nombre, nivel: 3, origen: g.principal ? 'subclase' : 'multiclase', clase: 'Guerrero', etiqueta: `Maniobra · ${g.subclase}`, fuente: 'clase',
        auto: m.grupo, grupo: manual[clave] || m.grupo, resumen: m.texto ? resumen(m.texto) : '', texto, libro: m.texto ? 'Manual del Jugador' : '',
        numeros: [{ nombre: 'Dado de supremacía', valor: dado }, { nombre: 'CD', valor: String(cd) }], recurso });
    }
  }
  const esp = especieDe(ch, lib), total = nivelTotal(ch);
  if (esp) for (const r of esp.rasgos) if ((r.nivel || 1) <= total) nuevo(`especie:${norm(r.nombre)}`, { nombre: r.nombre, nivel: r.nivel || 1, origen: 'especie', etiqueta: esp.nombre + (r.nivel > 1 ? ` · nivel ${r.nivel}` : '') }, { texto: r.texto, fuente: esp.fuente });
  for (const d of dotesDe(ch, lib.trasfondos || [])) {
    const n = norm(d.nombre); if (NO_JUEGO.test(n)) continue;
    const x = dotePorNombre(lib, d.nombre), nombre = d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre;
    const etiqueta = d.origen === 'trasfondo' ? `Dote de origen · ${ch.trasfondo}` : `Dote elegida${x?.cat ? ` · ${x.cat.toLowerCase()}` : ''}`;
    const recurso = recursos.find(r => r.tipo === 'recurso' && (r.dote === n || norm(r.nota || '').includes(`dote ${n}`))) || null;
    const est = x ? null : estiloDe(d.nombre) || esAlternativa(d.nombre);
    nuevo(`dote:${norm(nombre)}`, { nombre, nivel: 0, origen: 'dote', etiqueta: est ? 'Estilo de combate' : etiqueta }, x ? { texto: x.texto, fuente: x.fuente } : est ? { texto: est.texto, fuente: 'Manual del Jugador' } : null, [], recurso);
  }
  return out;
}

export function agrupar(lista, fijados = [], fuente = '') {
  if (fuente) lista = lista.filter(r => r.fuente === fuente);
  const fij = new Set(fijados);
  const grupos = GRUPOS.map(([k, t]) => ({ clave: k, titulo: t, rasgos: lista.filter(r => r.grupo === k && !fij.has(r.clave)) })).filter(g => g.rasgos.length);
  const arriba = lista.filter(r => fij.has(r.clave));
  return arriba.length ? [{ clave: 'fijados', titulo: 'Fijados', rasgos: arriba }, ...grupos] : grupos;
}

export function numerosMarciales(ch) {
  const e = escalas(ch).filter(x => !/^(Puntos de golpe|Dado de golpe|Competencia|Salvaciones)/.test(x.nombre));
  const base = escalas(ch);
  const dados = clasesDe(ch).map(c => escalas(vistaClase(ch, c)).find(x => x.nombre === 'Dado de golpe')?.valor).filter(Boolean).join(' + ');
  const extra = [{ nombre: 'Competencia', valor: '+' + competencia(nivelTotal(ch)) }, dados && { nombre: 'Dado de golpe', valor: dados }, base.find(x => /^Puntos de golpe/.test(x.nombre))].filter(Boolean);
  return [...e, ...extra].slice(0, 4).map(x => ({ nombre: x.nombre.replace(' (media)', ''), valor: x.valor }));
}

const CAST_TXT = { full: 'Lanzador completo', half: 'Medio lanzador', third: 'Lanzador a un tercio', pact: 'Magia de pacto' };
const AB_N = { fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' };

export function resumenClase(clase, lib = {}) {
  const info = CLASES_INFO[clase]; if (!info) return null;
  const cast = CLASES[clase]?.cast, subCast = CLASES[clase]?.subCast;
  const datos = [['Dado de golpe', `d${info.dg}`], ['Salvaciones', info.salv.map(k => AB_N[k]).join(' y ')], ['Característica principal', AB_N[info.prio[0]]],
    ['Conjuros', cast ? `${CAST_TXT[cast.tipo]} (${AB_N[cast.ap]})` : subCast ? `Solo ${subCast.nombre} (${AB_N[subCast.ap]}, desde nivel ${subCast.desde})` : 'No lanza por su clase']];
  const niveles = [];
  for (let L = 1; L <= 20; L++) {
    const rasgos = (info.rasgos[L] || []).map(nombre => {
      if (nombre === 'Rasgo de subclase') return { nombre: 'Rasgo de subclase', resumen: 'Lo que dé la subclase que elijas a este nivel.', texto: '', sub: true };
      const base = nombre.replace(/\s*\(.*\)$/, ''), t = textoDe({ nombre: base, nivel: L, origen: 'clase' }, { clase }, lib);
      return { nombre, resumen: t ? resumen(t.texto) : '', texto: t?.texto || '', sub: /^Subclase de /.test(nombre) };
    });
    if (rasgos.length) niveles.push({ nivel: L, rasgos });
  }
  return { clase, datos, niveles, conTextos: niveles.some(n => n.rasgos.some(r => r.texto)) };
}
export function resumenSubclase(clase, subclase, lib = {}) {
  const def = (SUBCLASES[clase] || []).find(x => norm(x.nombre) === norm(subclase));
  const imp = (lib.subclases || []).find(x => x.clase === clase && norm(x.nombre) === norm(subclase));
  if (!def && !imp) return null;
  const porNivel = def ? Object.entries(def.rasgos).map(([L, rs]) => [+L, rs]) : [...(imp.rasgos || []).reduce((m, r) => m.set(r.nivel, [...(m.get(r.nivel) || []), r.nombre]), new Map())];
  const niveles = porNivel.sort((a, b) => a[0] - b[0]).map(([L, rs]) => ({ nivel: L, rasgos: rs.map(nombre => {
    const t = textoDe({ nombre, nivel: L, origen: 'subclase' }, { clase, subclase }, lib);
    return { nombre, resumen: t ? resumen(t.texto) : '', texto: t?.texto || '' }; }) }));
  const conjuros = def?.conjuros ? Object.entries(def.conjuros).map(([L, cs]) => ({ nivel: +L, conjuros: cs })) : [];
  return { clase, subclase: def?.nombre || imp.nombre, libro: def?.libro || imp?.fuente || '', lema: imp?.lema || '', niveles, conjuros, conTextos: niveles.some(n => n.rasgos.some(r => r.texto)) };
}
