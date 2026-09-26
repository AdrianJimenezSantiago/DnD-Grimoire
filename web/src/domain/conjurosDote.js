import { norm } from '../core/util.js';
import { dotesDe } from './reglas2024.js';

// Conjuros que dan las dotes del Manual del Jugador de 2024: fijos (siempre preparados) y a elegir.
// «elegir»: { k, n, nivel, lista } o { k, n, nivel, escuelas }. «gratis»: el de nivel 1 se lanza una vez sin espacio (uso de la dote).
const LISTA_INICIADO = { clerigo: 'Clérigo', druida: 'Druida', mago: 'Mago' };
const DEF = {
  'iniciado en la magia': d => { const lista = LISTA_INICIADO[norm(d.detalle)] || 'Mago';
    return { fijos: [], elegir: [{ k: 'trucos', n: 2, nivel: 0, lista }, { k: 'nivel1', n: 1, nivel: 1, lista }], nota: `trucos y conjuro de nivel 1 de ${lista.toLowerCase()}` }; },
  'influencia feerica': () => ({ fijos: ['Paso brumoso'], elegir: [{ k: 'nivel1', n: 1, nivel: 1, escuelas: ['Adivinación', 'Encantamiento'] }], nota: 'conjuro de nivel 1 de adivinación o encantamiento' }),
  'influencia sombria': () => ({ fijos: ['Invisibilidad'], elegir: [{ k: 'nivel1', n: 1, nivel: 1, escuelas: ['Ilusionismo', 'Nigromancia'] }], nota: 'conjuro de nivel 1 de ilusionismo o nigromancia' }),
  telepatico: () => ({ fijos: ['Detectar pensamientos'], elegir: [] }),
  telequinetico: () => ({ fijos: ['Mano de mago'], elegir: [] }),
};
// Nombre con el que la dote aparece como fuente en el libro: «Iniciado en la magia (mago)», «Influencia feérica»
export const fuenteDote = d => (d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre);
export function conjurosDeDote(d) {
  const f = DEF[norm(d.nombre)]; if (!f) return null;
  const x = f(d); return { ...x, fuente: fuenteDote(d), clave: norm(fuenteDote(d)).replace(/[^a-z]+/g, '-') };
}
export const dotesConConjuros = (ch, trasfondos = []) => dotesDe(ch, trasfondos).map(conjurosDeDote).filter(Boolean);
// Filtro para los selectores de conjuros (items del catálogo: l = nivel, cl = clases, esc = escuela)
export const filtroEleccion = e => it => it.l === e.nivel && (e.lista ? (!it.cl || it.cl.includes(e.lista)) : (e.escuelas || []).some(s => norm(it.esc || '').startsWith(norm(s).slice(0, 5))));
