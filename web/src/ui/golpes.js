import { burst, reducedMotion } from './fx.js';
import { runaSvg } from './magia.js';

const VARIANTES = { dano: ['tajo', 'garras', 'impacto'], cura: ['brotes', 'ola', 'halo'], temp: ['egida', 'runas'], max: ['auge'], buff: ['destello'], debuff: ['sombra'] };
const ultima = {};
const elegir = tipo => { const vs = VARIANTES[tipo], ops = vs.length > 1 ? vs.filter(v => v !== ultima[tipo]) : vs, v = ops[(Math.random() * ops.length) | 0]; ultima[tipo] = v; return v; };
const rnd = (a, b) => a + Math.random() * (b - a);
const COLOR = { dano: '#FF5A45', cura: '#6EE0A0', temp: '#7FC8FF', max: '#F4D27A', buff: '#F4D27A', debuff: '#B08BE8' };

function svgGolpe(v) {
  if (v === 'tajo') { const a = rnd(-35, 35); return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="transform:rotate(${a}deg)"><path class="gp-trazo" d="M-10 ${rnd(40, 60)} Q 50 ${rnd(30, 70)} 110 ${rnd(40, 60)}" pathLength="1"/></svg>`; }
  if (v === 'garras') { const a = rnd(-25, 25), y = rnd(25, 40); return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="transform:rotate(${a}deg)">${[0, 14, 28].map((d, i) => `<path class="gp-trazo" style="animation-delay:${i * 50}ms" d="M${15 + d} ${y - 20} Q ${35 + d} 50 ${25 + d} ${y + 55}" pathLength="1"/>`).join('')}</svg>`; }
  const cx = rnd(35, 65), cy = rnd(35, 65);
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${Array.from({ length: 7 }, (_, i) => { const ang = (i / 7) * Math.PI * 2 + rnd(-.3, .3), l = rnd(18, 34); return `<path class="gp-trazo fino" d="M${cx} ${cy} L ${cx + Math.cos(ang) * l} ${cy + Math.sin(ang) * l}" pathLength="1"/>`; }).join('')}</svg>`;
}
function capaEn(el, tipo, v, n, etiqueta) {
  const c = document.createElement('div'); c.className = `gp-fx gp-${tipo} gp-${v}`; c.setAttribute('aria-hidden', 'true');
  let h = '';
  if (tipo === 'dano') h = svgGolpe(v);
  if (tipo === 'cura' && v === 'brotes') h = Array.from({ length: 10 }, () => `<i class="gp-mota" style="left:${rnd(8, 92)}%;animation-delay:${rnd(0, 260) | 0}ms;--s:${rnd(.6, 1.3)}"></i>`).join('');
  if (tipo === 'cura' && v === 'ola') h = '<i class="gp-ola"></i>';
  if (tipo === 'cura' && v === 'halo') h = '<i class="gp-halo"></i><i class="gp-halo b"></i>';
  if (tipo === 'temp') h = v === 'egida' ? '<i class="gp-egida"></i><i class="gp-brillo"></i>' : `<span class="gp-runa">${runaSvg({ n: 12, lados: 6, cls: '', semillaInicial: (Math.random() * 99) | 0 })}</span>`;
  if (tipo === 'max') h = '<i class="gp-brillo oro"></i>';
  if (n != null) h += `<b class="gp-num" style="--dx:${rnd(-24, 24) | 0}px;--rot:${rnd(-8, 8) | 0}deg">${etiqueta}</b>`;
  c.innerHTML = h; el.appendChild(c);
  setTimeout(() => c.remove(), 1400);
  return c;
}
function contar(el, desde, hasta) {
  if (!el || desde == null || desde === hasta) return;
  const t0 = performance.now(), dur = 520;
  const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(desde + (hasta - desde) * e); if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

export function golpe(tipo, n = null, { max = 1, desde = null, hasta = null, cae = false } = {}) {
  const dianas = [...document.querySelectorAll('.pg-card, .vd-marcador')].filter(el => el.offsetParent);
  if (tipo === 'buff' || tipo === 'debuff') dianas.push(...[...document.querySelectorAll('.vt-estados')].filter(el => el.offsetParent));
  if (reducedMotion()) return;
  const v = elegir(tipo), ratio = n ? Math.min(1, n / Math.max(1, max)) : 0;
  const nivel = tipo === 'dano' ? (cae || ratio >= .4 ? 'fuerte' : ratio >= .15 ? 'medio' : 'leve') : '';
  const etiqueta = n == null ? null : tipo === 'dano' ? `−${n}` : tipo === 'cura' ? `+${n}` : tipo === 'temp' ? `+${n} temp.` : tipo === 'max' ? `+${n} máx.` : `${n}`;
  for (const el of dianas) {
    el.classList.remove('gp-sacude', 'gp-leve', 'gp-medio', 'gp-fuerte'); void el.offsetWidth;
    if (tipo === 'dano') el.classList.add('gp-sacude', `gp-${nivel}`);
    setTimeout(() => el.classList.remove('gp-sacude', 'gp-leve', 'gp-medio', 'gp-fuerte'), 700);
    capaEn(el, tipo, v, n, etiqueta);
    contar(el.querySelector('.pg-cifra b, .vd-act'), desde, hasta);
    const r = el.getBoundingClientRect(), x = r.left + r.width * rnd(.35, .65), y = r.top + r.height * .5;
    if (tipo === 'dano') burst(x, y, { color: COLOR.dano, n: 8 + Math.round(ratio * 30), speed: 2 + ratio * 4, up: .6, life: 700, size: 1.8, gravity: .05 });
    if (tipo === 'cura') burst(x, r.bottom - 8, { color: COLOR.cura, n: 10 + Math.round(ratio * 16), speed: 1.2, up: 3.2, life: 1100, size: 1.9, gravity: -.04 });
    if (tipo === 'temp') burst(x, y, { color: COLOR.temp, n: 16, speed: 2.4, up: 1, life: 900, size: 1.8, gravity: 0 });
    if (tipo === 'max' || tipo === 'buff') burst(x, y, { color: COLOR.max, n: 14, speed: 2, up: 2, life: 1000, size: 1.8, gravity: -.03 });
    if (tipo === 'debuff') burst(x, y, { color: COLOR.debuff, n: 12, speed: 1.4, up: -.4, life: 900, size: 2.2, gravity: .03 });
  }
}
