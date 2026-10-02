import { norm } from '../../core/util.js';
import { clasesDe, dotesDe } from './reglas2024.js';
import { ordenDe } from '../clases/ordenes.js';

// Entrenamiento con armaduras y competencia con armas (Manual del Jugador de 2024, clases, multiclase, subclases, órdenes y dotes)
const ARMADURAS = { 'Bárbaro': ['ligera', 'media', 'escudo'], 'Bardo': ['ligera'], 'Brujo': ['ligera'], 'Clérigo': ['ligera', 'media', 'escudo'], 'Druida': ['ligera', 'escudo'],
  'Explorador': ['ligera', 'media', 'escudo'], 'Guerrero': ['ligera', 'media', 'pesada', 'escudo'], 'Paladín': ['ligera', 'media', 'pesada', 'escudo'], 'Pícaro': ['ligera'] };
// Lo que da una clase cuando no es la primera (tabla de multiclase)
const ARMADURAS_MULTI = { 'Bárbaro': ['escudo'], 'Bardo': ['ligera'], 'Brujo': ['ligera'], 'Clérigo': ['ligera', 'media', 'escudo'], 'Druida': ['ligera', 'escudo'],
  'Explorador': ['ligera', 'media', 'escudo'], 'Guerrero': ['ligera', 'media', 'escudo'], 'Paladín': ['ligera', 'media', 'escudo'], 'Pícaro': ['ligera'] };
const MARCIALES = ['Bárbaro', 'Guerrero', 'Paladín', 'Explorador'];
const DOTES_ARMADURA = { 'ligeramente acorazado': ['ligera', 'escudo'], 'moderadamente acorazado': ['media'], 'muy acorazado': ['pesada'] };

const tieneDote = (ch, n) => dotesDe(ch).some(d => norm(d.nombre) === n);
const subDe = (c, re, desde = 3) => re.test(c.subclase || '') && c.nivel >= desde;

export function armadurasDe(ch) {
  const out = new Set();
  clasesDe(ch).forEach((c, i) => {
    (i === 0 ? ARMADURAS : ARMADURAS_MULTI)[c.clase]?.forEach(a => out.add(a));
    const o = ordenDe(ch, c.clase); if (o?.armadura) out.add(o.armadura);
    if (c.clase === 'Bardo' && subDe(c, /valor/i)) { out.add('media'); out.add('escudo'); }
  });
  for (const d of dotesDe(ch)) (DOTES_ARMADURA[norm(d.nombre)] || []).forEach(a => out.add(a));
  return out;
}

// Qué armas marciales maneja: todas, o solo las que cumplen una condición de sus propiedades
export function marcialesDe(ch) {
  const reglas = [];
  clasesDe(ch).forEach((c, i) => {
    if (MARCIALES.includes(c.clase) || ordenDe(ch, c.clase)?.marciales || (c.clase === 'Bardo' && subDe(c, /valor/i))) reglas.push(() => true);
    if (i === 0 && c.clase === 'Pícaro') reglas.push(p => p.includes('sutil') || p.includes('ligera'));
    if (i === 0 && c.clase === 'Monje') reglas.push(p => p.includes('ligera'));
    if (c.clase === 'Mago' && subDe(c, /hojacantante|cantante/i)) reglas.push((p, cc) => cc && !p.includes('dos manos') && !p.includes('pesada'));
  });
  if (tieneDote(ch, 'entrenamiento con armas marciales')) reglas.push(() => true);
  return reglas;
}
export const SENCILLAS = ['Bastón', 'Daga', 'Garrote', 'Garrote grande', 'Hacha de mano', 'Jabalina', 'Lanza', 'Martillo ligero', 'Maza', 'Hoz', 'Arco corto', 'Ballesta ligera', 'Dardo', 'Honda'];
export const MARCIALES_PHB = ['Espada corta', 'Espada larga', 'Espadón', 'Estoque', 'Cimitarra', 'Hacha de batalla', 'Hacha a dos manos', 'Martillo de guerra', 'Mazo', 'Alabarda',
  'Mayal', 'Lucero del alba', 'Tridente', 'Látigo', 'Arco largo', 'Ballesta de mano', 'Ballesta pesada', 'Guja', 'Pica', 'Lanza de caballería', 'Pico de guerra', 'Mosquete', 'Pistola', 'Cerbatana'];
const base = nombre => norm(String(nombre || '').replace(/\s*\+\d+\s*$/, '').replace(/\s*\(.*\)\s*$/, ''));
export const esMarcial = arma => MARCIALES_PHB.some(n => norm(n) === base(arma.nombre) || norm(n) === base(arma.arma?.base));
export const esSencilla = arma => SENCILLAS.some(n => norm(n) === base(arma.nombre) || norm(n) === base(arma.arma?.base));

// Todas tienen competencia con armas sencillas; las marciales dependen de la clase. Un arma desconocida (mágica, casera) se da por buena.
export function competenteConArma(ch, arma) {
  if (!esMarcial(arma)) return true;
  const props = (arma.arma?.props || []).map(norm), cc = !props.some(p => p.startsWith('municion'));
  return marcialesDe(ch).some(f => f(props, cc));
}
