/**
 * Fondo vivo: una escena animada por clase y subclase, pintada en un único lienzo fijo detrás de la hoja.
 *
 *   astral  · adivino, mago, estrellas, luna  → estrellas que titilan, constelaciones que se trazan, fugaces
 *   ascuas  · evocador, hechicero, dracónica, bárbaro, infernal → brasas que suben
 *   vacío   · brujo, aberrante, sombra, pícaro → niebla lenta y motas que derivan
 *   halo    · clérigo, paladín, luz, vida, celestial → rayos de luz y polvo dorado
 *   arboleda· druida, explorador, tierra, feérico → luciérnagas y alguna hoja
 *   canción · bardo → notas que flotan sobre un pentagrama ondulante
 *   calma   · monje → ondas de tinta que se expanden
 *   forja   · guerrero, mecánica → chispas que saltan del yunque
 *   guarda  · abjurador → retícula hexagonal que late
 *   prisma  · ilusionista, salvaje → pompas irisadas
 *   (cada subclase del Manual y de Héroes de Faerûn tiene su escena en ESCENA, según su emblema)
 *
 * Coste: ~30 fps, sprites precalculados (sin gradientes por partícula y fotograma), se detiene con la app
 * en segundo plano o con una hoja a pantalla completa. «Reducir movimiento» pinta un único fotograma quieto.
 */
import { tinteDe } from '../domain/paleta.js';
import { reducedMotion } from './fx.js';

const ESCENA = {
  adivino: 'astral', mago: 'astral', estrellas: 'astral', luna: 'astral', libro: 'astral', lunabardo: 'astral', conocimiento: 'astral', invernal: 'astral',
  evocador: 'ascuas', hechicero: 'ascuas', draconica: 'ascuas', barbaro: 'ascuas', infernal: 'ascuas', berserker: 'ascuas', fuegomagico: 'ascuas', elementos: 'ascuas', venganza: 'ascuas',
  brujo: 'vacio', aberrante: 'vacio', sombra: 'vacio', picaro: 'vacio', primigenio: 'vacio', engano: 'vacio', acechador: 'vacio', psionico: 'vacio',
  asesino: 'vacio', ladron: 'vacio', rebanaalmas: 'vacio', vastago: 'vacio',
  clerigo: 'halo', luz: 'halo', celestial: 'halo', paladin: 'halo', vida: 'halo', fanatico: 'halo', abanderado: 'halo', entrega: 'halo', gloria: 'halo',
  druida: 'arboleda', explorador: 'arboleda', tierra: 'arboleda', feerico: 'arboleda', arbol: 'arboleda', corazon: 'arboleda', cazador: 'arboleda',
  errante: 'arboleda', bestias: 'arboleda', antiguos: 'arboleda',
  bardo: 'cancion', danza: 'cancion', saber: 'cancion', glamour: 'cancion', valor: 'cancion',
  monje: 'calma', manoabierta: 'calma', misericordia: 'calma', mar: 'calma',
  guerrero: 'forja', mecanica: 'forja', guerra: 'forja', campeon: 'forja', maestro: 'forja',
  abjurador: 'guarda', caballero: 'guarda', ilusionista: 'prisma', salvaje: 'prisma', hojacantante: 'prisma', genios: 'prisma', embaucador: 'prisma',
};
export const escenaDe = t => ESCENA[t?.icono] || ESCENA[t?.clase] || 'astral';

let cv, ctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, acc = 0;
let E = { nombre: '', h: 40, s: 78, dark: true, ps: [], t: 0, extra: {} };
const rnd = (a, b) => a + Math.random() * (b - a);
const oscuro = () => {
  const r = document.documentElement;
  return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

/* ---------- sprites de brillo (uno por color, reutilizados) ---------- */
const sprites = new Map();
function glow(h, s, l, a = 1) {
  const k = `${h|0}|${s|0}|${l|0}|${a}`;
  if (sprites.has(k)) return sprites.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `hsla(${h},${s}%,${Math.min(96, l + 28)}%,${a})`);
  gr.addColorStop(.22, `hsla(${h},${s}%,${l}%,${a * .7})`);
  gr.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  if (sprites.size > 60) sprites.clear();
  sprites.set(k, c); return c;
}
const dot = (spr, x, y, r, a) => { ctx.globalAlpha = a; ctx.drawImage(spr, x - r, y - r, r * 2, r * 2); };

