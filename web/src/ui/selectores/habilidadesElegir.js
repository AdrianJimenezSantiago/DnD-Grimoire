// Elección de habilidades y pericias según la fuente que las da (clase, trasfondo, dote, subclase).
import { esc } from '../../core/util.js';
import { HABILIDADES, NOMBRE_HAB } from '../../domain/reglas/habilidades.js';
import { icon } from '../componentes/icons.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';

const TODAS = HABILIDADES.length;
// Qué pide una fuente de competencias (dote Habilidoso, subclase, multiclase…)
export function textoFuente(f) {
  if (f.fijas) return `te da ${f.lista.length === TODAS ? 'competencia en todas las habilidades' : `competencia en ${f.lista.map(k => NOMBRE_HAB[k]).join(' y ')}`}.`;
  const cuantas = f.n === 1 ? 'una habilidad' : `${f.n} habilidades`;
  return `elige ${cuantas}${f.lista.length < TODAS ? ` entre ${f.lista.map(k => NOMBRE_HAB[k]).join(', ')}` : ' a tu elección'}${f.pericia ? '; tendrás pericia en ellas' : ''}.`
    + (f.herramientas ? ' Puedes cambiar alguna por una herramienta: déjala sin marcar y anótala en la ficha.' : '')
    + (f.nota ? ` ${f.nota}` : '');
}
// Habilidades que aún se pueden coger de la lista (las que ya tienes no cuentan)
export const disponibles = (f, hab, sel = []) => f.lista.filter(k => !(hab[k] >= 1) || sel.includes(k));
export const faltanDe = (f, hab, sel = []) => (f.fijas ? 0 : Math.max(0, Math.min(f.n, disponibles(f, hab, sel).length) - sel.length));

// Bloque para elegir las habilidades de una fuente. `hab`: niveles sin contar esta elección.
export function fuenteHtml(f, { hab, sel = [], attr }) {
  if (f.fijas) return `<div class="cc-elige ok"><p>${icon('sparkles')}<b>${esc(f.nombre)}</b> ${esc(textoFuente(f))}</p></div>`;
  const lleno = sel.length >= f.n, falta = faltanDe(f, hab, sel);
  const pills = f.lista.map(k => {
    const on = sel.includes(k), ya = !on && hab[k] >= 1;
    return `<button type="button" class="cc-pill ${on ? 'on' : ''}" ${attr}="${k}" aria-pressed="${on}" ${ya || (!on && lleno) ? 'disabled' : ''}>${esc(NOMBRE_HAB[k])}${ya ? ' <small>ya la tienes</small>' : ''}</button>`;
  }).join('');
  return `<div class="cc-elige ${falta ? 'falta' : 'ok'}"><p>${falta ? `<b class="cc-num">${falta}</b>` : icon('sparkles')}<b>${esc(f.nombre)}</b>: ${esc(textoFuente(f))} (${sel.length} de ${f.n})</p><div class="cc-pills">${pills}</div></div>`;
}
// Bloque para elegir pericias entre las habilidades en las que ya eres competente
export function periciaHtml(n, { hab, sel = [], attr, titulo = 'Pericia' }) {
  const lista = HABILIDADES.map(([k]) => k).filter(k => hab[k] === 1 || sel.includes(k)), lleno = sel.length >= n, falta = Math.max(0, Math.min(n, lista.length) - sel.length);
  const pills = lista.map(k => { const on = sel.includes(k); return `<button type="button" class="cc-pill ${on ? 'on' : ''}" ${attr}="${k}" aria-pressed="${on}" ${!on && lleno ? 'disabled' : ''}>${esc(NOMBRE_HAB[k])}</button>`; }).join('');
  return `<div class="cc-elige ${falta ? 'falta' : 'ok'}"><p>${falta ? `<b class="cc-num">${falta}</b>` : icon('sparkles')}<b>${esc(titulo)}</b>: elige ${n === 1 ? 'una habilidad' : `${n} habilidades`} en las que ya seas competente para duplicar tu bonificador de competencia (${sel.length} de ${n}).</p>
    <div class="cc-pills">${pills || '<span class="hint">Aún no eres competente en ninguna habilidad sin pericia.</span>'}</div></div>`;
}
export const alternarHab = (sel, k, n) => (sel.includes(k) ? sel.filter(x => x !== k) : sel.length < n ? [...sel, k] : sel);
// Aplica lo elegido a un mapa de habilidades: competencia, o pericia si la fuente la da
export function aplicarFuente(hab, f, sel) {
  const out = { ...hab }, nivel = f.pericia ? 2 : 1;
  for (const k of f.fijas ? f.lista : sel) out[k] = Math.max(out[k] || 0, nivel);
  return out;
}

