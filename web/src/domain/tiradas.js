/**
 * Extrae las tiradas de un conjuro a partir de su texto (español del manual o inglés del SRD):
 * ataque de conjuro, salvación, dados de daño con su tipo, curación y cómo escalan.
 * Heurístico pero conservador: si no reconoce algo, no lo inventa.
 */
const TIPOS_ES = ['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'];
const EN2ES = { acid: 'ácido', bludgeoning: 'contundente', slashing: 'cortante', cold: 'frío', fire: 'fuego', force: 'fuerza', necrotic: 'necrótico',
  piercing: 'perforante', psychic: 'psíquico', radiant: 'radiante', lightning: 'relámpago', thunder: 'trueno', poison: 'veneno' };
const SAL = { fuerza: 'Fuerza', destreza: 'Destreza', 'constitución': 'Constitución', inteligencia: 'Inteligencia', 'sabiduría': 'Sabiduría', carisma: 'Carisma',
  strength: 'Fuerza', dexterity: 'Destreza', constitution: 'Constitución', intelligence: 'Inteligencia', wisdom: 'Sabiduría', charisma: 'Carisma' };
const dado = (n, c, b = 0) => ({ n: +n, caras: +c, bono: +b || 0 });

export function analizarTiradas(desc = '', sup = '') {
  const t = String(desc), s = String(sup);
  const r = { ataque: null, salvacion: null, danos: [], curacion: null, escala: null };
  const at = /ataque de conjuro (a distancia|cuerpo a cuerpo)|(ranged|melee) spell attack/i.exec(t);
  if (at) r.ataque = /distancia|ranged/i.test(at[0]) ? 'a distancia' : 'cuerpo a cuerpo';
  const sv = /tirada de salvación de (Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)|(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i.exec(t);
  if (sv) r.salvacion = SAL[(sv[1] || sv[2]).toLowerCase()];
  const vistos = new Set();
  const add = (n, c, b, tipo) => { const k = `${n}d${c}+${b}|${tipo}`; if (vistos.has(k) || r.danos.length >= 3) return; vistos.add(k); r.danos.push({ ...dado(n, c, b), tipo }); };
  for (const m of t.matchAll(new RegExp(`(\\d+)d(\\d+)(?:\\s*\\+\\s*(\\d+))?[^.;\\d]{0,25}?de daño (?:de |por )?(${TIPOS_ES.join('|')})`, 'gi'))) add(m[1], m[2], m[3], m[4].toLowerCase());
  for (const m of t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+))? (Acid|Bludgeoning|Slashing|Cold|Fire|Force|Necrotic|Piercing|Psychic|Radiant|Lightning|Thunder|Poison) damage/gi)) add(m[1], m[2], m[3], EN2ES[m[4].toLowerCase()]);
  const cu = /(?:recupera\w*|regains?)[^.]{0,60}?(\d+)d(\d+)(\s*\+\s*(?:tu modificador|your spellcasting ability modifier))?/i.exec(t)
          || /(\d+)d(\d+)(\s*\+\s*(?:tu modificador|your spellcasting ability modifier))?[^.]{0,40}(?:puntos de golpe|Hit Points)/i.exec(t);
  if (cu && /puntos de golpe|hit points/i.test(cu[0] + t.slice(cu.index, cu.index + 120))) r.curacion = { ...dado(cu[1], cu[2]), mod: !!cu[3] };
  const tr = /aumenta en (\d+)d(\d+) cuando alcanzas los niveles|al llegar a los niveles|increases by (\d+)d(\d+) when you reach levels/i.exec(s);
  const up = /aumenta en (\d+)d(\d+) por cada nivel(?: de espacio)? por encima de(?:l)? (\d)|increases by (\d+)d(\d+) for each spell slot level above (\d)/i.exec(s);
  const unDado = /aumenta en un dado cuando alcanzas los niveles|increases by one die when you reach/i.test(s);
  if (tr) r.escala = { tipo: 'truco', ...dado(tr[1] || tr[3] || 1, tr[2] || tr[4] || r.danos[0]?.caras || 6) };
  else if (unDado && r.danos.length) r.escala = { tipo: 'truco', ...dado(1, r.danos[0].caras) };
  else if (up) r.escala = { tipo: 'espacio', ...dado(up[1] || up[4], up[2] || up[5]), desde: +(up[3] || up[6]) };
  return r;
}
export const tieneTiradas = r => !!(r && (r.ataque || r.danos.length || r.curacion));
/** Prueba varias fuentes de texto en orden y se queda con la primera que da tiradas (la de salvación se conserva aunque no haya dados). */
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

/** Dados de la primera entrada de daño (o curación) ya escalados al nivel del personaje o del espacio. */
export function dadosPara(r, { nivelPj = 1, nivelEspacio = null, nivelConjuro = 0 } = {}) {
  const base = r.danos.length ? r.danos : r.curacion ? [{ ...r.curacion, tipo: 'curación' }] : [];
  return base.map((d, i) => {
    let n = d.n;
    if (i === 0 && r.escala?.tipo === 'truco') n += r.escala.n * [5, 11, 17].filter(x => nivelPj >= x).length;
    if (i === 0 && r.escala?.tipo === 'espacio' && nivelEspacio) n += r.escala.n * Math.max(0, nivelEspacio - Math.max(r.escala.desde, nivelConjuro));
    return { ...d, n };
  });
}
