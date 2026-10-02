import { esc } from '../../core/util.js';
import { storage } from '../../platform/native.js';

const PREF = 'grimorio-tour-';
let capa = null, estado = null;

const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
function montar() {
  if (capa) return;
  capa = document.createElement('div'); capa.className = 'tour'; capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true');
  capa.innerHTML = '<div class="tour-hole"></div><div class="tour-card" role="document"></div>';
  document.body.appendChild(capa);
  capa.addEventListener('click', e => {
    const b = e.target.closest('[data-tour]'); if (!b) return;
    if (b.dataset.tour === 'next') ir(estado.i + 1); else if (b.dataset.tour === 'prev') ir(estado.i - 1); else cerrar(true);
  });
  addEventListener('resize', () => estado && colocar());
  document.addEventListener('keydown', e => { if (!estado) return; if (e.key === 'Escape') cerrar(true); if (e.key === 'ArrowRight') ir(estado.i + 1); if (e.key === 'ArrowLeft') ir(estado.i - 1); });
}
function pasosVisibles() { return estado.pasos.filter(p => !p.sel || visible(document.querySelector(p.sel))); }
function colocar() {
  const pasos = pasosVisibles(), p = pasos[estado.i]; if (!p) return;
  const hole = capa.querySelector('.tour-hole'), card = capa.querySelector('.tour-card');
  const el = p.sel ? document.querySelector(p.sel) : null;
  if (el) {
    el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    const r = el.getBoundingClientRect(), pad = 8;
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`, opacity: 1 });
    const cw = Math.min(360, innerWidth - 24), abajo = r.bottom + 16 + 200 < innerHeight;
    card.style.left = `${Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2))}px`;
    card.style.top = abajo ? `${r.bottom + 16}px` : ''; card.style.bottom = abajo ? '' : `${innerHeight - r.top + 16}px`;
    card.style.width = `${cw}px`;
  } else {
    Object.assign(hole.style, { left: '50%', top: '42%', width: '0px', height: '0px', opacity: 0 });
    const cw = Math.min(380, innerWidth - 24);
    Object.assign(card.style, { width: `${cw}px`, left: `${(innerWidth - cw) / 2}px`, top: '30%', bottom: '' });
  }
  card.innerHTML = `<div class="tour-step">${estado.i + 1} de ${pasos.length}</div><h3>${esc(p.titulo)}</h3><p>${p.texto}</p>
    <div class="tour-btns"><button type="button" class="ghost" data-tour="skip">${estado.i === pasos.length - 1 ? 'Cerrar' : 'Saltar'}</button><span></span>
    ${estado.i ? '<button type="button" data-tour="prev">Atrás</button>' : ''}<button type="button" class="gold" data-tour="${estado.i === pasos.length - 1 ? 'skip' : 'next'}">${estado.i === pasos.length - 1 ? 'Entendido' : 'Siguiente'}</button></div>`;
  card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  card.querySelector('.gold')?.focus({ preventScroll: true });
}
function ir(i) { const n = pasosVisibles().length; if (i < 0 || i >= n) { if (i >= n) cerrar(true); return; } estado.i = i; colocar(); }
function cerrar(visto) { if (!estado) return; if (visto) storage.set(PREF + estado.id, '1'); const fin = estado.alTerminar; estado = null; capa?.classList.remove('on'); document.body.classList.remove('touring'); fin?.(); }
export const enTour = () => !!estado;
export const cerrarTour = () => cerrar(true);
export async function tour(id, pasos, { forzar = false, alTerminar = null } = {}) {
  if (estado) return;
  if (!forzar && (await storage.get(PREF + id)) === '1') { alTerminar?.(); return; }
  montar(); estado = { id, pasos, i: 0, alTerminar };
  if (!pasosVisibles().length) { estado = null; alTerminar?.(); return; }
  capa.classList.add('on'); document.body.classList.add('touring'); colocar();
}
