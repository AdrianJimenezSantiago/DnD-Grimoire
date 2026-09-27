// Los asistentes de creación de personaje y de subir de nivel son lo más pesado del código y se abren de vez en cuando:
// van en su propio trozo, que se carga la primera vez que hacen falta (o antes, en un momento libre, con precargar()).
let S = null, opciones = {};
const perezoso = (cargar, iniciar) => { let p = null; return () => (p ||= cargar().then(m => { iniciar(m); return m; })); };
const personajes = perezoso(() => import('../ui/dialogs/personajes.js'), m => m.init(S, opciones));
const nivel = perezoso(() => import('../ui/dialogs/nivel.js'), m => m.init(S));

export function configurar(store, opts = {}) { S = store; opciones = opts; }
export const openChars = (...a) => personajes().then(m => m.openChars(...a));
export const openCharForm = (...a) => personajes().then(m => m.openCharForm(...a));
export const openLevelUp = (...a) => nivel().then(m => m.openLevelUp(...a));
export const precargar = () => Promise.all([personajes(), nivel()]).catch(() => {});
