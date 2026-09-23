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
import './styles/tokens.css';
import './styles/base.css';
import './styles/sheet.css';
import './styles/dialogs.css';
import './styles/motion.css';
import './styles/extras.css';

import { createStore } from './core/store.js';
import { fromStored } from './domain/modelo.js';
import { linkCatalog, loadSrd } from './domain/catalogo.js';
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
import { tour } from './ui/tour.js';

const KEY = 'grimorio-v2', KEY_V1 = 'theo-grimorio-v1', PREF = 'theo-grimorio-v1';
const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

async function boot() {
  const theme = await storage.get(PREF + '-theme');
  if (theme) document.documentElement.dataset.theme = theme;
  setBars(eventos.isDark());

  const [v2, v1] = await Promise.all([storage.get(KEY), storage.get(KEY_V1)]);
  const { db, migrated } = fromStored(v2, v1);
  const S = createStore({ storage, key: KEY, db });
  S.subscribe(() => { renderBar(S); renderSheet(S); });

  const startEditing = () => { if (!S.editing) { S.editing = true; S.emit('ui'); } };
  personajes.init(S, { onNewCharacterAddSpells: () => { startEditing(); buscador.openPicker(''); } });
  buscador.init(S, { startEditing });
  conjuro.init(S); nivel.init(S); rasgos.init(S); historial.init(S); copia.init(S); manual.init(S); tiradas.init(S); glos.init(); retrato.init(S); trasfondo.init(S); diario.init(S); area.init(S);
  const app = await eventos.init(S);

  // Tutoriales: portada y hoja (una vez cada uno; se repiten desde Más → Ver tutorial)
  const TOUR_INICIO = [
    { titulo: 'Bienvenido al grimorio', texto: 'Tu libro de conjuros para D&amp;D 2024: espacios, preparados, rasgos de clase, tiradas y descripciones del manual, en el móvil o en el PC.' },
    { sel: '.l-grid, .l-empty', titulo: 'Tus personajes', texto: 'Cada tarjeta lleva el color y el emblema de su clase. Toca una para abrir su hoja.' },
    { sel: '[data-lcmd="nuevo"]', titulo: 'Crear un personaje', texto: 'Nombre, clase, subclase, nivel y características: la app calcula CD, ataque, espacios, preparados y recursos con las reglas de 2024.' },
    { sel: '[data-lcmd="manual"]', titulo: 'Tu manual, dentro', texto: 'Elige el PDF de tu Manual del Jugador y la app leerá en tu dispositivo las descripciones de los 391 conjuros y el glosario de reglas.' },
  ];
  const TOUR_HOJA = [
    { sel: '#sbar', titulo: 'Espacios de conjuro', texto: 'Cada círculo lleno es un espacio libre. Tócalo para gastarlo o recuperarlo. El número de la izquierda te lleva a ese nivel.' },
    { sel: '.spell[id] .castzone', titulo: 'Lanzar', texto: '<b>Toca</b> un conjuro para lanzarlo: gasta el espacio adecuado, marca la concentración y te ofrece <b>Tirar</b>. <b>Mantén pulsado</b> para leerlo y elegir nivel o ritual.' },
    { sel: '.spell[id] .prep:not(.none):not(.always), .spell[id] .prep', titulo: 'Preparados', texto: 'El rombo marca los conjuros preparados. En dorado, los que están siempre preparados.' },
    { sel: '.hero-av', titulo: 'Tu personaje', texto: 'Toca el retrato para añadir o reencuadrar una imagen. En <b>Historia</b> tienes su trasfondo con índice y búsqueda, y en <b>Diario</b> las notas de cada sesión: lo subrayado aparece en la hoja para recordarlo.' },
    { sel: '#res .resources', titulo: 'Rasgos y recursos', texto: 'Los recursos de tu clase y subclase se cuentan aquí y se recuperan solos con los descansos.' },
    { sel: '#dRest, #bRest', titulo: 'Descansar', texto: 'Descanso corto o largo: la app restaura lo que corresponde según tu clase.' },
    { sel: '#dEdit, #bEdit', titulo: 'Editar y añadir', texto: 'En modo edición cambias textos y añades conjuros desde el catálogo o el compendio de 391 conjuros.' },
    { sel: '#dHist, #bHist', titulo: 'Historial', texto: 'Todo lo que lances, gastes o tires queda anotado, y puedes deshacer varios pasos.' },
    { sel: '#btnMore', titulo: 'Más opciones', texto: 'Glosario de reglas, manual, copia de seguridad, tema de día o de noche y este tutorial.' },
    { sel: '#whoChip', titulo: 'Volver al inicio', texto: 'Desde aquí vuelves a la portada para cambiar de personaje.' },
  ];
  const tourHoja = forzar => setTimeout(() => tour('hoja', TOUR_HOJA, { forzar }), 450);
  landing.init(S, {
    cmd: c => ({ nuevo: () => app.run('newchar'), copia: () => app.run('backup'), manual: () => app.run('manual'), gestionar: () => app.run('chars'), tutorial: () => tour('inicio', TOUR_INICIO, { forzar: true }) }[c]?.()),
    onOpen: () => tourHoja(false),
    onShow: () => setTimeout(() => tour('inicio', TOUR_INICIO), 500),
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
    const [ok] = await Promise.all([loadSrd(fuente), manual.cargarManualGuardado(), glos.cargarGlosarioGuardado()]);
    if (ok && linkCatalog(S.db)) S.save();
    S.emit('srd');
  });
}
boot();
