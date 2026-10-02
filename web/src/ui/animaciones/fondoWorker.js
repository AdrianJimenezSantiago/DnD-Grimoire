// Worker del fondo animado: recibe el OffscreenCanvas y las órdenes de fondo.js, y dibuja fuera del hilo principal.
import * as motor from './fondoMotor.js';

self.onmessage = ({ data: { op, args = [], lienzo } }) => {
  if (op === 'iniciar') motor.iniciar(lienzo);
  else motor[op]?.(...args);
};
