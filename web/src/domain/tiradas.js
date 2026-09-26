const TIPOS_ES = ['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'];
const EN2ES = { acid: 'ácido', bludgeoning: 'contundente', slashing: 'cortante', cold: 'frío', fire: 'fuego', force: 'fuerza', necrotic: 'necrótico',
  piercing: 'perforante', psychic: 'psíquico', radiant: 'radiante', lightning: 'relámpago', thunder: 'trueno', poison: 'veneno' };
const SAL = { fuerza: 'Fuerza', destreza: 'Destreza', 'constitución': 'Constitución', inteligencia: 'Inteligencia', 'sabiduría': 'Sabiduría', carisma: 'Carisma',
  strength: 'Fuerza', dexterity: 'Destreza', constitution: 'Constitución', intelligence: 'Inteligencia', wisdom: 'Sabiduría', charisma: 'Carisma' };
const dado = (n, c, b = 0) => ({ n: +n, caras: +c, bono: +b || 0 });

const RE_TS = /salvaci|falla|supera|fracas|éxito|saving throw|fail|succe/i;
const RE_AT = /impact|acierta|ataque|\bhit\b|attack/i;
const RE_TURNO = /comienc|empiec|termin\w* su turno|start|begin|expuest/i;
const RE_FALLA = /\b(?:si|cuando|en caso de que)\s+(?:la\s+|lo\s+)?(?:falla|fracasa)|con un fallo|si no la supera|on a failed save|if (?:it|the target|a creature) fails/i;
const RE_SUPERA = /\b(?:si|cuando)\s+(?:la\s+|lo\s+)?supera|si tiene éxito|con éxito|on a successful save|if (?:it|the target|a creature) succeeds/i;
const RE_MITAD = /mitad (?:de ese |del |de |de dicho )?daño|la mitad|half as much damage|half damage|half the damage/i;

function frases(t) {
  const out = []; const re = /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g; let m;
  while ((m = re.exec(t))) { const lead = m[0].length - m[0].trimStart().length; out.push({ s: m[0].trim(), i: m.index + lead, f: m.index + m[0].length }); }
  return out;
}
const fraseEn = (F, pos) => { const k = F.findIndex(f => pos >= f.i && pos < f.f); return k < 0 ? F.length - 1 : k; };
function condicionDe(frase, posEnFrase) {
  const m = /\b(?:si|if)\s+([^,;]{6,120})[,;]/i.exec(frase.slice(0, posEnFrase));
  return m ? m[1].trim() : '';
}

// Restos del OCR de los manuales en los dados y en «daño»: «ld6», «4dl0», «2<l4», «daiio», «dan.o», «148 más tu modificador»
export const arreglarOcr = t => String(t || '').replace(/\b([l1I]|\d+)\s*(?:d|<l|<i)\s*([l1I]?\d+|l0|lO)\b/g, (m, a, b) => `${a.replace(/[lI]/g, '1')}d${b.replace(/[lI]/g, '1').replace(/O/g, '0')}`)
  .replace(/\bld(\d+)/g, '1d$1').replace(/\b(radia|necr[oó]|relám|psí|perfo|contun|cor)\s(nte|tico|pago|quico|rante|dente|tante)\b/g, '$1$2').replace(/\bda(?:iio|ii o|n\.o|ñ\.o|fio|ño\.)(?=\s)/g, 'daño').replace(/\b14(4|6|8|10|12)\b(?=\s+(?:de\s+)?(?:daño|más|\+))/g, '1d$1');
