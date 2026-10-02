// Animación de un golpe que se recibe o se cura, con el color y la forma del tipo de daño.
import { burst, reducedMotion, alFrente } from './fx.js';
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
function capaEn(el, tipo, v, n, etiqueta, nivel) {
  const c = document.createElement('div'); c.className = `gp-fx gp-${tipo} gp-${v} ${nivel ? `gp-n-${nivel}` : ''}`; c.setAttribute('aria-hidden', 'true');
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

function pantalla(tipo, etiqueta, lema, fuerte) {
  const el = document.createElement('div'); el.className = `gp-pantalla gp-p-${tipo} ${fuerte ? 'epico' : 'suave'}`; el.setAttribute('aria-hidden', 'true');
  let h = '<i class="gp-p-velo"></i>';
  if (fuerte && tipo === 'dano') { const a = rnd(-20, 20); h += `<svg class="gp-p-grietas" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style="transform:rotate(${a}deg)">${[0, 1, 2].map(i => `<path class="gp-trazo" style="animation-delay:${i * 60}ms" d="M${30 + i * 13} 8 Q ${46 + i * 13} 48 ${38 + i * 13} 92" pathLength="1"/>`).join('')}</svg>`; }
  if (fuerte && tipo === 'cura') h += Array.from({ length: 26 }, () => `<i class="gp-mota" style="left:${rnd(2, 98)}%;animation-delay:${rnd(0, 700) | 0}ms;--s:${rnd(.8, 1.8)};--h:${rnd(40, 75) | 0}vh"></i>`).join('') + '<i class="gp-halo"></i><i class="gp-halo b"></i><i class="gp-halo c"></i>';
  if (fuerte) h += `<div class="gp-p-centro"><b class="gp-p-num">${etiqueta}</b><span class="gp-p-lema">${lema}</span></div>`;
  el.innerHTML = h; document.body.appendChild(el); alFrente(el);
  if (fuerte) {
    const sh = document.getElementById('sheet');
    if (tipo === 'dano' && sh) { sh.classList.remove('gp-terremoto'); void sh.offsetWidth; sh.classList.add('gp-terremoto'); setTimeout(() => sh.classList.remove('gp-terremoto'), 900); }
    const x = innerWidth / 2, y = innerHeight * .45;
    setTimeout(() => burst(x, y, tipo === 'dano' ? { color: COLOR.dano, n: 60, speed: 6.5, up: .8, life: 1100, size: 2.6, gravity: .08 } : { color: '#F4D27A', n: 46, speed: 3.5, up: 2.6, life: 1500, size: 2.2, gravity: -.03 }), 120);
  }
  setTimeout(() => el.remove(), fuerte ? 2200 : 900);
}

export function golpe(tipo, n = null, { max = 1, desde = null, hasta = null, cae = false } = {}) {
  const dianas = [...document.querySelectorAll('.pg-card, .cb-orbe, .vd-marcador')].filter(el => el.offsetParent);
  if (tipo === 'buff' || tipo === 'debuff') dianas.push(...[...document.querySelectorAll('.vt-estados')].filter(el => el.offsetParent));
  if (reducedMotion()) return;
  const v = elegir(tipo), ratio = n ? Math.min(1, n / Math.max(1, max)) : 0;
  const nivel = tipo === 'dano' ? (cae || ratio >= .5 ? 'brutal' : ratio >= .3 ? 'fuerte' : ratio >= .15 ? 'medio' : 'leve')
    : tipo === 'cura' ? (ratio >= .5 ? 'plena' : ratio >= .25 ? 'media' : 'suave') : '';
  const etiqueta = n == null ? null : tipo === 'dano' ? `−${n}` : tipo === 'cura' ? `+${n}` : tipo === 'temp' ? `+${n} temp.` : tipo === 'max' ? `+${n} máx.` : `${n}`;
  for (const el of dianas) {
    el.classList.remove('gp-sacude', 'gp-leve', 'gp-medio', 'gp-fuerte', 'gp-brutal'); void el.offsetWidth;
    if (tipo === 'dano') el.classList.add('gp-sacude', `gp-${nivel}`);
    setTimeout(() => el.classList.remove('gp-sacude', 'gp-leve', 'gp-medio', 'gp-fuerte', 'gp-brutal'), 800);
    capaEn(el, tipo, v, n, etiqueta, nivel);
    contar(el.querySelector('.pg-cifra b, .vd-act'), desde, hasta);
    const r = el.getBoundingClientRect(), x = r.left + r.width * rnd(.35, .65), y = r.top + r.height * .5;
    if (tipo === 'dano') burst(x, y, { color: COLOR.dano, n: 8 + Math.round(ratio * 40), speed: 2 + ratio * 5, up: .6, life: 700 + ratio * 400, size: 1.8 + ratio, gravity: .05 });
    if (tipo === 'cura') burst(x, r.bottom - 8, { color: COLOR.cura, n: 10 + Math.round(ratio * 30), speed: 1.2 + ratio, up: 3.2 + ratio * 2, life: 1100 + ratio * 500, size: 1.9 + ratio * .8, gravity: -.04 });
    if (tipo === 'temp') burst(x, y, { color: COLOR.temp, n: 16, speed: 2.4, up: 1, life: 900, size: 1.8, gravity: 0 });
    if (tipo === 'max' || tipo === 'buff') burst(x, y, { color: COLOR.max, n: 14, speed: 2, up: 2, life: 1000, size: 1.8, gravity: -.03 });
    if (tipo === 'debuff') burst(x, y, { color: COLOR.debuff, n: 12, speed: 1.4, up: -.4, life: 900, size: 2.2, gravity: .03 });
  }
  if (n == null) return;
  if (tipo === 'dano' && (nivel === 'brutal' || nivel === 'fuerte')) pantalla('dano', etiqueta, cae ? 'Caes al suelo' : n >= max ? 'Golpe demoledor' : 'Golpe devastador', nivel === 'brutal');
  if (tipo === 'cura' && (nivel === 'plena' || nivel === 'media')) pantalla('cura', etiqueta, hasta != null && hasta >= max ? 'Recuperas todas tus fuerzas' : 'Gran curación', nivel === 'plena');
}
