// Menús de combate para marcar rápido los conjuros que te han lanzado: beneficios y perjuicios
import { esc, norm } from '../../core/util.js';
import { EFECTOS, efectosDe, fmtRondas, fmtMod } from '../../domain/efectos.js';
import { vidaDe, quitarMax, ESTADOS } from '../../domain/vida.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { alternarEfecto, alternarEstado } from './vida.js';

let S, TAB = 'bueno', Q = '';
const dlg = () => $('#efectosDlg');

const GRUPOS = {
  bueno: [
    ['Dados y ventaja', 'd20', ['bendicion', 'guia', 'heroismo', 'esperanza', 'potenciar', 'agrandar', 'favordivino', 'armamagica', 'pasarsinrastro', 'furia', 'cancion']],
    ['Defensa', 'ca', ['escudo', 'escudofe', 'pielrobliza', 'armaduramago', 'pielpetrea', 'resistenciat', 'proteccion', 'protenergia', 'protveneno', 'santuario', 'escudofuego', 'guardamuerte', 'auxilio']],
    ['Ocultación y sentidos', 'ojo', ['invisible', 'invismejor', 'borroso', 'imagen', 'desplazamiento', 'vision']],
    ['Movimiento', 'velocidad', ['acelerar', 'zancada', 'volar', 'libertad', 'retirada']],
  ],
  malo: [
    ['Tus tiradas', 'd20', ['perdicion', 'maleficio', 'rayodebil', 'burla', 'maldicion', 'calentar']],
    ['Te dejan expuesto', 'ojo', ['fuegoferico', 'saetaguia', 'toquehelado']],
    ['Movimiento y control', 'md_tiempo', ['ralentizar', 'escarcha', 'confusion']],
  ],
};
// Estados que suelen imponer los conjuros, con ejemplos para reconocerlos
const ESTADOS_DE_CONJURO = {
  asustado: 'Terror', apresado: 'Telaraña, Enmarañar', cegado: 'Sordera/ceguera', ensordecido: 'Sordera/ceguera', derribado: 'Grasa, Orden imperiosa',
  encantado: 'Hechizar persona', envenenado: 'Rayo nauseabundo, Nube apestosa', incapacitado: 'Patrón hipnótico, Risa horrible', inconsciente: 'Dormir',
  paralizado: 'Inmovilizar persona', aturdido: 'Palabra de poder: aturdir', petrificado: 'De la carne a la piedra',
};
const SOBRE = { ataque: 'Ataque', salvacion: 'Salv.', prueba: 'Pruebas', iniciativa: 'Inic.' };
const firma = n => (n > 0 ? '+' : '−') + Math.abs(n);
function etiquetas(e) {
  const t = [...(e.reglas || []).map(r => `${SOBRE[r.sobre]} ${fmtMod(r)}${r.cond ? '*' : ''}`),
    e.ca && `CA ${firma(e.ca)}`, e.caMin && `CA mín. ${e.caMin}`, e.caBase && `CA ${e.caBase} + Des`, e.caAb && 'CA + Int',
    e.vel && `Vel. ${firma(e.vel)} m`, e.velX && `Vel. ×${e.velX === 0.5 ? '½' : e.velX}`, e.danoArma && `Daño +${e.danoArma}`, e.maxPg && `PG máx. +${e.maxPg}`];
  return [...new Set(t.filter(Boolean))];
}

export function openEfectos(tab = 'bueno') { TAB = tab; Q = ''; $('#efxQ').value = ''; render(); openSheet(dlg()); }

