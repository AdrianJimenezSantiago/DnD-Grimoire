/**
 * Arranque. Composición de capas:
 *   dominio (reglas puras) → núcleo (store) → aplicación (casos de uso, controlador) → vista (hoja, diálogos)
 *   plataforma (Capacitor o navegador) se inyecta a través del adaptador.
 */
import '@fontsource/alegreya/latin-400.css';
import '@fontsource/alegreya/latin-500.css';
import '@fontsource/alegreya/latin-700.css';
import '@fontsource/alegreya/latin-400-italic.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-500.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@fontsource/cinzel/latin-500.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cinzel-decorative/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sheet.css';
import './styles/dialogs.css';
import './styles/motion.css';
import './styles/extras.css';
import './styles/biblioteca.css';
import './styles/arcano.css';

import { createStore } from './core/store.js';
import { fromStored } from './domain/modelo.js';
import { compendio, linkCatalog, loadSrd } from './domain/catalogo.js';
import { hayPruebas, sembrarPruebas } from './domain/pruebas.js';
import { toast } from './ui/toast.js';
import { undoBtn } from './app/acciones.js';
import { confirmar } from './ui/modal.js';
import { libros } from './domain/catalogo.js';
import { storage, setBars, onAppEvents } from './platform/native.js';
import { renderBar, renderSheet } from './ui/sheet.js';
import * as eventos from './app/eventos.js';
import * as personajes from './ui/dialogs/personajes.js';
import * as buscador from './ui/dialogs/buscador.js';
import * as conjuro from './ui/dialogs/conjuro.js';
import * as nivel from './ui/dialogs/nivel.js';
import * as rasgos from './ui/dialogs/rasgos.js';
import * as historial from './ui/dialogs/historial.js';
import * as copia from './ui/dialogs/copia.js';
import * as manual from './ui/dialogs/manual.js';
import * as tiradas from './ui/dialogs/tiradas.js';
import * as glos from './ui/dialogs/glosario.js';
import * as landing from './ui/landing.js';
import * as retrato from './ui/dialogs/retrato.js';
import * as trasfondo from './ui/dialogs/trasfondo.js';
import * as diario from './ui/dialogs/diario.js';
import * as area from './ui/dialogs/area.js';
import * as biblioteca from './ui/dialogs/biblioteca.js';
import * as equipo from './ui/dialogs/equipo.js';
import * as formas from './ui/dialogs/formas.js';
import { tour } from './ui/tour.js';
import { initFondo } from './ui/fondo.js';
import { initMagia } from './ui/magia.js';

const KEY = 'grimorio-v2', KEY_V1 = 'theo-grimorio-v1', PREF = 'theo-grimorio-v1';
// Personajes de prueba (uno por subclase, nivel 8): en todas las compilaciones se crean con «Revisar clases de prueba» en la portada;
// fuera de main (web/vite.config.js) se crean además solos al arrancar
const PRUEBAS = typeof __PERSONAJES_PRUEBA__ !== 'undefined' && __PERSONAJES_PRUEBA__;
const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

