// Utilidades compartidas por las pruebas: datos del repositorio y objetos de ejemplo.
import fs from 'node:fs';
import { PREDEFINIDOS } from '../../web/src/domain/equipo/equipo.js';

const RAIZ = new URL('../../', import.meta.url);

export const leerFuente = ruta => fs.readFileSync(new URL(ruta, RAIZ), 'utf8');

export const compendioJson = () => JSON.parse(leerFuente('web/public/data/compendio.json'));

export const arma = nombre => structuredClone(PREDEFINIDOS.find(p => p.nombre === nombre));
