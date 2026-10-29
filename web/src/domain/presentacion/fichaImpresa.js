// Ficha para imprimir o guardar en PDF: reúne en un objeto plano todo lo que va en el papel, ya calculado con las reglas.
import { perfil, sgn, clasesTexto, NOMBRE_CAR } from '../reglas/reglas2024.js';
import { tablaCaracteristicas, iniciativa, percepcionPasiva, investigacionPasiva, perspicaciaPasiva, fmtMetros } from '../reglas/habilidades.js';
import { caEfectiva, velocidadEfectiva } from '../combate/efectos.js';
import { pgMaximo, pgActuales, dadosDeGolpe, vidaDe, NOMBRE_ESTADO } from '../combate/vida.js';
import { equipoDe, armasCombate, ataqueArma, MONEDAS, NOMBRE_CAT, pesoTotal, capacidadCarga } from '../equipo/equipo.js';
import { reglasVisibles, resumenRegla } from '../clases/rasgos.js';

const txt = x => String(x ?? '').trim();
const NIVEL_CONJURO = L => (L === 0 ? 'Trucos' : `Nivel ${L}`);

export function datosFicha(ch, catalog = {}) {
  const P = perfil(ch), vida = vidaDe(ch), eq = equipoDe(ch);
  const conjuros = (ch.book || []).map(e => ({ e, s: catalog[e.sid] })).filter(x => x.s)
    .map(({ e, s }) => ({ nombre: txt(s.es) || txt(s.en), nivel: parseInt(s.level, 10) || 0, escuela: txt(s.escuela), tiempo: txt(s.tiempo), alcance: txt(s.alcance), duracion: txt(s.duracion),
      comp: txt(s.comp), conc: !!s.conc, ritual: !!s.ritual, preparado: !!(e.prep || e.always), siempre: !!e.always }))
    .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, 'es'));
  const porNivel = [];
  for (const c of conjuros) { let g = porNivel.at(-1); if (!g || g.nivel !== c.nivel) porNivel.push(g = { nivel: c.nivel, titulo: NIVEL_CONJURO(c.nivel), espacios: P.slots[c.nivel] || 0, conjuros: [] }); g.conjuros.push(c); }
  const ataques = armasCombate(ch).filter(o => o.sinArmas || o.equipado || o.cat === 'arma').map(o => ({ o, a: ataqueArma(ch, o) })).filter(x => x.a)
    .map(({ o, a }) => ({ nombre: txt(o.nombre) || 'Arma', ataque: a.ataque, dano: a.dano, versatil: a.versatil?.dano || '', maestria: a.domina ? a.maestria : '', notas: [...a.notas, ...a.estilos].join('; ') }));
  const ca = caEfectiva(ch), vel = velocidadEfectiva(ch);
  return {
    nombre: txt(ch.nombre) || 'Sin nombre',
    linea: [clasesTexto(ch), ch.subclase && !ch.multiclase?.length ? ch.subclase : '', ch.especie, ch.trasfondo].map(txt).filter(Boolean).join(' · '),
    campana: txt(ch.campana),
    vitales: [
      ['Clase de armadura', String(ca.ca), ca.detalle],
      ['Puntos de golpe', `${pgActuales(ch)} / ${pgMaximo(ch)}`, vida.temp ? `${vida.temp} temporales` : ''],
      ['Dados de golpe', dadosDeGolpe(ch).map(d => `${d.quedan}/${d.total}${d.dado}`).join(' + '), ''],
      ['Iniciativa', sgn(iniciativa(ch)), ''],
      ['Velocidad', fmtMetros(vel.m), vel.cambia ? vel.motivo : ''],
      ['Competencia', sgn(P.pb), ''],
    ],
    pasivas: [['Percepción', percepcionPasiva(ch)], ['Investigación', investigacionPasiva(ch)], ['Perspicacia', perspicaciaPasiva(ch)]],
    caracteristicas: tablaCaracteristicas(ch).map(c => ({ nombre: c.nombre, corto: c.corto, valor: c.valor, mod: sgn(c.mod), salvacion: sgn(c.salvacion.bono), salvComp: c.salvacion.competente,
      habilidades: c.habilidades.map(h => ({ nombre: h.nombre, bono: sgn(h.bono), nivel: h.nivel })) })),
    magia: P.cds.length ? P.cds.map(c => ({ aptitud: NOMBRE_CAR[c.ap], cd: c.cd, ataque: sgn(c.atk) })) : [],
    espacios: Object.entries(P.slots).map(([L, n]) => ({ nivel: +L, n })),
    estados: [...vida.estados.map(k => NOMBRE_ESTADO[k] || k), ...(vida.agotamiento ? [`Agotamiento ${vida.agotamiento}`] : []), ...(vida.inspiracion ? ['Inspiración heroica'] : [])],
    ataques,
    rasgos: reglasVisibles(ch).filter(r => r.nombre).map(r => ({ nombre: txt(r.nombre), detalle: resumenRegla(r) })),
    competencias: [['Idiomas', ch.idiomas], ['Herramientas', ch.herramientas], ['Maestrías', ch.maestrias], ['Dotes', ch.dotes]]
      .map(([t, l]) => [t, (l || []).map(txt).filter(Boolean).join(', ')]).filter(([, l]) => l),
    conjuros: porNivel,
    equipo: eq.objetos.map(o => ({ nombre: txt(o.nombre), cantidad: o.cantidad || 1, cat: NOMBRE_CAT[o.cat] || '', equipado: !!o.equipado, sintonizado: !!o.sintonizado }))
      .sort((a, b) => Number(b.equipado) - Number(a.equipado) || a.nombre.localeCompare(b.nombre, 'es')),
    monedas: MONEDAS.map(([k, n]) => [n, eq.monedas?.[k] || 0]).filter(([, v]) => v),
    carga: `${String(Math.round(pesoTotal(ch) * 10) / 10).replace('.', ',')} / ${String(capacidadCarga(ch)).replace('.', ',')} kg`,
    notas: txt(ch.notas),
  };
}