async function boot() {
  const theme = await storage.get(PREF + '-theme');
  if (theme) document.documentElement.dataset.theme = theme;
  setBars(eventos.isDark());
  initFondo(); initMagia();

  const [v2, v1] = await Promise.all([storage.get(KEY), storage.get(KEY_V1)]);
  const { db, migrated } = fromStored(v2, v1);
  const S = createStore({ storage, key: KEY, db });
  S.subscribe(() => { renderBar(S); renderSheet(S); });

  const startEditing = () => { if (!S.editing) { S.editing = true; S.emit('ui'); } };
  personajes.init(S, { onNewCharacterAddSpells: () => { startEditing(); buscador.openPicker(''); } });
  buscador.init(S, { startEditing });
  conjuro.init(S); nivel.init(S); rasgos.init(S); historial.init(S); copia.init(S); manual.init(S); tiradas.init(S); glos.init(); retrato.init(S); trasfondo.init(S); diario.init(S); area.init(S); biblioteca.init(S); equipo.init(S); formas.init(S);
  const app = await eventos.init(S);

  // Tutoriales: portada y hoja (una vez cada uno; se repiten desde Más → Ver tutorial)
  const TOUR_INICIO = [
    { titulo: 'Bienvenido al grimorio', texto: 'Tu libro de conjuros para D&amp;D 2024: espacios, preparados, rasgos de clase, tiradas y descripciones del manual, en el móvil o en el PC.' },
    { sel: '.l-grid, .l-empty', titulo: 'Tus personajes', texto: 'Cada tarjeta lleva el color y el emblema de su clase. Toca una para abrir su hoja.' },
    { sel: '[data-lcmd="nuevo"]', titulo: 'Crear un personaje', texto: 'Nombre, clase, subclase, nivel y características: la app calcula CD, ataque, espacios, preparados y recursos con las reglas de 2024.' },
    { sel: '[data-lcmd="manual"]', titulo: 'Tus libros, dentro', texto: 'Importa el PDF de tu Manual del Jugador, de la Guía del DM o de una expansión: la app lee en tu dispositivo conjuros, reglas, objetos mágicos, dotes, trasfondos y subclases.' },
    { sel: '[data-lcmd="biblioteca"]', titulo: 'Biblioteca', texto: 'Todo lo importado en un sitio: reglas con tablas, objetos mágicos con filtros por rareza y tipo, dotes, trasfondos y subclases nivel a nivel.' },
  ];
  const TOUR_HOJA = [
    { sel: '#sbar', titulo: 'Espacios de conjuro', texto: 'Cada círculo lleno es un espacio libre. Tócalo para gastarlo o recuperarlo. El número de la izquierda te lleva a ese nivel.' },
    { sel: '.spell[id] .castzone', titulo: 'Lanzar', texto: '<b>Toca</b> un conjuro para lanzarlo: gasta el espacio adecuado, marca la concentración y te ofrece <b>Tirar</b>. <b>Mantén pulsado</b> para leerlo y elegir nivel o ritual.' },
    { sel: '.spell[id] .prep:not(.none):not(.always), .spell[id] .prep', titulo: 'Preparados', texto: 'El rombo marca los conjuros preparados. En dorado, los que están siempre preparados.' },
    { sel: '.hero-av', titulo: 'Tu personaje', texto: 'Toca el retrato para añadir o reencuadrar una imagen. En <b>Historia</b> tienes su trasfondo con índice y búsqueda, y en <b>Diario</b> las notas de cada sesión y su <b>bestiario</b>: lo que sabéis de cada criatura.' },
    { sel: '[data-cmd="equipo"]', titulo: 'Objetos mágicos', texto: 'Sus objetos, con los tres huecos de sintonización. Las cargas aparecen en la hoja como un recurso más y se recuperan solas al amanecer.' },
    { sel: '#res .resources', titulo: 'Rasgos y recursos', texto: 'Los recursos de tu clase y subclase se cuentan aquí y se recuperan solos con los descansos.' },
    { sel: '#dRest, #bRest', titulo: 'Descansar', texto: 'Descanso corto o largo: la app restaura lo que corresponde según tu clase.' },
    { sel: '#dEdit, #bEdit', titulo: 'Editar y añadir', texto: 'En modo edición cambias textos y añades conjuros desde el catálogo o el compendio de 391 conjuros.' },
    { sel: '#dHist, #bHist', titulo: 'Historial', texto: 'Todo lo que lances, gastes o tires queda anotado, y puedes deshacer varios pasos.' },
    { sel: '#btnMore', titulo: 'Más opciones', texto: 'Biblioteca, libros, bestiario, copia de seguridad, tema de día o de noche y este tutorial.' },
    { sel: '#whoChip', titulo: 'Volver al inicio', texto: 'Desde aquí vuelves a la portada para cambiar de personaje.' },
  ];
  // Primer arranque: tras el tutorial de la portada, y antes de empezar, la app ofrece importar los libros (una sola vez)
  const OFRECIDO = 'grimorio-libros-ofrecido';
  let listos; const librosListos = new Promise(r => { listos = r; });
  const ofrecerLibros = async () => {
    await librosListos;
    if (libros().length || (await storage.get(OFRECIDO)) === '1') return;
    await storage.set(OFRECIDO, '1');
    const si = await confirmar({ titulo: '¿Importamos tus libros ahora?', icono: 'book', ok: 'Importar libros', cancelar: 'Más tarde',
      texto: 'La app rellena descripciones de conjuros, reglas, objetos mágicos, dotes, trasfondos, subclases y perfiles de criaturas con tus PDF: Manual del Jugador, Guía del DM, Manual de Monstruos (con texto) y expansiones. Se leen en este dispositivo y no salen de él. Puedes hacerlo luego desde Libros y manuales.' });
    if (si) app.run('manual');
  };
  const tourHoja = forzar => setTimeout(() => tour('hoja', TOUR_HOJA, { forzar }), 450);
  const regenerarPruebas = () => {
    const habia = hayPruebas(S.db); let r; const h = S.edit(db => { r = sembrarPruebas(db, compendio()); });
    toast(r.creados ? `${r.creados} personajes de prueba ${habia ? 'regenerados' : 'creados'} a nivel 8.` : 'El compendio aún no ha cargado; inténtalo en un momento.', r.creados ? [undoBtn(S, h)] : []);
  };
  const quitarPruebas = () => {
    const n = S.db.chars.filter(c => c.prueba).length; if (!n) return;
    const h = S.edit(db => { db.chars = db.chars.filter(c => !c.prueba); if (!db.chars.some(c => c.id === db.activeId)) db.activeId = db.chars[0]?.id ?? null; });
    toast(`${n} personajes de prueba quitados. Tus personajes no se tocan.`, [undoBtn(S, h)]);
  };
  landing.init(S, {
    pruebasAuto: PRUEBAS,
    cmd: c => ({ pruebas: regenerarPruebas, quitarPruebas, nuevo: () => app.run('newchar'), copia: () => app.run('backup'), manual: () => app.run('manual'), biblioteca: () => app.run('biblioteca'), gestionar: () => app.run('chars'), tutorial: () => tour('inicio', TOUR_INICIO, { forzar: true }) }[c]?.()),
    onOpen: () => tourHoja(false),
    onShow: () => setTimeout(() => tour('inicio', TOUR_INICIO, { alTerminar: () => setTimeout(ofrecerLibros, 250) }), 500),
  });
  app.COMMANDS._tutorial = () => (document.body.classList.contains('on-landing') ? tour('inicio', TOUR_INICIO, { forzar: true }) : tourHoja(true));
  // al crear un personaje (desde la portada o la lista) se abre su hoja
  document.addEventListener('grimorio:creado', () => { if (landing.landingVisible()) landing.hideLanding(); tourHoja(false); });
  document.addEventListener('grimorio:abierto', () => { if (landing.landingVisible()) landing.hideLanding(); });

  S.emit('boot');
  landing.showLanding();
  if (migrated) S.save();
  document.documentElement.classList.add('ready');

  onAppEvents({ back: app.back, pause: () => S.flush(), resume: app.resume });
  addEventListener('pagehide', () => S.flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') S.flush(); });

  // El compendio (≈330 kB) y las descripciones importadas se cargan cuando el navegador está libre
  idle(async () => {
    // En el archivo único de Windows no se puede leer otro archivo del disco: el compendio va incluido
    const fuente = import.meta.env.MODE === 'windows' ? import('../public/data/compendio.json').then(m => m.default) : 'data/compendio.json';
    const ok = await loadSrd(fuente);
    await manual.cargarLibros();              // libros importados: textos, conjuros nuevos, glosario, subclases
    listos();
    if (ok && PRUEBAS && !hayPruebas(S.db) && sembrarPruebas(S.db, compendio()).creados) S.save();   // rama de desarrollo: personajes de prueba
    if (ok && linkCatalog(S.db)) S.save();
    S.emit('srd');
  });
}
boot();