const NUM_PAL = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, two: 2, three: 3, four: 4 };
export function analizarTiradas(desc = '', sup = '') {
  const t = arreglarOcr(desc), s = arreglarOcr(sup), F = frases(t);
  const r = { ataque: null, salvacion: null, danos: [], curacion: null, escala: null, mitad: false, falla: '', supera: '', extras: [] };
  const at = /ataque de conjuro (a distancia|cuerpo a cuerpo)|(ranged|melee) spell attack/i.exec(t);
  if (at) r.ataque = /distancia|ranged/i.test(at[0]) ? 'a distancia' : 'cuerpo a cuerpo';
  const sv = /tirada de salvación de (Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)|(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i.exec(t);
  if (sv) r.salvacion = SAL[(sv[1] || sv[2]).toLowerCase()];
  r.mitad = !!r.salvacion && RE_MITAD.test(t);
  r.falla = F.filter(f => RE_FALLA.test(f.s)).map(f => f.s).join(' ');
  r.supera = F.filter(f => RE_SUPERA.test(f.s)).map(f => f.s).join(' ');
  if (!r.falla && r.salvacion) r.falla = F.filter(f => /superar una tirada de salvaci[^.]*\bo\b|succeed on a[^.]*saving throw or/i.test(f.s)).map(f => f.s).join(' ');

  const usados = [], vistos = new Set();
  const add = (m, n, c, b, tipo) => {
    const k = `${n}d${c}+${b}|${tipo}`; if (vistos.has(k) || r.danos.length >= 4) return; vistos.add(k);
    const fi = fraseEn(F, m.index), fr = F[fi] || { s: '', i: 0 }, prev = F[fi - 1]?.s || '';
    const enTurno = RE_TURNO.test(fr.s);
    const ligTS = !!r.salvacion && (RE_TS.test(fr.s) || (!enTurno && RE_TS.test(prev)));
    const ligAt = !!r.ataque && (RE_AT.test(fr.s) || RE_AT.test(prev));
    const cond = r.danos.length ? condicionDe(fr.s, m.index - fr.i) : '';
    const mod = /^[^.]{0,70}?(?:m[aá]s tu modificador (?:por|de) aptitud|plus your spellcasting ability modifier)/i.test(t.slice(m.index, m.index + 90));
    r.danos.push({ ...dado(n, c, b), tipo, frase: fr.s, via: ligAt ? 'ataque' : ligTS ? 'salvacion' : 'auto', cond, ...(mod ? { mod: true } : {}) });
    usados.push(m.index);
  };
  for (const m of t.matchAll(new RegExp(`(\\d+)d(\\d+)(?:\\s*\\+\\s*(\\d+))?[^.;\\d]{0,25}?(?:de )?daño (?:de |por )?(${TIPOS_ES.join('|')})`, 'gi'))) add(m, m[1], m[2], m[3], m[4].toLowerCase());
  for (const m of t.matchAll(new RegExp(`daño (?:de |por )?(${TIPOS_ES.join('|')})(?: o (?:${TIPOS_ES.join('|')}))?(?: \\([^)]*\\))? igual a (\\d+)d(\\d+)(?:\\s*\\+\\s*(\\d+))?`, 'gi'))) add({ index: m.index + m[0].search(/\d+d\d+/) }, m[2], m[3], m[4], m[1].toLowerCase());
  for (const m of t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?\s+de daño (?:del tipo (?:que elijas|elegido|de tu elecci[oó]n)|de un tipo (?:que elijas|a tu elecci[oó]n))/gi)) add(m, m[1], m[2], m[3], 'a elegir');
  for (const m of t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+))? damage of (?:a|the) (?:type|kind) (?:of your choice|you choose|chosen)/gi)) add(m, m[1], m[2], m[3], 'a elegir');
  for (const m of t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+))? (Acid|Bludgeoning|Slashing|Cold|Fire|Force|Necrotic|Piercing|Psychic|Radiant|Lightning|Thunder|Poison) damage/gi)) add(m, m[1], m[2], m[3], EN2ES[m[4].toLowerCase()]);
  if (r.salvacion && !r.ataque && r.danos.length && !r.danos.some(d => d.via === 'salvacion') && !RE_TURNO.test(r.danos[0].frase))
    r.danos[0].via = 'salvacion';

  const cu = /(?:recupera\w*|regains?)[^.]{0,60}?(\d+)d(\d+)(\s*\+\s*(?:tu modificador|your spellcasting ability modifier))?/i.exec(t)
          || /(\d+)d(\d+)(\s*\+\s*(?:tu modificador|your spellcasting ability modifier))?[^.]{0,40}(?:puntos de golpe|Hit Points)/i.exec(t);
  if (cu && /puntos de golpe|hit points/i.test(cu[0] + t.slice(cu.index, cu.index + 120)) && !/daño|damage|m[aá]ximos se reducen|maximum is reduced/i.test(cu[0])) {
    r.curacion = { ...dado(cu[1], cu[2]), mod: !!cu[3] };
    const d = /(\d+)d(\d+)/.exec(cu[0]); usados.push(cu.index + (d ? cu[0].indexOf(d[0]) : 0));
  }

  for (const m of t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/g)) {
    if (usados.some(u => Math.abs(u - m.index) < 4) || r.extras.length >= 3) continue;
    const fr = F[fraseEn(F, m.index)], resto = fr.s.slice(m.index - fr.i, m.index - fr.i + 45);
    if (/^\S+(?:\s*\+\s*\d+)?[^.;\d]{0,25}?(de daño|damage)|puntos de golpe|hit points/i.test(resto)) continue;
    if (r.danos.some(d => d.n === +m[1] && d.caras === +m[2])) continue;
    if (r.danos.length && (/en su lugar|instead/i.test(fr.s) || /(?:daño|damage)[^.]{0,30}(?:aumenta|pasa|sube|increases)[^.]{0,6}(?:a|to)\s*$/i.test(fr.s.slice(0, m.index - fr.i)))) {
      const base = r.danos[r.danos.length - 1];
      r.danos.push({ ...dado(m[1], m[2], m[3]), tipo: base.tipo, frase: fr.s, via: base.via, cond: condicionDe(fr.s, m.index - fr.i) || 'en su lugar' });
      usados.push(m.index); continue;
    }
    r.extras.push({ ...dado(m[1], m[2], m[3]), frase: fr.s });
  }

  const tr = /aumenta en (\d+)d(\d+) cuando alcanzas los niveles|al llegar a los niveles|increases by (\d+)d(\d+) when you reach levels/i.exec(s);
  const up = /aumentan? en (\d+)d(\d+) por cada nivel(?: de espacio)? por encima de(?:l)? (\d)|increases? by (\d+)d(\d+) for each spell slot level above (\d)/i.exec(s);
  const unDado = /aumenta en un dado cuando alcanzas los niveles|increases by one die when you reach/i.test(s);
  if (unDado && r.danos.length) r.escala = { tipo: 'truco', unDado: true, n: 1, caras: 0 };
  else if (tr) r.escala = { tipo: 'truco', ...dado(tr[1] || tr[3] || 1, tr[2] || tr[4] || r.danos[0]?.caras || 6) };
  else if (up) r.escala = { tipo: 'espacio', ...dado(up[1] || up[4], up[2] || up[5]), desde: +(up[3] || up[6]) };
  // Varios rayos o dardos, cada uno con su tirada: Descarga sobrenatural, Proyectil mágico, Rayo abrasador…
  const PROY = '(rayos?|dardos?|r[aá]fagas?|beams?|darts?|rays?)';
  const base = new RegExp(`\\b(dos|tres|cuatro|cinco|two|three|four)\\s+${PROY}\\b`, 'i').exec(t);
  const extra = new RegExp(`${PROY}\\s+(?:adicional|m[aá]s|additional)[^.]{0,30}?por cada nivel[^.]{0,30}?por encima de(?:l)? (\\d)|one additional ${PROY} for each (?:spell )?slot level above (\\d)|(?:creates?|crea) (?:un|one) ${PROY} (?:adicional|more)[^.]{0,40}?(?:por encima de|above) (\\d)`, 'i').exec(s);
  const porNivel = new RegExp(`(?:crea )?dos ${PROY} a nivel 5, tres ${PROY} a nivel 11 y cuatro ${PROY} a nivel 17|two beams at level 5, three beams at level 11, and four beams at level 17`, 'i').test(s);
  if (porNivel) r.veces = { base: 1, truco: true };
  else if (extra) r.veces = { base: base ? NUM_PAL[base[1].toLowerCase()] : 1, desde: +(extra[2] || extra[4] || extra[6]) };
  else if (base && r.danos.length && /cada (?:uno|dardo|rayo)|each (?:dart|ray)/i.test(t)) r.veces = { base: NUM_PAL[base[1].toLowerCase()] };
  return r;
}
// Cuántas veces se tiran los dados (rayos o dardos): por nivel de personaje en los trucos, por nivel de espacio en el resto
export function vecesPara(r, { nivelPj = 1, nivelEspacio = null, nivelConjuro = 0 } = {}) {
  const v = r?.veces; if (!v) return 1;
  if (v.truco) return v.base + [5, 11, 17].filter(x => nivelPj >= x).length;
  return v.base + (v.desde && nivelEspacio ? Math.max(0, nivelEspacio - Math.max(v.desde, nivelConjuro)) : 0);
}
export const tieneTiradas = r => !!(r && (r.ataque || r.danos.length || r.curacion || r.extras?.length));

