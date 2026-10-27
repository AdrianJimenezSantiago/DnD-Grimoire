// Geometría del teclado en pantalla, sin DOM: cuánto tapa de la ventana, si está abierto y cuánto hay que desplazar
// un campo para que se vea. La usa ui/componentes/teclado.js con las medidas de visualViewport.

// Alto que el teclado tapa por abajo de la ventana (el «layout viewport», donde viven los elementos fijos). Con zoom de
// pellizco la zona visible encoge por el zoom y no por el teclado, así que no cuenta.
export function tapaTeclado({ alto, vvAlto, vvTop = 0, escala = 1 }) {
  if (!(vvAlto > 0) || Math.abs(escala - 1) > 0.01) return 0;
  return Math.max(0, Math.round(alto - vvAlto - Math.max(0, vvTop)));
}

// Por debajo de esto es una barra de sugerencias o la de un teclado físico, no un teclado en pantalla.
export const UMBRAL_TECLADO = 100;
// Abierto: hay un campo con el foco y la zona útil ha perdido un buen trozo, tapada (Safari, iPad, Chrome sin
// redimensionar) o porque la propia página se ha encogido (app de Android, Chrome con resizes-content). altoBase es el
// alto de la ventana con el teclado cerrado para ese ancho.
export const tecladoAbierto = ({ foco, tapa, alto, altoBase = alto }) =>
  !!foco && (tapa > UMBRAL_TECLADO || altoBase - alto > UMBRAL_TECLADO);

// Cuánto desplazar el contenido (scrollTop += d) para que la caja { arriba, abajo } quede dentro de la zona visible con
// un margen. 0 si ya se ve entera. Si no cabe, manda el principio: la etiqueta y la línea donde se escribe.
export function desplazamiento(caja, zona, { arriba = 12, abajo = 16 } = {}) {
  const tope = zona.arriba + arriba, suelo = zona.abajo - abajo;
  if (caja.arriba >= tope && caja.abajo <= suelo) return 0;
  if (caja.arriba < tope || caja.abajo - caja.arriba > suelo - tope) return Math.round(caja.arriba - tope);
  return Math.round(caja.abajo - suelo);
}

// Reparte un desplazamiento entre contenedores anidados, del más interior al de fuera: cada uno mueve lo que le queda
// de recorrido ({ pos, max }) y el siguiente pone el resto.
export function repartir(d, desplazables) {
  return desplazables.map(({ pos, max }) => {
    const paso = Math.max(-pos, Math.min(Math.max(0, max) - pos, d));
    d -= paso;
    return paso;
  });
}
