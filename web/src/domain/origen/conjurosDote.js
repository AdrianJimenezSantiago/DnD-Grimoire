// Conjuros que dan las dotes: fijos (siempre preparados) y a elegir, con su uso gratis.
import { norm } from '../../core/util.js';
import { dotesDe } from '../reglas/reglas2024.js';

const LISTA_INICIADO = { clerigo: 'Clérigo', druida: 'Druida', mago: 'Mago' };
const DEF = {
  'iniciado en la magia': d => { const lista = LISTA_INICIADO[norm(d.detalle)] || 'Mago';
    return { fijos: [], elegir: [{ k: 'trucos', n: 2, nivel: 0, lista }, { k: 'nivel1', n: 1, nivel: 1, lista }], nota: `trucos y conjuro de nivel 1 de ${lista.toLowerCase()}` }; },
  'influencia feerica': () => ({ fijos: ['Paso brumoso'], elegir: [{ k: 'nivel1', n: 1, nivel: 1, escuelas: ['Adivinación', 'Encantamiento'] }], nota: 'conjuro de nivel 1 de adivinación o encantamiento' }),
  'influencia sombria': () => ({ fijos: ['Invisibilidad'], elegir: [{ k: 'nivel1', n: 1, nivel: 1, escuelas: ['Ilusionismo', 'Nigromancia'] }], nota: 'conjuro de nivel 1 de ilusionismo o nigromancia' }),
  telepatico: () => ({ fijos: ['Detectar pensamientos'], elegir: [] }),
  telequinetico: () => ({ fijos: ['Mano de mago'], elegir: [] }),
  'chispa del fuego magico': () => ({ fijos: ['Llama sagrada'], elegir: [] }),
  'conjurador de frio': () => ({ fijos: ['Rayo de escarcha'], elegir: [] }),
  'principiante del enclave esmeralda': () => ({ fijos: ['Hablar con los animales'], elegir: [] }),
  'magia del enclave': () => ({ fijos: ['Sentidos de la bestia'], elegir: [] }),
  'don del jolgorio': () => ({ fijos: ['Baile irresistible de Otto'], elegir: [] }),
};
export const fuenteDote = d => (d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre);
export function conjurosDeDote(d) {
  const f = DEF[norm(d.nombre)]; if (!f) return null;
  const x = f(d); return { ...x, fuente: fuenteDote(d), clave: norm(fuenteDote(d)).replace(/[^a-z]+/g, '-') };
}
export const dotesConConjuros = (ch, trasfondos = []) => dotesDe(ch, trasfondos).map(conjurosDeDote).filter(Boolean);
export const filtroEleccion = e => it => it.l === e.nivel && (e.lista ? (!it.cl || it.cl.includes(e.lista)) : (e.escuelas || []).some(s => norm(it.esc || '').startsWith(norm(s).slice(0, 5))));
