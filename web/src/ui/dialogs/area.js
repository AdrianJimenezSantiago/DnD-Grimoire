// Diálogo de área de efecto: dibuja la plantilla de un conjuro sobre una cuadrícula y cuenta las casillas.
// Distingue las casillas enteras, las cubiertas a más de la mitad y las que el área solo roza (no cuentan).
// Las áreas que salen del lanzador se apuntan tocando la cuadrícula; las que se lanzan a un punto se colocan
// dentro del alcance tocando o arrastrando.
import { esc } from '../../core/util.js';
import { leerArea, celdasArea, describir, alcanceMetros, casillas, CASILLA } from '../../domain/combate/area.js';
import { $, on } from '../componentes/dom.js';
import { abrirDialogo } from '../componentes/dialog.js';
import { avatarHtml } from '../componentes/avatar.js';

let S, A = null;
const dlg = () => $('#areaDlg');
const GIRAN = ['cono', 'linea', 'cubo', 'esfera', 'cilindro'], SITUABLES = ['esfera', 'cilindro', 'cubo'], DESDE_TI = ['cono', 'linea', 'cubo'];
const RUMBOS = [['→', 'este'], ['↘', 'sureste'], ['↓', 'sur'], ['↙', 'suroeste'], ['←', 'oeste'], ['↖', 'noroeste'], ['↑', 'norte'], ['↗', 'noreste']];
const mt = x => String(Math.round(x * 10) / 10).replace('.', ',');
const YO = [0.5, 0.5];

