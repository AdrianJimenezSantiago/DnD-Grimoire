import { norm } from '../../core/util.js';
import { statsEfectivos } from '../equipo/objetosEfecto.js';
import { clasesDe, modOf, competencia, nivelTotal, dotesDe } from '../reglas/reglas2024.js';
import { textoMaestria } from '../reglas/referencia.js';

// Maestría con armas (Manual del Jugador de 2024): cuántas armas por clase y nivel, y cuáles puede elegir
export const CUPO_MAESTRIA = { 'Bárbaro': [[1, 2], [4, 3], [10, 4]], 'Guerrero': [[1, 3], [4, 4], [10, 5], [16, 6]], 'Paladín': [[1, 2]], 'Explorador': [[1, 2]], 'Pícaro': [[1, 2]] };
export const SENCILLAS = ['Bastón', 'Daga', 'Garrote', 'Hacha de mano', 'Jabalina', 'Lanza', 'Maza', 'Hoz', 'Arco corto', 'Ballesta ligera'];
const cupoClase = (clase, L) => (CUPO_MAESTRIA[clase] || []).reduce((n, [desde, v]) => (L >= desde ? v : n), 0);
// Maestro de armas (dote) da una maestría más
export const cupoMaestrias = ch => clasesDe(ch).reduce((n, c) => n + cupoClase(c.clase, c.nivel), 0) + dotesDe(ch).filter(d => norm(d.nombre) === 'maestro de armas').length;
export const cupoEn = (clase, L) => cupoClase(clase, L);
export const esSencilla = nombre => SENCILLAS.some(s => norm(s) === norm(nombre));

// Qué armas puede dominar: el bárbaro, cuerpo a cuerpo; el pícaro, sencillas y marciales con Sutil o Ligera
export function armaElegible(ch, arma) {
  const props = (arma.arma?.props || []).map(norm), distancia = props.some(p => p.startsWith('municion'));
  return clasesDe(ch).some(c => {
    if (!cupoClase(c.clase, c.nivel)) return false;
    if (c.clase === 'Bárbaro') return !distancia;
    if (c.clase === 'Pícaro') return esSencilla(arma.nombre) || props.includes('sutil') || props.includes('ligera');
    return true;
  });
}
export const tieneMaestria = (ch, nombre) => (ch.maestrias || []).some(m => norm(m) === norm(nombre));

// Qué pasa al impactar o al fallar, con los números del personaje
export function efectoMaestria(ch, maestria, { mod = 0 } = {}) {
  const m = norm(maestria), pb = competencia(nivelTotal(ch)), cd = 8 + mod + pb;
  const E = {
    debilitar: { alImpactar: 'El objetivo tiene desventaja en su siguiente tirada de ataque antes del inicio de tu siguiente turno.' },
    derribar: { alImpactar: `El objetivo hace una salvación de Constitución CD ${cd} o queda derribado.` },
    empujar: { alImpactar: 'Puedes empujar al objetivo hasta 3 m en línea recta, alejándolo de ti (si es Grande o más pequeño).' },
    hendir: { alImpactar: `Puedes hacer otro ataque con esta arma contra otra criatura a 1,5 m de la primera y a tu alcance. Su daño no suma tu modificador${mod < 0 ? ' (salvo el negativo)' : ''}. Una vez por turno.` },
    irritar: { alImpactar: 'Tienes ventaja en tu siguiente ataque contra esa criatura antes del final de tu siguiente turno.' },
    mella: { siempre: 'El ataque extra de la propiedad Ligera forma parte de tu acción de Ataque: no gasta tu acción adicional. Una vez por turno.' },
    ralentizar: { alImpactar: 'La velocidad del objetivo baja 3 m hasta el inicio de tu siguiente turno (no se acumula).' },
    rozar: { alFallar: `El objetivo recibe igualmente ${Math.max(0, mod)} de daño del tipo del arma.` },
  }[m];
  return E ? { nombre: maestria, texto: textoMaestria(maestria), ...E } : null;
}

// Ataques por acción de Ataque (Ataque adicional y sus mejoras)
const ATAQUES = { 'Guerrero': [[5, 2], [11, 3], [20, 4]], 'Bárbaro': [[5, 2]], 'Paladín': [[5, 2]], 'Explorador': [[5, 2]], 'Monje': [[5, 2]] };
const SUB_ATAQUE = [[/valor/i, 'Bardo', 6], [/hojacantante|bladesinger/i, 'Mago', 6]];
export function ataquesPorAccion(ch) {
  let n = 1;
  for (const c of clasesDe(ch)) {
    n = Math.max(n, (ATAQUES[c.clase] || []).reduce((v, [L, k]) => (c.nivel >= L ? k : v), 1));
    for (const [re, clase, L] of SUB_ATAQUE) if (c.clase === clase && re.test(c.subclase || '') && c.nivel >= L) n = Math.max(n, 2);
  }
  return n;
}
export const modAtaque = (ch, arma) => {
  const props = (arma.arma?.props || []).map(norm), st = statsEfectivos(ch);
  return props.some(p => p.startsWith('municion')) ? modOf(st.des) : props.includes('sutil') ? Math.max(modOf(st.fue), modOf(st.des)) : modOf(st.fue);
};