/* ---------- escenas: cada una tiene semilla (s) y paso (p) ---------- */
const densidad = base => Math.round(base * Math.min(2.2, Math.max(.6, (W * H) / (390 * 844))));
const L = () => (E.dark ? 62 : 38);   // luminosidad del acento según tema

const ESCENAS = {
  astral: {
    s() {
      E.ps = Array.from({ length: densidad(90) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.4, 1.5), f: rnd(0, 6.28), v: rnd(.4, 1.6), oro: Math.random() < .14 }));
      E.extra = { cons: [], fug: null, prox: 3 };
    },
    p(dt) {
      const { h, s } = E, l = L(), ink = E.dark ? [225, 30, 88] : [h, 45, 58];
      const sOro = glow(h, s, l), sBla = glow(ink[0], ink[1], ink[2]);
      for (const p of E.ps) {
        p.f += dt * p.v; const a = E.dark ? .35 + Math.sin(p.f) * .25 : .1 + Math.sin(p.f) * .08;
        dot(p.oro ? sOro : sBla, p.x, p.y, p.r * (p.oro ? 7 : 4) * (E.dark ? 1 : .8), Math.max(0, a));
      }
      // constelaciones: se trazan, brillan y se desvanecen
      const X = E.extra;
      X.prox -= dt;
      if (X.prox <= 0 && X.cons.length < 2) {
        const c = E.ps[(Math.random() * E.ps.length) | 0], cerca = E.ps.filter(q => q !== c && Math.hypot(q.x - c.x, q.y - c.y) < 170).slice(0, 5);
        if (cerca.length >= 3) X.cons.push({ pts: [c, ...cerca.sort((a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x))], t: 0 });
        X.prox = rnd(3, 6);
      }
      ctx.lineWidth = .8; ctx.strokeStyle = `hsl(${h} ${s}% ${l}%)`;
      X.cons = X.cons.filter(c => (c.t += dt) < 9);
      for (const c of X.cons) {
        const trazo = Math.min(1, c.t / 2.6), vida = c.t < 6 ? 1 : 1 - (c.t - 6) / 3, n = c.pts.length - 1, hasta = trazo * n;
        ctx.globalAlpha = (E.dark ? .38 : .26) * vida; ctx.beginPath(); ctx.moveTo(c.pts[0].x, c.pts[0].y);
        for (let i = 1; i <= Math.ceil(hasta); i++) {
          const a = c.pts[i - 1], b = c.pts[i], k = Math.min(1, hasta - (i - 1));
          ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
        }
        ctx.stroke();
        c.pts.forEach((q, i) => i <= hasta && dot(sOro, q.x, q.y, 6, .8 * vida));
      }
      // estrella fugaz de vez en cuando
      if (!X.fug && Math.random() < dt * .08) X.fug = { x: rnd(W * .2, W), y: rnd(0, H * .4), vx: -rnd(380, 560), vy: rnd(140, 220), t: 0 };
      if (X.fug) {
        const f = X.fug; f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt;
        const g = ctx.createLinearGradient(f.x, f.y, f.x - f.vx * .18, f.y - f.vy * .18);
        g.addColorStop(0, `hsla(${h},${s}%,${l + 20}%,.9)`); g.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
        ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1); ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.vx * .18, f.y - f.vy * .18); ctx.stroke();
        if (f.t > 1.1) X.fug = null;
      }
    },
  },
  ascuas: {
    s() { E.ps = Array.from({ length: densidad(46) }, () => nuevaAscua(true)); },
    p(dt) {
      for (const p of E.ps) {
        p.t += dt; p.y -= p.v * dt; p.x += Math.sin(p.t * p.w + p.f) * 18 * dt;
        const vida = 1 - p.t / p.max;
        if (vida <= 0 || p.y < -20) Object.assign(p, nuevaAscua(false));
        dot(glow(E.h + p.dh, E.s, L()), p.x, p.y, p.r * 6, Math.max(0, vida) * (E.dark ? .8 : .45) * Math.min(1, p.t * 2));
      }
    },
  },
  vacio: {
    s() {
      E.ps = Array.from({ length: densidad(34) }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-8, 8), vy: rnd(-8, 8), r: rnd(1, 2.4), f: rnd(0, 6) }));
      E.extra = { nubes: Array.from({ length: 5 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(160, 320), vx: rnd(-6, 6), vy: rnd(-4, 4) })) };
    },
    p(dt) {
      const l = L(), neb = glow(E.h, E.s * .7, E.dark ? 30 : 60, .5);
      for (const n of E.extra.nubes) {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < -n.r) n.x = W + n.r; if (n.x > W + n.r) n.x = -n.r; if (n.y < -n.r) n.y = H + n.r; if (n.y > H + n.r) n.y = -n.r;
        dot(neb, n.x, n.y, n.r, E.dark ? .5 : .28);
      }
      const spr = glow(E.h, E.s, l);
      for (const p of E.ps) {
        p.f += dt; p.x = (p.x + p.vx * dt + W) % W; p.y = (p.y + p.vy * dt + H) % H;
        dot(spr, p.x, p.y, p.r * 5, (.25 + .25 * Math.sin(p.f * 1.3)) * (E.dark ? 1 : .7));
      }
    },
  },
  halo: {
    s() { E.ps = Array.from({ length: densidad(40) }, () => ({ x: rnd(0, W), y: rnd(0, H), v: rnd(6, 18), r: rnd(.8, 2), f: rnd(0, 6) })); },
    p(dt) {
      E.t += dt;
      const { h, s } = E, l = L(), ox = W * .5, oy = -H * .08, n = 7;
      for (let i = 0; i < n; i++) {
        const ang = Math.PI / 2 + (i - (n - 1) / 2) * .16 + Math.sin(E.t * .12 + i) * .05, len = H * 1.25, wid = .035 + (i % 3) * .012;
        const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
        g.addColorStop(0, `hsla(${h},${s}%,${l + 10}%,${E.dark ? .16 : .2})`); g.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
        ctx.globalAlpha = .55 + .45 * Math.sin(E.t * .4 + i * 1.7); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang - wid) * len, oy + Math.sin(ang - wid) * len); ctx.lineTo(ox + Math.cos(ang + wid) * len, oy + Math.sin(ang + wid) * len); ctx.fill();
      }
      const spr = glow(h, s, l);
      for (const p of E.ps) {
        p.f += dt; p.y += p.v * dt; p.x += Math.sin(p.f * .8) * 6 * dt; if (p.y > H + 10) { p.y = -10; p.x = rnd(0, W); }
        dot(spr, p.x, p.y, p.r * 5, (.3 + .3 * Math.sin(p.f * 2)) * (E.dark ? 1 : .7));
      }
    },
  },
  arboleda: {
    s() {
      E.ps = Array.from({ length: densidad(26) }, () => ({ x: rnd(0, W), y: rnd(H * .2, H), a: rnd(0, 6.28), v: rnd(10, 26), f: rnd(0, 6), r: rnd(1.4, 2.4) }));
      E.extra = { hojas: Array.from({ length: densidad(6) }, () => nuevaHoja(true)) };
    },
    p(dt) {
      const spr = glow(E.h + 10, Math.min(90, E.s + 20), E.dark ? 64 : 40);
      for (const p of E.ps) {
        p.a += rnd(-1.4, 1.4) * dt; p.f += dt * 1.6;
        p.x += Math.cos(p.a) * p.v * dt; p.y += Math.sin(p.a) * p.v * dt;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const pulso = Math.max(0, Math.sin(p.f)); dot(spr, p.x, p.y, p.r * 7, (.12 + pulso * .7) * (E.dark ? 1 : .6));
      }
      ctx.fillStyle = `hsl(${E.h} ${E.s * .6}% ${E.dark ? 42 : 45}%)`;
      for (const f of E.extra.hojas) {
        f.t += dt; f.y += f.v * dt; f.x += Math.sin(f.t * .9 + f.f) * 22 * dt; f.rot += f.vr * dt;
        if (f.y > H + 20) Object.assign(f, nuevaHoja(false));
        ctx.save(); ctx.globalAlpha = E.dark ? .28 : .22; ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.scale(1, Math.abs(Math.cos(f.t * 1.4)) * .8 + .2);
        ctx.beginPath(); ctx.ellipse(0, 0, f.r, f.r * .45, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
    },
  },
  cancion: {
    s() { E.ps = Array.from({ length: densidad(16) }, () => nuevaNota(true)); },
    p(dt) {
      E.t += dt;
      const { h, s } = E, l = L();
      ctx.strokeStyle = `hsl(${h} ${s}% ${l}%)`; ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        ctx.globalAlpha = E.dark ? .09 : .08; ctx.beginPath();
        const base = H * .62 + k * 11;
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, base + Math.sin(x * .008 + E.t * .5) * 34 + Math.sin(x * .021 - E.t * .3) * 10);
        ctx.stroke();
      }
      ctx.fillStyle = `hsl(${h} ${s}% ${l + 6}%)`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const p of E.ps) {
        p.t += dt; p.y -= p.v * dt; p.x += Math.sin(p.t * 1.1 + p.f) * 16 * dt;
        const vida = 1 - p.t / p.max; if (vida <= 0) { Object.assign(p, nuevaNota(false)); continue; }
        ctx.globalAlpha = Math.min(1, p.t) * vida * (E.dark ? .55 : .4);
        ctx.font = `${p.size}px Georgia, serif`; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.t + p.f) * .25); ctx.fillText(p.g, 0, 0); ctx.restore();
      }
    },
  },
  calma: {
    s() { E.ps = []; E.extra = { prox: .3, petalos: Array.from({ length: densidad(8) }, () => nuevaHoja(true)) }; },
    p(dt) {
      const X = E.extra, { h, s } = E, l = L();
      X.prox -= dt; if (X.prox <= 0) { E.ps.push({ x: rnd(0, W), y: rnd(H * .1, H * .95), t: 0, max: rnd(6, 9), R: rnd(90, 190) }); X.prox = rnd(1.8, 3.2); }
      ctx.strokeStyle = `hsl(${h} ${s}% ${l}%)`;
      E.ps = E.ps.filter(p => (p.t += dt) < p.max);
      for (const p of E.ps) {
        const k = p.t / p.max;
        for (let j = 0; j < 3; j++) {
          const kk = k - j * .09; if (kk <= 0) continue;
          ctx.globalAlpha = (1 - kk) * (E.dark ? .3 : .22); ctx.lineWidth = 1.4 - j * .35;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.R * kk, p.R * kk * .42, 0, 0, 6.283); ctx.stroke();
        }
      }
      ctx.fillStyle = `hsl(${(h + 330) % 360} 55% ${E.dark ? 70 : 55}%)`;
      for (const f of X.petalos) {
        f.t += dt; f.y += f.v * .6 * dt; f.x += Math.sin(f.t * .7 + f.f) * 16 * dt; f.rot += f.vr * dt;
        if (f.y > H + 20) Object.assign(f, nuevaHoja(false));
        ctx.save(); ctx.globalAlpha = E.dark ? .3 : .28; ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, f.r * .7, f.r * .4, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
    },
  },
  forja: {
    s() { E.ps = []; E.extra = { prox: .2 }; },
    p(dt) {
      const X = E.extra;
      X.prox -= dt;
      if (X.prox <= 0) {
        const ox = Math.random() < .5 ? rnd(W * .05, W * .3) : rnd(W * .7, W * .95), n = (rnd(10, 22)) | 0;
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + rnd(-.6, .6), v = rnd(220, 520); E.ps.push({ x: ox, y: H + 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, max: rnd(.9, 1.8) }); }
        X.prox = rnd(1.2, 2.6);
      }
      ctx.lineCap = 'round';
      E.ps = E.ps.filter(p => (p.t += dt) < p.max);
      for (const p of E.ps) {
        const px = p.x, py = p.y; p.vy += 520 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt;
        const vida = 1 - p.t / p.max;
        ctx.globalAlpha = vida * (E.dark ? .85 : .55); ctx.strokeStyle = `hsl(${32 + vida * 14} 95% ${E.dark ? 50 + vida * 30 : 45}%)`;
        ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      dot(glow(28, 90, E.dark ? 40 : 55, .6), W * .5, H + 60, W * .7, E.dark ? .22 : .12);
    },
  },
  guarda: {
    s() {
      const r = 34, hx = r * Math.sqrt(3), cells = [];
      for (let y = -r, fila = 0; y < H + r; y += r * 1.5, fila++) for (let x = (fila % 2) * hx / 2 - hx; x < W + hx; x += hx) cells.push({ x, y, a: 0 });
      E.ps = cells; E.extra = { r, prox: 0, anillo: 0 };
    },
    p(dt) {
      const X = E.extra, { h, s } = E, l = L(), r = X.r;
      X.prox -= dt; if (X.prox <= 0) { for (let i = 0; i < 3; i++) E.ps[(Math.random() * E.ps.length) | 0].a = 1; X.prox = rnd(.4, 1); }
      X.anillo = (X.anillo + dt * .09) % 1.4;
      const cx = W * .5, cy = H * .38, R = X.anillo * Math.hypot(W, H);
      ctx.strokeStyle = `hsl(${h} ${s}% ${l}%)`; ctx.lineWidth = 1;
      for (const c of E.ps) {
        const d = Math.abs(Math.hypot(c.x - cx, c.y - cy) - R), onda = Math.max(0, 1 - d / 90);
        c.a = Math.max(0, c.a - dt * .45);
        ctx.globalAlpha = (E.dark ? .05 : .05) + (c.a * .4 + onda * .18) * (E.dark ? 1 : .75);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; ctx.lineTo(c.x + Math.cos(an) * (r - 2), c.y + Math.sin(an) * (r - 2)); }
        ctx.closePath(); ctx.stroke();
      }
    },
  },
  prisma: {
    s() { E.ps = Array.from({ length: densidad(14) }, () => nuevaPompa(true)); },
    p(dt) {
      E.t += dt;
      for (const p of E.ps) {
        p.t += dt; p.y -= p.v * dt; p.x += Math.sin(p.t * .6 + p.f) * 14 * dt;
        if (p.y < -p.r * 2) Object.assign(p, nuevaPompa(false));
        const hue = (E.h + p.dh + E.t * 30) % 360, a = Math.min(1, p.t) * (E.dark ? .26 : .22);
        ctx.globalAlpha = a; ctx.lineWidth = 1.2;
        const g = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
        g.addColorStop(0, `hsl(${hue} 80% ${E.dark ? 70 : 45}%)`); g.addColorStop(.5, `hsl(${(hue + 90) % 360} 80% ${E.dark ? 70 : 45}%)`); g.addColorStop(1, `hsl(${(hue + 200) % 360} 80% ${E.dark ? 70 : 45}%)`);
        ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke();
        dot(glow(hue, 60, E.dark ? 85 : 60), p.x - p.r * .35, p.y - p.r * .4, p.r * .35, a * 1.4);
      }
    },
  },
};
function nuevaAscua(inicio) { return { x: rnd(0, W), y: inicio ? rnd(0, H) : H + rnd(0, 40), v: rnd(22, 60), r: rnd(.8, 2.2), t: inicio ? rnd(0, 4) : 0, max: rnd(6, 12), w: rnd(.6, 1.6), f: rnd(0, 6), dh: rnd(-12, 12) }; }
function nuevaHoja(inicio) { return { x: rnd(0, W), y: inicio ? rnd(0, H) : -20, v: rnd(14, 30), r: rnd(5, 9), rot: rnd(0, 6), vr: rnd(-1, 1), t: 0, f: rnd(0, 6) }; }
function nuevaNota(inicio) { return { x: rnd(W * .05, W * .95), y: inicio ? rnd(H * .3, H) : H + 20, v: rnd(16, 34), g: '♪♫♩♬'[(Math.random() * 4) | 0], size: rnd(16, 30) | 0, t: inicio ? rnd(0, 6) : 0, max: rnd(14, 22), f: rnd(0, 6) }; }
function nuevaPompa(inicio) { return { x: rnd(0, W), y: inicio ? rnd(0, H) : H + 40, v: rnd(8, 20), r: rnd(10, 34), t: 0, f: rnd(0, 6), dh: rnd(0, 120) }; }

