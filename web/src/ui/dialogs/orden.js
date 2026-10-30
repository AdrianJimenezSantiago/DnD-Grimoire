// Diálogo para añadir aliados o enemigos al orden de iniciativa: nombre, bando, iniciativa (o tirada), cuántos y PG.
import { esc } from '../../core/util.js';
import { leerNumero, leerTexto } from '../../domain/presentacion/validacion.js';
import { $, on } from '../componentes/dom.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { rechazar } from '../componentes/validacion.js';

const dlg = () => $('#ordenDlg');
let resolver = null, tipo = 'enemigo';

function fijarTipo(t) {
  tipo = t;
  dlg().querySelectorAll('[data-ortipo]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.ortipo === t)));
}
function leer() {
  const nombre = leerTexto($('#orNombre').value, { max: 40, obligatorio: true });
  if (!nombre.ok) return rechazar($('#orNombre'), nombre.motivo, { campo: 'Nombre' });
  const campos = [['#orIni', 'Iniciativa', -10, 60, false], ['#orMod', 'Modificador', -10, 20, false], ['#orCant', 'Cuántos', 1, 12, false], ['#orPg', 'PG', 1, 9999, false]], v = {};
  for (const [sel, campo, min, max, obligatorio] of campos) {
    const r = leerNumero($(sel).value, { min, max, obligatorio });
    if (!r.ok) return rechazar($(sel), r.motivo, { campo, min, max, valor: $(sel).value.trim() });
    v[sel] = r.n;
  }
  return { nombre: nombre.t, tipo, ini: v['#orIni'], desempate: v['#orMod'] ?? 0, cantidad: v['#orCant'] ?? 1, pgMax: v['#orPg'] };
}
export function pedirCombatientes({ sugerencias = [], tipoInicial = 'enemigo' } = {}) {
  resolver?.(null);
  $('#orSugerencias').innerHTML = [...new Set(sugerencias)].slice(0, 60).map(n => `<option value="${esc(n)}"></option>`).join('');
  for (const [sel, v] of [['#orNombre', ''], ['#orIni', ''], ['#orMod', '0'], ['#orCant', '1'], ['#orPg', '']]) $(sel).value = v;
  fijarTipo(tipoInicial);
  abrirDialogo(dlg());
  setTimeout(() => $('#orNombre').focus(), 60);
  return new Promise(r => { resolver = r; });
}
function terminar(v) { const r = resolver; resolver = null; r?.(v); }
export function init() {
  on(dlg(), 'click', '[data-ortipo]', (e, b) => fijarTipo(b.dataset.ortipo));
  const aceptar = () => { const v = leer(); if (!v) return; terminar(v); cerrarDialogo(dlg()); };
  $('#orOk').addEventListener('click', aceptar);
  dlg().addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); aceptar(); } });
  dlg().addEventListener('close', () => terminar(null));
}