function render() {
  const ch = S.cur(); if (!ch) return;
  const bueno = TAB === 'bueno', v = vidaDe(ch), activos = efectosDe(ch), q = norm(Q.trim()), ve = t => !q || t.some(x => norm(x || '').includes(q));
  dlg().classList.toggle('malo', !bueno);
  $('#efxTitle').textContent = bueno ? 'Beneficios' : 'Perjuicios';
  $('#efxSub').textContent = bueno ? `Conjuros que ayudan a ${ch.nombre || 'tu personaje'}, los lance quien los lance. Toca para marcarlo o quitarlo.`
    : `Conjuros y estados que perjudican a ${ch.nombre || 'tu personaje'}. Toca para marcarlo o quitarlo.`;
  const cuenta = b => activos.filter(e => !!e.bueno === b).length;
  $('#efxTabs').innerHTML = [[true, 'bueno', 'Beneficios', 'inspiracion'], [false, 'malo', 'Perjuicios', 'esc_nig']].map(([b, k, t, ico]) => `<button type="button" role="tab" class="efx-tab ${k}" data-eftab="${k}" aria-selected="${TAB === k}">${gi(ico)}${t}${cuenta(b) ? `<small>${cuenta(b)}</small>` : ''}</button>`).join('');

  const mios = activos.filter(e => !!e.bueno === bueno);
  const franja = mios.length && !q ? `<section class="efx-activos" aria-label="Activos ahora"><h3>${gi('estrellas')}Activos ahora</h3><div class="efx-pills">${mios.map(e => `<span class="efx-pill ${e.rondas != null && e.rondas <= 1 ? 'acaba' : ''}">${gi(e.ico || 'inspiracion')}<b>${esc(e.nombre)}</b>${e.rondas != null ? `<small>${esc(fmtRondas(e.rondas))}</small>` : ''}${e.conc ? '<small class="c">conc.</small>' : ''}<button type="button" data-efquita="${esc(e.id)}" aria-label="Quitar ${esc(e.nombre)}"><span aria-hidden="true">×</span></button></span>`).join('')}</div></section>` : '';

  const usados = new Set(), tarjeta = e => {
    const x = v.efectos.find(y => y.k === e.k), on = !!x, tags = etiquetas(e);
    return `<button type="button" class="efx-card ${bueno ? 'bueno' : 'malo'} ${on ? 'on' : ''}" data-efk="${e.k}" aria-pressed="${on}">
      <span class="efx-sello">${gi(e.ico || 'inspiracion')}</span>
      <span class="efx-cuerpo"><b>${esc(e.nombre)}</b><small>${esc(e.texto)}</small>
        ${tags.length ? `<span class="efx-tags">${tags.map(t => `<i>${esc(t)}</i>`).join('')}</span>` : ''}</span>
      <span class="efx-est">${on ? `<em>${x.rondas != null ? `quedan ${esc(fmtRondas(x.rondas))}` : 'activo'}</em>` : e.dur ? `<em class="apag">${esc(fmtRondas(e.dur))}</em>` : ''}${e.tiraObjetivo && bueno ? '<em class="tira">tiras tú el dado</em>' : ''}<i class="efx-marca" aria-hidden="true"></i></span></button>`;
  };
  const lista = EFECTOS.filter(e => !!e.bueno === bueno), porK = Object.fromEntries(lista.map(e => [e.k, e]));
  const grupos = [...GRUPOS[TAB].map(([t, ico, ks]) => [t, ico, ks.map(k => porK[k]).filter(Boolean)]), ['Otros', 'estados', []]];
  grupos.forEach(g => g[2].forEach(e => usados.add(e.k)));
  grupos[grupos.length - 1][2] = lista.filter(e => !usados.has(e.k));
  let n = 0;
  const cuerpo = grupos.map(([t, ico, xs]) => { const vis = xs.filter(e => ve([e.nombre, e.texto])); n += vis.length;
    return vis.length ? `<section class="efx-grupo"><h4>${gi(ico)}${t}</h4><div class="efx-grid">${vis.map(tarjeta).join('')}</div></section>` : ''; }).join('');

  let estados = '';
  if (!bueno) {
    const xs = ESTADOS.filter(([k, nom, txt]) => ESTADOS_DE_CONJURO[k] && ve([nom, txt, ESTADOS_DE_CONJURO[k]])); n += xs.length;
    if (xs.length) estados = `<section class="efx-grupo"><h4>${gi('estados')}Estados que imponen</h4><div class="efx-estados">${xs.map(([k, nom, txt]) => { const on = v.estados.includes(k);
      return `<button type="button" class="efx-est-b ${on ? 'on' : ''}" data-efest="${k}" aria-pressed="${on}" title="${esc(txt)}"><i class="efx-marca" aria-hidden="true"></i><span><b>${esc(nom)}</b><small>${esc(ESTADOS_DE_CONJURO[k])}</small></span></button>`; }).join('')}</div></section>`;
  }
  $('#efxCuenta').textContent = q ? (n ? `${n} coincidencias` : 'Sin coincidencias') : '';
  $('#efxBody').innerHTML = q && !n ? `<p class="el-vacio">Nada coincide con «${esc(Q.trim())}». Prueba con el nombre del conjuro o con lo que hace, como «CA» o «velocidad».</p>`
    : `${franja}${cuerpo}${estados}
    <p class="hint efx-pie">La app suma sola cada efecto marcado a tus tiradas, tu CA y tu velocidad, y descuenta su duración al pasar de ronda.${bueno ? ' Los que dicen «tiras tú el dado» (Bendición, Guía…) te añaden el d4 a las tiradas que hagas mientras estés bajo el conjuro.' : ''} Las marcadas con * solo cuentan en algunos casos: la tirada te deja activarlas.</p>`;
}

export function init(store) {
  S = store;
  const body = $('#efxBody');
  $('#efxQ').addEventListener('input', e => { Q = e.target.value; render(); body.scrollTop = 0; });
  on($('#efxTabs'), 'click', '[data-eftab]', (e, b) => { if (TAB === b.dataset.eftab) return; TAB = b.dataset.eftab; render(); body.scrollTop = 0; haptic('light'); });
  on(body, 'click', '[data-efk]', (e, b) => alternarEfecto(S, b.dataset.efk));
  on(body, 'click', '[data-efest]', (e, b) => alternarEstado(S, b.dataset.efest));
  on(body, 'click', '[data-efquita]', (e, b) => {
    const id = b.dataset.efquita, x = vidaDe(S.cur()).efectos.find(y => y.id === id); if (!x) return;
    const h = S.act(`Termina ${x.nombre}`, (db, c) => { const vv = vidaDe(c); quitarMax(c, id); vv.efectos = vv.efectos.filter(y => y.id !== id); });
    haptic('light'); toast(`<b>${esc(x.nombre)}</b> ya no te afecta.`, [undoBtn(S, h)]);
  });
  S.subscribe(() => { if (dlg().open) render(); });
}