export function tiradasDe(fuentes) {
  let mejor = null;
  for (const [d, h] of fuentes) {
    if (!d) continue;
    const r = analizarTiradas(d, h);
    if (tieneTiradas(r)) { if (mejor?.salvacion && !r.salvacion) r.salvacion = mejor.salvacion; return r; }
    if (!mejor) mejor = r;
  }
  return mejor;
}

export function dadosPara(r, { nivelPj = 1, nivelEspacio = null, nivelConjuro = 0 } = {}) {
  const base = r.danos.length ? r.danos : r.curacion ? [{ ...r.curacion, tipo: 'curación', via: 'auto', cond: '', frase: '' }] : [];
  const tiers = [5, 11, 17].filter(x => nivelPj >= x).length;
  return base.map((d, i) => {
    let n = d.n;
    const mismoDado = !r.escala?.caras || r.escala.caras === d.caras || (i === 0 && !base.some(x => x.caras === r.escala.caras));
    if (r.escala?.tipo === 'truco' && (r.escala.unDado || mismoDado)) n += (r.escala.unDado ? 1 : r.escala.n) * tiers;
    if (r.escala?.tipo === 'espacio' && nivelEspacio && mismoDado) n += r.escala.n * Math.max(0, nivelEspacio - Math.max(r.escala.desde, nivelConjuro));
    return { ...d, n, veces: vecesPara(r, { nivelPj, nivelEspacio, nivelConjuro }) };
  });
}

export const media = (n, caras, bono = 0) => n * (caras + 1) / 2 + bono;
