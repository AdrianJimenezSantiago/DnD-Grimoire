// Utilidades compartidas por las pruebas: datos del repositorio y objetos de ejemplo.
import fs from 'node:fs';
import { PREDEFINIDOS } from '../../web/src/domain/equipo/equipo.js';

const RAIZ = new URL('../../', import.meta.url);

/** Contenido de un archivo del repositorio como texto (ruta relativa a la raíz). */
export const leerFuente = ruta => fs.readFileSync(new URL(ruta, RAIZ), 'utf8');

/** Compendio de conjuros del SRD tal como lo sirve la app (web/public/data/compendio.json). */
export const compendioJson = () => JSON.parse(leerFuente('web/public/data/compendio.json'));

/** Copia de un arma, armadura u objeto del equipo predefinido, lista para modificar sin tocar el original. */
export const arma = nombre => structuredClone(PREDEFINIDOS.find(p => p.nombre === nombre));
