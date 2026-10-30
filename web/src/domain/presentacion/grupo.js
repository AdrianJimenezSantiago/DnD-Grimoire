// Vista de grupo para el DJ: lo que se consulta de cada personaje durante la partida, en una fila por personaje.
import { perfil, sgn, clasesTexto } from '../reglas/reglas2024.js';
import { tablaCaracteristicas, percepcionPasiva, investigacionPasiva, perspicaciaPasiva, iniciativa, fmtMetros } from '../reglas/habilidades.js';
import { caEfectiva, velocidadEfectiva } from '../combate/efectos.js';
import { pgMaximo, pgActuales, vidaDe, estadoVital, NOMBRE_ESTADO } from '../combate/vida.js';

export function filaGrupo(ch) {
  const P = perfil(ch), v = vidaDe(ch), tabla = tablaCaracteristicas(ch);
  return {
    id: ch.id, nombre: ch.nombre || 'Sin nombre', clase: clasesTexto(ch), especie: ch.especie || '',
    ca: caEfectiva(ch).ca, pg: pgActuales(ch), pgMax: pgMaximo(ch), temp: v.temp || 0, vital: estadoVital(ch),
    velocidad: fmtMetros(velocidadEfectiva(ch).m), iniciativa: sgn(iniciativa(ch)),
    pasivas: { percepcion: percepcionPasiva(ch), investigacion: investigacionPasiva(ch), perspicacia: perspicaciaPasiva(ch) },
    salvaciones: tabla.map(c => ({ corto: c.corto, bono: sgn(c.salvacion.bono), competente: c.salvacion.competente })),
    cd: P.cds.length ? P.cds.map(c => c.cd).join(' / ') : '',
    estados: [...v.estados.map(k => NOMBRE_ESTADO[k] || k), ...(v.agotamiento ? [`Agotamiento ${v.agotamiento}`] : [])],
    concentracion: ch.play?.conc || '', inspiracion: !!v.inspiracion,
  };
}
export function resumenGrupo(db) {
  const todos = db?.chars || [], propios = todos.filter(c => !c.prueba), chars = propios.length ? propios : todos;
  const filas = chars.map(filaGrupo);
  const max = k => { const v = filas.map(f => f.pasivas[k]); return new Set(v).size > 1 ? Math.max(...v) : null; };
  return { filas, mejores: { percepcion: max('percepcion'), investigacion: max('investigacion'), perspicacia: max('perspicacia') } };
}