/* ---------- lienzo y bucle ---------- */
function tamano() {
  dpr = Math.min(1.5, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ESCENAS[E.nombre]?.s(); pintar(0);
}
function tapado() {
  // una hoja alta en el móvil cubre la pantalla: no hace falta pintar detrás
  return innerWidth < 700 && !!document.querySelector('dialog.tall[open]');
}
function pintar(dt) {
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = E.dark ? 'lighter' : 'source-over';
  ESCENAS[E.nombre]?.p(dt);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function bucle(t) {
  raf = requestAnimationFrame(bucle);
  const dt = Math.min(.1, (t - (last || t)) / 1000); last = t; acc += dt;
  if (acc < 1 / 30 || document.hidden || tapado()) return;   // ~30 fps es de sobra para un fondo
  pintar(acc); acc = 0;
}
function arrancar() {
  cancelAnimationFrame(raf); raf = 0; last = 0;
  if (reducedMotion()) { pintar(0); return; }
  raf = requestAnimationFrame(bucle);
}

/** Cambia la escena (idempotente: solo reinicia si cambia clase, tono o tema). */
export function setEscena(t) {
  if (!cv) return;
  // las partículas se apagan como la estructura en los tonos que se perciben más intensos (rojos, magentas)
  const nombre = escenaDe(t), dark = oscuro(), h = t?.h ?? 220, s = Math.round((t?.s ?? 8) * (0.45 + 0.55 * tinteDe(h)));
  if (nombre === E.nombre && h === E.h && dark === E.dark) return;
  const cambiaEscena = nombre !== E.nombre;
  Object.assign(E, { nombre, h, s, dark });
  document.documentElement.dataset.escena = nombre;
  if (cambiaEscena) { E.t = 0; ESCENAS[nombre].s(); cv.classList.remove('in'); void cv.offsetWidth; cv.classList.add('in'); }
  arrancar();
}
export function initFondo() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.className = 'fondo-vivo'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv); ctx = cv.getContext('2d');
  addEventListener('resize', () => { clearTimeout(tamano.t); tamano.t = setTimeout(tamano, 120); });
  tamano();
  const re = () => { const n = E.nombre; E.nombre = ''; setEscena({ h: E.h, s: E.s, icono: Object.keys(ESCENA).find(k => ESCENA[k] === n) }); };
  new MutationObserver(re).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', re); } catch { /* antiguos */ }
  try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', arrancar); } catch { /* antiguos */ }
}
