// Geometría del teclado en pantalla, sin DOM: cuánto tapa, si está abierto y cuánto desplazar un campo para que se vea.
export function tapaTeclado({ alto, vvAlto, vvTop = 0, escala = 1 }) {
  if (!(vvAlto > 0) || Math.abs(escala - 1) > 0.01) return 0;
  return Math.max(0, Math.round(alto - vvAlto - Math.max(0, vvTop)));
}

export const UMBRAL_TECLADO = 100;
export const tecladoAbierto = ({ foco, tapa, alto, altoBase = alto }) =>
  !!foco && (tapa > UMBRAL_TECLADO || altoBase - alto > UMBRAL_TECLADO);

export function desplazamiento(caja, zona, { arriba = 12, abajo = 16 } = {}) {
  const tope = zona.arriba + arriba, suelo = zona.abajo - abajo;
  if (caja.arriba >= tope && caja.abajo <= suelo) return 0;
  if (caja.arriba < tope || caja.abajo - caja.arriba > suelo - tope) return Math.round(caja.arriba - tope);
  return Math.round(caja.abajo - suelo);
}

export function repartir(d, desplazables) {
  return desplazables.map(({ pos, max }) => {
    const paso = Math.max(-pos, Math.min(Math.max(0, max) - pos, d));
    d -= paso;
    return paso;
  });
}
