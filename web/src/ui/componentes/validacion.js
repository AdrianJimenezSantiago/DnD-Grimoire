// Rechazo visible de lo que no vale: marca el campo (borde, sacudida, aria-invalid), vibra y suelta la burla en el aviso.
// vigilarCampos() protege todos los <input type="number"> y los textos con maxlength de la app sin tocar cada formulario.
import { esc } from '../../core/util.js';
import { leerNumero, leerTexto, burla } from '../../domain/validacion.js';
import { toast } from './toast.js';
import { vibrar } from '../../platform/native.js';

function marcar(el) {
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  el.classList.remove('invalido'); void el.offsetWidth; el.classList.add('invalido');
  el.addEventListener('input', () => { el.classList.remove('invalido'); el.removeAttribute('aria-invalid'); }, { once: true });
}
const etiqueta = el => el?.dataset.campo || el?.getAttribute('aria-label') || el?.closest('label')?.firstChild?.textContent?.trim() || '';

export function rechazar(el, motivo, ctx = {}) {
  marcar(el); vibrar('medium');
  toast(`<span class="aviso-burla">${esc(burla(motivo, { campo: etiqueta(el), ...ctx }))}</span>`);
  if (el && document.activeElement !== el && el.focus) el.focus({ preventScroll: true });
  return null;
}

export function avisarCampo(el, texto) { marcar(el); vibrar('light'); toast(`<span class="aviso-burla">${esc(texto)}</span>`); }

export function numeroDe(el, opts = {}) {
  const r = leerNumero(el?.value, opts);
  return r.ok ? r.n : rechazar(el, r.motivo, { ...opts, valor: String(el?.value ?? '').trim() });
}
export function textoDe(el, opts = {}) {
  const r = leerTexto(el?.value, opts);
  return r.ok ? r.t : rechazar(el, r.motivo, opts);
}

const esNum = el => el instanceof HTMLInputElement && el.type === 'number';
const lim = (el, k) => (el[k] === '' ? null : Number(el[k]));
const entero = el => !el.step || el.step === 'any' ? !/decimal/.test(el.inputMode) : Number.isInteger(Number(el.step));
let ultimo = { el: null, motivo: '', t: 0 };
const unaVez = (el, motivo, fn) => { const t = Date.now(); if (ultimo.el === el && ultimo.motivo === motivo && t - ultimo.t < 1500) return; ultimo = { el, motivo, t }; fn(); };

export function vigilarCampos(root = document) {
  root.addEventListener('keydown', e => {
    const el = e.target; if (!esNum(el) || e.ctrlKey || e.metaKey || e.key.length !== 1) return;
    const min = lim(el, 'min'), malo = /[eE]/.test(e.key) || (e.key === '-' && min != null && min >= 0) || e.key === '+' || ([',', '.'].includes(e.key) && entero(el)) || !/[\d,.+-]/.test(e.key);
    if (malo) { e.preventDefault(); const m = /\d/.test(e.key) ? 'formato' : e.key === '-' ? 'negativo' : [',', '.'].includes(e.key) ? 'decimal' : 'letras'; unaVez(el, m, () => rechazar(el, m, { min, max: lim(el, 'max') })); }
  }, true);
  root.addEventListener('input', e => {
    const el = e.target; if (!esNum(el)) return;
    const max = lim(el, 'max'), min = lim(el, 'min');
    if (el.validity.badInput) { el.value = ''; return unaVez(el, 'letras', () => rechazar(el, 'letras', { min, max })); }
    if (max != null && el.value !== '' && Number(el.value) > max) { const v = el.value; el.value = String(max); unaVez(el, 'alto', () => rechazar(el, 'alto', { min, max, valor: v, tema: el.dataset.tema })); }
  }, true);
  root.addEventListener('change', e => {
    const el = e.target; if (!esNum(el) || el.value === '') return;
    const min = lim(el, 'min'), max = lim(el, 'max'); let n = Number(el.value), motivo = '';
    if (entero(el) && !Number.isInteger(n)) { n = Math.trunc(n); motivo = 'decimal'; }
    if (min != null && n < min) { motivo = n < 0 && min >= 0 ? 'negativo' : n === 0 && min === 1 ? 'cero' : 'bajo'; n = min; }
    if (max != null && n > max) { motivo = 'alto'; n = max; }
    if (motivo) { const v = el.value; el.value = String(n); rechazar(el, motivo, { min, max, valor: v, tema: el.dataset.tema }); }
  }, true);
  root.addEventListener('beforeinput', e => {
    const el = e.target; if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || !(el.maxLength > 0) || !e.inputType?.startsWith('insert')) return;
    const sel = (el.selectionEnd ?? 0) - (el.selectionStart ?? 0), extra = (e.data ?? e.dataTransfer?.getData('text') ?? '').length || 1;
    if (el.value.length - sel + extra > el.maxLength) unaVez(el, 'largo', () => rechazar(el, 'largo', { max: el.maxLength }));
  }, true);
}