export function abrirArea(s, textos) {
  const area = leerArea(textos.join(' '), s.alcance); if (!area) return;
  A = { s, area, alcance: alcanceMetros(s.alcance), dir: 0, zoom: 1, conAlcance: false, todas: true, pt: null, anim: true, centrar: false, fant: null };
  $('#arTitle').textContent = s.es;
  $('#arSub').textContent = describir(area);
  abrirDialogo(dlg()); montar(); pintar();
}
// Lo que no cambia mientras el diálogo está abierto: barra de herramientas y huecos para el resto
function montar() {
  const f = A.area.forma, situable = A.alcance && SITUABLES.includes(f);
  $('#arBody').innerHTML = `<div class="ar-meta" id="arMeta" role="status"></div>
    <div class="ar-tools">${GIRAN.includes(f) ? `<div class="ar-grp" id="arGiro" role="group" aria-label="Dirección"><button type="button" data-ar="izq" aria-label="Girar a la izquierda">⟲</button><span class="ar-rumbo" id="arRumbo"></span><button type="button" data-ar="der" aria-label="Girar a la derecha">⟳</button></div>` : ''}
      <div class="ar-grp" role="group" aria-label="Zoom"><button type="button" data-ar="menos" aria-label="Alejar">−</button><button type="button" data-ar="ajustar" aria-label="Ajustar a la ventana">⤢</button><button type="button" data-ar="mas" aria-label="Acercar">+</button></div>
      <div class="ar-chks">${A.alcance ? `<label class="chk-line"><input type="checkbox" id="arAlc"> ${situable ? 'Colocar dentro del alcance' : 'Mostrar alcance'}</label>` : ''}
      ${DESDE_TI.includes(f) ? `<label class="chk-line" id="arTodasL"><input type="checkbox" id="arTodas" checked> Ver todas las direcciones</label>` : ''}</div></div>
    <div class="ar-wrap" id="arWrap"><svg class="ar-svg" id="arSvg" role="img"></svg></div>
    <ul class="ar-ley" id="arLey"></ul>
    <p class="note" id="arNota"></p>`;
}
// Ajusta un punto de origen a la cuadrícula (igual que el original) y lo mete dentro del alcance
function ajustar(p, o, R) {
  const snap = q => [o[0] + Math.round(q[0] - o[0]), o[1] + Math.round(q[1] - o[1])], v = [p[0] - YO[0], p[1] - YO[1]], d = Math.hypot(...v);
  let k = d > R ? R / d : 1, q = snap([YO[0] + v[0] * k, YO[1] + v[1] * k]);
  while (Math.hypot(q[0] - YO[0], q[1] - YO[1]) > R + 1e-6 && k > 0) { k -= 0.02; q = snap([YO[0] + v[0] * k, YO[1] + v[1] * k]); }
  return q;
}
// Casillas que puede llegar a tocar el área si se gira en cualquiera de las 8 direcciones
function fantasma() {
  if (!A.fant) { A.fant = new Set(); for (let d = 0; d < 360; d += 45) for (const [x, y] of celdasArea(A.area, d).celdas) A.fant.add(`${x},${y}`); }
  return A.fant;
}
function pintar() {
  const { area } = A, f = area.forma, ch = S.cur();
  const R = A.alcance ? A.alcance / CASILLA : 0, verAlc = A.conAlcance && R > 0, situa = verAlc && SITUABLES.includes(f);
  const res = celdasArea(area, A.dir), rad = A.dir * Math.PI / 180, ux = Math.cos(rad), uy = Math.sin(rad);
  const rArea = area.r ? area.r / CASILLA : area.lado ? area.lado / CASILLA * Math.SQRT1_2 : 0;
  if (situa) A.pt = ajustar(A.pt || [YO[0] + ux * R, YO[1] + uy * R], res.origen, R);
  const dx = situa ? A.pt[0] - res.origen[0] : 0, dy = situa ? A.pt[1] - res.origen[1] : 0, mv = ([x, y]) => [x + dx, y + dy];
  const celdas = res.celdas.map(mv), roces = res.roces.map(mv), O = mv(res.origen);
  const tomadas = new Set(celdas.map(c => c.join(',')));
  const fant = A.todas && !situa && DESDE_TI.includes(f) ? [...fantasma()].filter(k => !tomadas.has(k)).map(k => k.split(',').map(Number)) : [];

  // Encuadre: el área, el lanzador y, con el alcance a la vista, el círculo hasta donde puede llegar el efecto
  const pts = [...celdas, ...roces, ...fant, [0, 0], [1, 1]], env = situa ? R + rArea : R;
  if (verAlc) pts.push([YO[0] - env, YO[1] - env], [YO[0] + env, YO[1] + env]);
  const x0 = Math.floor(Math.min(...pts.map(p => p[0]))) - 1, y0 = Math.floor(Math.min(...pts.map(p => p[1]))) - 1;
  const x1 = Math.ceil(Math.max(...pts.map(p => p[0]))) + 2, y1 = Math.ceil(Math.max(...pts.map(p => p[1]))) + 2;
  const W = x1 - x0, H = y1 - y0, wrap = $('#arWrap');
  const anchoU = Math.max(240, (wrap.clientWidth || 360) - 12), altoU = Math.max(240, innerHeight * 0.58 - 12);
  const base = Math.max(6, Math.min(46, anchoU / W, verAlc ? altoU / H : 46));
  const px = base * A.zoom, u = v => +(v * px).toFixed(2), X = v => u(v - x0), Y = v => u(v - y0), P = ([a, b]) => `${X(a)},${Y(b)}`;
  Object.assign(A, { x0, y0, px });

  let g = '';
  for (let x = 0; x <= W; x++) g += `<line x1="${u(x)}" y1="0" x2="${u(x)}" y2="${u(H)}"${(x + x0) % 2 ? '' : ' class="mj"'}/>`;
  for (let y = 0; y <= H; y++) g += `<line x1="0" y1="${u(y)}" x2="${u(W)}" y2="${u(y)}"${(y + y0) % 2 ? '' : ' class="mj"'}/>`;
  const fs = Math.max(11, Math.min(15, px * 0.42)), txt = (p, t, cls = '') => `<text class="lbl ${cls}" x="${X(p[0])}" y="${Y(p[1])}" font-size="${fs}">${esc(t)}</text>`;

  // Alcance: lo de fuera se apaga; el borde punteado lleva su medida
  let alc = '';
  if (verAlc) {
    const cx = X(YO[0]), cy = Y(YO[1]), r = u(R);
    alc = `<path class="fuera" fill-rule="evenodd" d="M0 0H${u(W)}V${u(H)}H0Z M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z"/>
      <circle class="range" cx="${cx}" cy="${cy}" r="${r}"/>${situa && rArea ? `<circle class="env" cx="${cx}" cy="${cy}" r="${u(env)}"/>` : ''}
      ${txt([YO[0], YO[1] - R - 0.25], `Alcance ${mt(A.alcance)} m`, 'azul')}`;
  }
  const cel = (c, i) => `<rect class="${res.cob[i] > 0.98 ? 'll' : 'pa'}" x="${X(c[0])}" y="${Y(c[1])}" width="${u(1)}" height="${u(1)}" style="--d:${Math.min(320, Math.round(Math.hypot(c[0] + 0.5 - O[0], c[1] + 0.5 - O[1]) * 26))}ms"/>`;
  const parciales = celdas.filter((c, i) => res.cob[i] <= 0.98);
  const rect = c => `<rect x="${X(c[0])}" y="${Y(c[1])}" width="${u(1)}" height="${u(1)}"/>`;

  // Contorno exacto de la plantilla
  let forma = '';
  if (f === 'emanacion') { const r = area.r / CASILLA; forma = `<rect x="${X(-r)}" y="${Y(-r)}" width="${u(1 + 2 * r)}" height="${u(1 + 2 * r)}" rx="${u(r)}"/>`; }
  else if (f === 'esfera' || f === 'cilindro') forma = `<circle cx="${X(O[0])}" cy="${Y(O[1])}" r="${u(area.r / CASILLA)}"/>`;
  else if (f === 'cono') { const L = area.largo / CASILLA, e = [O[0] + ux * L, O[1] + uy * L]; forma = `<polygon points="${P(O)} ${P([e[0] - uy * L / 2, e[1] + ux * L / 2])} ${P([e[0] + uy * L / 2, e[1] - ux * L / 2])}"/>`; }
  else if (f === 'linea') { const L = area.largo / CASILLA, w = area.ancho / CASILLA / 2, e = [O[0] + ux * L, O[1] + uy * L]; forma = `<polygon points="${P([O[0] - uy * w, O[1] + ux * w])} ${P([e[0] - uy * w, e[1] + ux * w])} ${P([e[0] + uy * w, e[1] - ux * w])} ${P([O[0] + uy * w, O[1] - ux * w])}"/>`; }
  else if (f === 'cubo') { const L = area.lado / CASILLA / 2; forma = `<polygon points="${[[L, L], [L, -L], [-L, -L], [-L, L]].map(([a, b]) => P([O[0] + a * ux - b * uy, O[1] + a * uy + b * ux])).join(' ')}"/>`; }

  // Cota con la medida principal, en la dirección en que el área se aleja del lanzador
  const cota = (a, b, t) => {
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / n, ny = (b[0] - a[0]) / n, tk = 0.18, off = fs / px * 0.9;
    const m = [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off];
    return `<g class="cota"><line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}"/>${[a, b].map(p => `<line x1="${X(p[0] - nx * tk)}" y1="${Y(p[1] - ny * tk)}" x2="${X(p[0] + nx * tk)}" y2="${Y(p[1] + ny * tk)}"/>`).join('')}${txt(m, t)}</g>`;
  };
  const lejos = Math.hypot(O[0] - YO[0], O[1] - YO[1]), va = lejos > 0.6 ? [(O[0] - YO[0]) / lejos, (O[1] - YO[1]) / lejos] : [ux, uy];
  let medida = '';
  if (f === 'esfera' || f === 'cilindro') { const r = area.r / CASILLA; medida = cota(O, [O[0] + va[0] * r, O[1] + va[1] * r], `radio ${mt(area.r)} m`); }
  else if (f === 'emanacion') { const r = area.r / CASILLA; medida = cota([1, 0.5], [1 + r, 0.5], `${mt(area.r)} m`); }
  else if (f === 'cono' || f === 'linea') { const L = area.largo / CASILLA; medida = cota(O, [O[0] + ux * L, O[1] + uy * L], `${mt(area.largo)} m`); }
  else if (f === 'cubo') { const L = area.lado / CASILLA / 2, s = L + 0.45; medida = cota([O[0] - ux * L + uy * s, O[1] - uy * L - ux * s], [O[0] + ux * L + uy * s, O[1] + uy * L - ux * s], `${mt(area.lado)} m`); }

  // Punto de origen y, al colocarlo, la distancia hasta el lanzador
  const pr = Math.max(3.5, px * 0.14);
  let origen = '';
  if (situa || f === 'esfera' || f === 'cilindro') {
    if (situa && lejos > 0.6) origen += `<g class="dist"><line x1="${X(YO[0])}" y1="${Y(YO[1])}" x2="${X(O[0])}" y2="${Y(O[1])}"/>${txt([(YO[0] + O[0]) / 2 - va[1] * fs / px * 0.9, (YO[1] + O[1]) / 2 + va[0] * fs / px * 0.9], `a ${mt(lejos * CASILLA)} m`, 'azul')}</g>`;
    if (situa && px < 18) origen += `<circle class="foco" cx="${X(O[0])}" cy="${Y(O[1])}" r="${u(rArea + 1.2)}"/>`;
    origen += `<g class="pt"><circle cx="${X(O[0])}" cy="${Y(O[1])}" r="${pr * 2.2}"/><circle class="c" cx="${X(O[0])}" cy="${Y(O[1])}" r="${pr}"/></g>`;
  }
  const retrato = ch?.retrato?.src, tr = Math.max(px * 0.46, 10), tc = [X(YO[0]), Y(YO[1])];
  const token = `<rect class="yo" x="${X(0)}" y="${Y(0)}" width="${u(1)}" height="${u(1)}"/><g class="tok"><circle cx="${tc[0]}" cy="${tc[1]}" r="${tr}"/>${retrato ? `<clipPath id="arClip"><circle cx="${tc[0]}" cy="${tc[1]}" r="${tr * 0.9}"/></clipPath><image href="${esc(retrato)}" x="${tc[0] - tr * 0.9}" y="${tc[1] - tr * 0.9}" width="${tr * 1.8}" height="${tr * 1.8}" clip-path="url(#arClip)" preserveAspectRatio="xMidYMid slice"/>` : `<text class="tu" x="${tc[0]}" y="${tc[1]}" font-size="${tr * 0.78}">Tú</text>`}</g>`;

  const svg = $('#arSvg'), interactivo = situa || GIRAN.includes(f);
  svg.style.width = `${u(W)}px`; svg.style.height = `${u(H)}px`; svg.setAttribute('viewBox', `0 0 ${u(W)} ${u(H)}`);
  svg.setAttribute('aria-label', `${describir(area)}: ${celdas.length} casillas afectadas${situa ? `, centro a ${mt(lejos * CASILLA)} m de ti` : ''}`);
  if (interactivo) svg.setAttribute('tabindex', '0'); else svg.removeAttribute('tabindex');
  svg.classList.toggle('anim', A.anim); svg.classList.toggle('mano', interactivo); svg.classList.toggle('arrastre', situa);
  svg.innerHTML = `<defs><pattern id="arRay" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6"/></pattern></defs>
    <g class="grid">${g}</g>${alc}<g class="fant">${fant.map(rect).join('')}</g><g class="roces">${roces.map(rect).join('')}</g>
    <g class="cells">${celdas.map(cel).join('')}</g><g class="rayas">${parciales.map(rect).join('')}</g>
    <g class="shape">${forma}</g>${token}${medida}${origen}`;
  A.anim = false;

  // Cabecera con el recuento y los datos que importan para decidir
  const enteras = celdas.length - parciales.length, rumbo = RUMBOS[Math.round(A.dir / 45) % 8];
  $('#arMeta').innerHTML = `<div class="ar-cnt"><b>${celdas.length}</b><span>casillas afectadas${parciales.length && enteras ? `<small>${enteras} ${enteras === 1 ? 'entera' : 'enteras'} · ${parciales.length} a más de la mitad</small>` : ''}</span></div>
    <div class="ar-datos"><span>1 casilla = 1,5 m</span>${A.alcance ? `<span>Alcance ${mt(A.alcance)} m · ${casillas(A.alcance)} casillas</span>` : `<span>Alcance: ${esc(A.s.alcance || '—')}</span>`}${situa ? `<span class="az">Centro a ${mt(lejos * CASILLA)} m de ti</span>` : ''}</div>`;
  const rb = $('#arRumbo'); if (rb) { rb.innerHTML = `<i style="--g:${A.dir}deg" aria-hidden="true">→</i>${rumbo[1]}`; rb.title = `Apunta hacia el ${rumbo[1]}`; }
  const tl = $('#arTodasL'); if (tl) tl.hidden = situa;
  const gd = $('#arGiro'); if (gd) gd.hidden = situa && f !== 'cubo';

  const ley = [enteras && ['ll', `Entera${parciales.length ? ` (${enteras})` : ''}`], parciales.length && ['pa', `Más de la mitad (${parciales.length})`], roces.length && ['ro', `Solo la roza, no cuenta (${roces.length})`],
    ['yo', 'Tú'], fant.length && ['fa', 'Otras direcciones posibles'], verAlc && ['al', 'Alcance'], situa && rArea && ['en', 'Hasta donde puede llegar el efecto']].filter(Boolean);
  $('#arLey').innerHTML = ley.map(([c, t]) => `<li><i class="sw ${c}" aria-hidden="true"></i>${t}</li>`).join('');
  $('#arNota').textContent = [situa ? 'Toca o arrastra en la cuadrícula para colocar el centro dentro del alcance (o muévelo con las flechas del teclado).'
    : f === 'emanacion' ? 'La emanación se extiende desde los bordes de la criatura y se mueve con ella; tu casilla no cuenta.'
    : DESDE_TI.includes(f) ? 'El área sale del borde del lanzador: toca la cuadrícula hacia donde quieras apuntarla o gírala con ⟲ ⟳.'
    : `El centro del área está en una intersección de la cuadrícula; toca hacia dónde ponerla o gírala.${R ? ' Activa «Colocar dentro del alcance» para llevarla a cualquier punto.' : ''}`,
    'Una casilla cuenta si el área cubre al menos la mitad.'].join(' ');

  if (A.centrar) { A.centrar = false; const c = situa ? O : [(Math.min(...celdas.map(p => p[0])) + Math.max(...celdas.map(p => p[0])) + 1) / 2, (Math.min(...celdas.map(p => p[1])) + Math.max(...celdas.map(p => p[1])) + 1) / 2];
    wrap.scrollTo({ left: X(c[0]) - wrap.clientWidth / 2, top: Y(c[1]) - wrap.clientHeight / 2 }); }
}
// Punto de la cuadrícula bajo el puntero
function punto(e) {
  const r = $('#arSvg').getBoundingClientRect();
  return [(e.clientX - r.left) / A.px + A.x0, (e.clientY - r.top) / A.px + A.y0];
}
function tocar(e) {
  const p = punto(e), f = A.area.forma;
  if (A.conAlcance && A.alcance && SITUABLES.includes(f)) { A.pt = p; pintar(); return; }
  if (!GIRAN.includes(f)) return;
  const v = [p[0] - YO[0], p[1] - YO[1]]; if (Math.abs(v[0]) < 0.5 && Math.abs(v[1]) < 0.5) return;
  const dir = (Math.round(Math.atan2(v[1], v[0]) * 180 / Math.PI / 45) * 45 + 360) % 360;
  if (dir !== A.dir) { A.dir = dir; A.anim = true; pintar(); }
}
export function init(store) {
  S = store;
  on($('#arBody'), 'click', '[data-ar]', (e, b) => {
    const a = b.dataset.ar;
    if (a === 'izq' || a === 'der') { A.dir = (A.dir + (a === 'izq' ? 315 : 45)) % 360; A.anim = true; }
    if (a === 'mas') A.zoom = Math.min(4, A.zoom * 1.3); if (a === 'menos') A.zoom = Math.max(0.4, A.zoom / 1.3); if (a === 'ajustar') A.zoom = 1;
    if (['mas', 'menos', 'ajustar'].includes(a)) A.centrar = true;
    pintar();
  });
  $('#arBody').addEventListener('change', e => {
    if (e.target.id === 'arAlc') { A.conAlcance = e.target.checked; A.pt = null; A.zoom = 1; A.anim = true; A.centrar = true; pintar(); }
    if (e.target.id === 'arTodas') { A.todas = e.target.checked; pintar(); }
  });
  // Tocar apunta o coloca; con ratón, además, se puede arrastrar el área para colocarla
  $('#arBody').addEventListener('click', e => { if (e.target.closest('#arSvg') && !A.arrastrado) tocar(e); A.arrastrado = false; });
  $('#arBody').addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0 && e.target.closest('#arSvg.arrastre')) { A.drag = true; A.arrastrado = false; } });
  addEventListener('pointermove', e => { if (A?.drag && dlg().open) { A.arrastrado = true; tocar(e); } });
  addEventListener('pointerup', () => { if (A?.drag) { A.drag = false; if (A.arrastrado) setTimeout(() => { A.arrastrado = false; }); } });
  $('#arBody').addEventListener('keydown', e => {
    if (e.target.id !== 'arSvg') return;
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!k) return;
    e.preventDefault();
    if (A.conAlcance && A.alcance && SITUABLES.includes(A.area.forma)) A.pt = [A.pt[0] + k[0], A.pt[1] + k[1]];
    else if (GIRAN.includes(A.area.forma)) { A.dir = (A.dir + (k[0] + k[1] > 0 ? 45 : 315)) % 360; A.anim = true; }
    pintar();
  });
  addEventListener('resize', () => { if (A && dlg().open) pintar(); });
}
export { avatarHtml };
