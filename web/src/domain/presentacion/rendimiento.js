// Calidad de los efectos visuales, sin DOM: nivel de partida según el equipo, veredicto de una muestra de fotogramas y
// el ajuste con histéresis que decide cuándo bajar o subir. La usa ui/animaciones/calidad.js.
export const NIVELES = ['bajo', 'medio', 'alto'];
export const BAJO = 0;
export const MEDIO = 1;
export const ALTO = 2;

const GPU_BAJA = /swiftshader|llvmpipe|software|softpipe|mali-(4\d\d|t\d|g(31|51|52|57))\b|powervr|vivante|videocore|adreno[^\d]*([1-5]\d\d|6[01]\d)(?!\d)/i;
const GPU_ALTA = /apple|adreno[^\d]*(6[4-9]\d|[7-9]\d\d)(?!\d)|mali-g(7\d|7\d\d|9\d\d)\b|immortalis|xclipse|nvidia|geforce|radeon|iris|intel.*arc/i;
export const gamaGpu = nombre => !nombre ? null : GPU_BAJA.test(nombre) ? 'baja' : GPU_ALTA.test(nombre) ? 'alta' : 'media';

export function nivelPorEquipo({ memoria, nucleos, pixeles, gpu, tactil = true } = {}) {
  const gama = gamaGpu(gpu);
  if (gama === 'baja' && /swiftshader|llvmpipe|software|softpipe/i.test(gpu)) return BAJO;
  let p = 0;
  if (memoria) p += memoria <= 2 ? -2 : memoria < 4 ? -1 : memoria >= 8 ? 1 : 0;
  if (nucleos) p += nucleos <= 4 ? -1 : nucleos >= 8 ? 1 : 0;
  if (gama) p += { baja: -2, media: 0, alta: 1 }[gama];
  if (pixeles > 3.5e6) p -= 1;
  if (!tactil) p += 1;
  return p <= -3 ? BAJO : p <= 0 ? MEDIO : ALTO;
}

export function veredicto(intervalos) {
  if (!intervalos || intervalos.length < 20) return null;
  const orden = [...intervalos].sort((a, b) => a - b), periodo = orden[orden.length >> 1];
  const perdidos = intervalos.filter(x => x > periodo * 1.5).length / intervalos.length;
  const tirones = intervalos.filter(x => x > 70).length / intervalos.length;
  if (periodo > 45 || perdidos > 0.2 || tirones > 0.05) return 'mal';
  return perdidos < 0.05 && tirones === 0 ? 'bien' : 'justo';
}

export const PARA_BAJAR = 2;
export const PARA_SUBIR = 6;
export const FALLOS_MAX = 2;
export const estadoInicial = (nivel, fallos = {}) => ({ nivel, malas: 0, buenas: 0, fallos: { ...fallos } });

export function ajustar(e, v, techo = ALTO) {
  const s = { ...e, fallos: { ...e.fallos } };
  if (s.nivel > techo) return { ...s, nivel: techo, malas: 0, buenas: 0 };
  if (v === 'mal') {
    s.malas++; s.buenas = 0;
    if (s.malas >= PARA_BAJAR && s.nivel > BAJO) { s.fallos[s.nivel] = (s.fallos[s.nivel] || 0) + 1; s.nivel--; s.malas = 0; }
  } else if (v === 'bien') {
    s.buenas++; s.malas = 0;
    const sube = s.nivel + 1, fallos = s.fallos[sube] || 0;
    if (sube <= techo && fallos < FALLOS_MAX && s.buenas >= PARA_SUBIR * (1 + fallos)) { s.nivel = sube; s.buenas = 0; }
  } else if (v === 'justo') { s.malas = 0; s.buenas = 0; }
  return s;
}
