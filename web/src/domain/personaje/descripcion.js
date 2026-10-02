// Líneas de texto que resumen a un personaje en listas y cabeceras («Mago (Adivinación), nivel 6», «Elfo, Sabio»).
import { clasesDe } from '../reglas/reglas2024.js';

export const claseLinea = ch => { const cs = clasesDe(ch); return cs.length > 1 ? cs.map(c => `${c.clase} ${c.nivel}${c.subclase ? ` (${c.subclase})` : ''}`).join(' / ') : `${ch.clase}${ch.subclase ? ` (${ch.subclase})` : ''}, nivel ${ch.nivel}`; };
export const origenLinea = ch => [ch.especie, ch.trasfondo].filter(Boolean).join(', ');