// Ventana que pregunta las habilidades de una o varias fuentes. Devuelve el mapa de habilidades nuevo, o null si se cancela.
let dlg = null;
export function preguntarHabilidades(fuentes, hab, { titulo = 'Elige tus habilidades' } = {}) {
  if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'modal hab-modal'; dlg.setAttribute('aria-labelledby', 'habTitle'); document.body.appendChild(dlg); }
  const d = dlg, sel = fuentes.map(() => []);
  return new Promise(resolve => {
    let hecho = false;
    const fin = v => { if (hecho) return; hecho = true; closeSheet(d); resolve(v); };
    const base = i => fuentes.slice(0, i).reduce((h, f, j) => aplicarFuente(h, f, sel[j]), hab);
    const pintar = () => {
      d.innerHTML = `<h2 id="habTitle">${esc(titulo)}</h2>
        <div class="hab-fuentes">${fuentes.map((f, i) => fuenteHtml(f, { hab: base(i), sel: sel[i], attr: `data-hm="${i}" data-hk` })).join('')}</div>
        <div class="md-btns"><button type="button" data-hfin="0">Más tarde</button><button type="button" class="primary" data-hfin="1">Aceptar</button></div>`;
    };
    pintar();
    d.onclick = e => {
      const p = e.target.closest('[data-hk]');
      if (p) { const i = +p.dataset.hm; sel[i] = alternarHab(sel[i], p.dataset.hk, fuentes[i].n); pintar(); d.querySelector(`[data-hm="${i}"][data-hk="${p.dataset.hk}"]`)?.focus(); return; }
      const b = e.target.closest('[data-hfin]');
      if (b) fin(b.dataset.hfin === '1' ? fuentes.reduce((h, f, i) => aplicarFuente(h, f, sel[i]), hab) : null);
    };
    d.oncancel = e => { e.preventDefault(); fin(null); };
    d.addEventListener('close', () => fin(null), { once: true });
    openSheet(d);
  });
}

// Ventana para elegir una opción con su texto (la variante de Golpes benditos, por ejemplo). Devuelve el nombre o null.
export function preguntarOpcion({ titulo, texto = '', opciones }) {
  if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'modal hab-modal'; dlg.setAttribute('aria-labelledby', 'habTitle'); document.body.appendChild(dlg); }
  const d = dlg;
  return new Promise(resolve => {
    let hecho = false;
    const fin = v => { if (hecho) return; hecho = true; closeSheet(d); resolve(v); };
    d.innerHTML = `<h2 id="habTitle">${esc(titulo)}</h2>${texto ? `<p class="md-text">${esc(texto)}</p>` : ''}
      <div class="lv-estilos">${opciones.map((o, i) => `<button type="button" class="lv-estilo" data-hop="${i}"><b>${esc(o.nombre)}</b><span class="sp-text">${esc(o.texto)}</span></button>`).join('')}</div>
      <div class="md-btns" style="margin-top:14px"><button type="button" data-hfin="0">Más tarde</button></div>`;
    d.onclick = e => { const o = e.target.closest('[data-hop]'); if (o) return fin(opciones[+o.dataset.hop].nombre); if (e.target.closest('[data-hfin]')) fin(null); };
    d.oncancel = e => { e.preventDefault(); fin(null); };
    d.addEventListener('close', () => fin(null), { once: true });
    openSheet(d);
  });
}
