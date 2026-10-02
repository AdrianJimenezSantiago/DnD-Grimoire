// Diálogo de área de efecto: dibuja la plantilla de un conjuro sobre una cuadrícula y cuenta las casillas.
import { esc } from '../../core/util.js';
import { parseArea, celdasArea, describir, alcanceMetros, casillas, CASILLA } from '../../domain/combate/area.js';
import { $, on } from '../componentes/dom.js';
import { openSheet } from '../componentes/dialog.js';
import { avatarHtml } from '../componentes/avatar.js';

let S, A = null;
const dlg = () => $('#areaDlg');

export function openArea(s, textos) {
  const area = parseArea(textos.join(' '), s.alcance); if (!area) return;
  A = { s, area, alcance: alcanceMetros(s.alcance), dir: 0, zoom: 1, conAlcance: false };
  render(); openSheet(dlg());
}
function render() {
  const { s, area } = A, ch = S.cur();
  const giro = ['cono', 'linea', 'cubo', 'esfera', 'cilindro'].includes(area.forma);
  const lejos = A.conAlcance && A.alcance && ['esfera', 'cilindro', 'cubo'].includes(area.forma);
  const res = celdasArea(area, A.dir), rad = A.dir * Math.PI / 180;
  let dx = 0, dy = 0;
  if (lejos) { const d = A.alcance / CASILLA, r = area.r ? area.r / CASILLA : area.lado / CASILLA / 2; const k = Math.max(0, d - r); dx = Math.round(Math.cos(rad) * k); dy = Math.round(Math.sin(rad) * k); }
  const celdas = res.celdas.map(([x, y]) => [x + dx, y + dy]);
  const pts = [...celdas, [0, 0], [1, 1]];
  if (A.conAlcance && A.alcance) { const R = A.alcance / CASILLA; pts.push([-R, -R], [R + 1, R + 1]); }
  const x0 = Math.floor(Math.min(...pts.map(p => p[0]))) - 1, y0 = Math.floor(Math.min(...pts.map(p => p[1]))) - 1;
  const x1 = Math.ceil(Math.max(...pts.map(p => p[0]))) + 2, y1 = Math.ceil(Math.max(...pts.map(p => p[1]))) + 2;
  const W = x1 - x0, H = y1 - y0;
  const cont = Math.max(240, ($('#arBody').clientWidth || 360) - 56), base = Math.max(6, Math.min(34, (cont - 8) / W));
  const px = base * A.zoom, u = v => v * px;
  let g = '';
  for (let x = 0; x <= W; x++) g += `<line x1="${u(x)}" y1="0" x2="${u(x)}" y2="${u(H)}" class="${(x + x0) % 2 ? '' : 'mj'}"/>`;
  for (let y = 0; y <= H; y++) g += `<line x1="0" y1="${u(y)}" x2="${u(W)}" y2="${u(y)}" class="${(y + y0) % 2 ? '' : 'mj'}"/>`;
  const cel = celdas.map(([x, y]) => `<rect x="${u(x - x0)}" y="${u(y - y0)}" width="${px}" height="${px}"/>`).join('');
  const O = [res.origen[0] + dx - x0, res.origen[1] + dy - y0], ux = Math.cos(rad), uy = Math.sin(rad), P = (a, b) => `${u(a)},${u(b)}`;
  let forma = '';
  if (['esfera', 'cilindro', 'emanacion'].includes(area.forma)) {
    if (area.forma === 'emanacion') { const r = area.r / CASILLA; forma = `<rect x="${u(-x0 - r)}" y="${u(-y0 - r)}" width="${u(1 + 2 * r)}" height="${u(1 + 2 * r)}" rx="${u(r)}"/>`; }
    else forma = `<circle cx="${u(O[0])}" cy="${u(O[1])}" r="${u(area.r / CASILLA)}"/><circle class="pt" cx="${u(O[0])}" cy="${u(O[1])}" r="${Math.max(3, px * 0.15)}"/>`;
  } else if (area.forma === 'cono') {
    const L = area.largo / CASILLA, e = [O[0] + ux * L, O[1] + uy * L];
    forma = `<polygon points="${P(O[0], O[1])} ${P(e[0] - uy * L / 2, e[1] + ux * L / 2)} ${P(e[0] + uy * L / 2, e[1] - ux * L / 2)}"/>`;
  } else if (area.forma === 'linea') {
    const L = area.largo / CASILLA, w = area.ancho / CASILLA / 2, e = [O[0] + ux * L, O[1] + uy * L];
    forma = `<polygon points="${P(O[0] - uy * w, O[1] + ux * w)} ${P(e[0] - uy * w, e[1] + ux * w)} ${P(e[0] + uy * w, e[1] - ux * w)} ${P(O[0] + uy * w, O[1] - ux * w)}"/>`;
  } else if (area.forma === 'cubo') {
    const L = area.lado / CASILLA / 2, c = O, q = [[L, L], [L, -L], [-L, -L], [-L, L]].map(([a, b]) => [c[0] + a * ux - b * uy, c[1] + a * uy + b * ux]);
    forma = `<polygon points="${q.map(([a, b]) => P(a, b)).join(' ')}"/>`;
  }
  const alcance = A.conAlcance && A.alcance ? `<circle class="range" cx="${u(0.5 - x0)}" cy="${u(0.5 - y0)}" r="${u(A.alcance / CASILLA)}"/>` : '';
  const retrato = ch?.retrato?.src;
  const token = `<g class="tok"><circle cx="${u(0.5 - x0)}" cy="${u(0.5 - y0)}" r="${px * 0.46}"/>${retrato ? `<clipPath id="arClip"><circle cx="${u(0.5 - x0)}" cy="${u(0.5 - y0)}" r="${px * 0.42}"/></clipPath><image href="${retrato}" x="${u(-x0) + px * 0.08}" y="${u(-y0) + px * 0.08}" width="${px * 0.84}" height="${px * 0.84}" clip-path="url(#arClip)" preserveAspectRatio="xMidYMid slice"/>` : ''}</g>`;
  $('#arTitle').textContent = s.es;
  $('#arSub').textContent = describir(area);
  $('#arBody').innerHTML = `<div class="ar-meta"><span><b>${celdas.length}</b> casillas afectadas</span><span>1 casilla = 1,5 m (5 pies)</span>${A.alcance ? `<span>Alcance ${String(A.alcance).replace('.', ',')} m (${casillas(A.alcance)} casillas)</span>` : `<span>Alcance: ${esc(s.alcance || '—')}</span>`}</div>
    <div class="ar-tools">${giro ? `<button type="button" data-ar="izq" aria-label="Girar a la izquierda">⟲</button><button type="button" data-ar="der" aria-label="Girar a la derecha">⟳</button>` : ''}
      <button type="button" data-ar="menos" aria-label="Alejar">−</button><button type="button" data-ar="mas" aria-label="Acercar">+</button>
      ${A.alcance ? `<label class="chk-line"><input type="checkbox" id="arAlc" ${A.conAlcance ? 'checked' : ''}> Mostrar alcance${['esfera', 'cilindro', 'cubo'].includes(area.forma) ? ' (área en su punto más lejano)' : ''}</label>` : ''}</div>
    <div class="ar-wrap"><svg class="ar-svg" width="${u(W)}" height="${u(H)}" viewBox="0 0 ${u(W)} ${u(H)}" role="img" aria-label="${esc(describir(area))}: ${celdas.length} casillas">
      <g class="grid">${g}</g>${alcance}<g class="cells">${cel}</g><g class="shape">${forma}</g>${token}</svg></div>
    <p class="note">Una casilla cuenta si el área cubre al menos la mitad. ${['cono', 'linea', 'cubo'].includes(area.forma) ? 'El área sale del borde del lanzador; gírala con ⟲ ⟳.' : area.forma === 'emanacion' ? 'La emanación se extiende desde los bordes de la criatura y se mueve con ella.' : 'El centro del área está en una intersección de la cuadrícula; en mesa puede estar en cualquier punto dentro del alcance.'}</p>`;
}
export function init(store) {
  S = store;
  on($('#arBody'), 'click', '[data-ar]', (e, b) => {
    const a = b.dataset.ar;
    if (a === 'izq') A.dir = (A.dir + 315) % 360; if (a === 'der') A.dir = (A.dir + 45) % 360;
    if (a === 'mas') A.zoom = Math.min(4, A.zoom * 1.3); if (a === 'menos') A.zoom = Math.max(0.4, A.zoom / 1.3);
    render();
  });
  $('#arBody').addEventListener('change', e => { if (e.target.id === 'arAlc') { A.conAlcance = e.target.checked; A.zoom = 1; render(); } });
}
export { avatarHtml };
