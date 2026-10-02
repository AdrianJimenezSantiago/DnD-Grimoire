// Bestiario de la campaña: criaturas con lo que el grupo sabe de ellas (daños, estados, salvaciones, notas).
import { uid, norm } from '../../core/util.js';

export const TIPOS_CRIATURA = ['Aberración', 'Autómata', 'Bestia', 'Celestial', 'Cieno', 'Dragón', 'Elemental', 'Feérico', 'Gigante', 'Humanoide', 'Infernal', 'Monstruosidad', 'Muerto viviente', 'Planta'];
export const DANOS = ['ácido', 'contundente', 'cortante', 'frío', 'fuego', 'fuerza', 'necrótico', 'perforante', 'psíquico', 'radiante', 'relámpago', 'trueno', 'veneno'];
export const ESTADOS = ['agarrado', 'apresado', 'asustado', 'aturdido', 'cegado', 'derribado', 'ensordecido', 'envenenado', 'hechizado', 'incapacitado', 'inconsciente', 'invisible', 'paralizado', 'petrificado', 'cansancio'];
export const SALVACIONES = [['fue', 'Fuerza'], ['des', 'Destreza'], ['con', 'Constitución'], ['int', 'Inteligencia'], ['sab', 'Sabiduría'], ['car', 'Carisma']];
export const AMENAZAS = ['Menor', 'Seria', 'Peligrosa', 'Letal'];
export const ESTADO_CRIATURA = { viva: 'Sigue ahí fuera', derrotada: 'Derrotada', huida: 'Huyó', aliada: 'Aliada' };
export const REL_DANO = { vul: 'Vulnerable', res: 'Resistente', inm: 'Inmune' };
export const CICLO_DANO = { '': 'vul', vul: 'res', res: 'inm', inm: '' };
export const REL_CONJ = { eficaz: 'Funcionó', ineficaz: 'No funcionó' };

export const bestiarioDe = ch => (ch.bestiario ||= { criaturas: [] });
export function nuevaCriatura(ch, nombre = '', sesion = null) {
  const c = { id: uid('bx'), nombre: String(nombre).trim(), tipo: '', amenaza: '', estado: 'viva', ca: '', pg: '', danos: {}, estados: [], salv: {},
    conjuros: {}, tacticas: '', notas: '', sesiones: sesion ? [sesion] : [], creada: Date.now() };
  bestiarioDe(ch).criaturas.unshift(c); return c;
}
export const criatura = (ch, id) => bestiarioDe(ch).criaturas.find(c => c.id === id) || null;
export function buscarCriaturas(ch, q = '', tipo = '') {
  const t = norm(q.trim());
  return bestiarioDe(ch).criaturas.filter(c => (!tipo || c.tipo === tipo) && (!t || norm(`${c.nombre} ${c.tipo} ${c.tacticas} ${c.notas}`).includes(t)));
}
export function resumenCriatura(c) {
  const por = k => DANOS.filter(d => c.danos[d] === k);
  return [por('vul').length && `vulnerable a ${por('vul').join(', ')}`, por('res').length && `resiste ${por('res').join(', ')}`, por('inm').length && `inmune a ${por('inm').join(', ')}`]
    .filter(Boolean).join(' · ');
}
export function notasConjuro(ch, { sid, tipos = [] } = {}) {
  const ts = tipos.map(t => norm(t)), out = [];
  for (const c of bestiarioDe(ch).criaturas) {
    const manual = sid && c.conjuros[sid];
    if (manual) { out.push({ c, rel: manual, motivo: REL_CONJ[manual] }); continue; }
    for (const d of DANOS) { const r = c.danos[d]; if (r && ts.includes(norm(d))) { out.push({ c, rel: r, motivo: `${REL_DANO[r].toLowerCase()} al ${d}` }); break; } }
  }
  const peso = x => (x.c.estado === 'viva' ? 0 : 1);
  return out.sort((a, b) => peso(a) - peso(b));
}
