// Arranque de la app: estilos y fuentes, carga de los datos guardados, creación del store, inicio de cada diálogo,
// tutoriales y carga en segundo plano del compendio y de los libros importados.
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
import './styles/juego.css';
import './styles/placas.css';
import './styles/portada.css';
import './styles/dados.css';
import './styles/creacion.css';
import './styles/inventario.css';
import './styles/impacto.css';
import './styles/codice.css';
import './styles/movil.css';

import { crearEstado } from './core/store.js';
import { cargarGuardado } from './domain/personaje/modelo.js';
import { compendio, enlazarCatalogo, cargarCompendio } from './domain/conjuros/catalogo.js';
import { libros } from './domain/libros/biblioteca.js';
import { hayPruebas, sembrarPruebas } from './domain/personaje/pruebas.js';
import { toast, botonDeshacer } from './ui/componentes/toast.js';
import { esc } from './core/util.js';
import { confirmar } from './ui/componentes/modal.js';
import { almacen, fijarBarras, alEventosApp, NATIVO } from './platform/native.js';
import { pintarBarra, pintarHoja } from './ui/pantallas/hoja.js';
import * as eventos from './app/eventos.js';
import * as asistentes from './app/asistentes.js';
import * as buscador from './ui/dialogs/buscador.js';
import * as conjuro from './ui/dialogs/conjuro.js';
import * as rasgos from './ui/dialogs/rasgos.js';
import * as historial from './ui/dialogs/historial.js';
import * as copia from './ui/dialogs/copia.js';
import * as manual from './ui/dialogs/manual.js';
import * as tiradas from './ui/dialogs/tiradas.js';
import * as glos from './ui/dialogs/glosario.js';
import * as portada from './ui/pantallas/portada.js';
import * as retrato from './ui/dialogs/retrato.js';
import * as trasfondo from './ui/dialogs/trasfondo.js';
import * as diario from './ui/dialogs/diario.js';
import * as area from './ui/dialogs/area.js';
import * as biblioteca from './ui/dialogs/biblioteca.js';
import * as equipo from './ui/dialogs/equipo.js';
import * as formas from './ui/dialogs/formas.js';
import * as vida from './ui/dialogs/vida.js';
import * as efectosDlg from './ui/dialogs/efectos.js';
import * as objetivosDlg from './ui/dialogs/objetivos.js';
import * as dados from './ui/dialogs/dados.js';
import * as buscar from './ui/dialogs/buscar.js';
import * as elegir from './ui/dialogs/elegir.js';
import * as aviso from './ui/dialogs/aviso.js';
import { tour } from './ui/componentes/tour.js';
import { initFondo } from './ui/animaciones/fondo.js';
import { initMagia } from './ui/animaciones/magia.js';

const KEY = 'grimorio-v2', KEY_V1 = 'theo-grimorio-v1', PREF = 'theo-grimorio-v1';
const PRUEBAS = typeof __PERSONAJES_PRUEBA__ !== 'undefined' && __PERSONAJES_PRUEBA__;
const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

async function boot() {
  const theme = await almacen.get(PREF + '-tema');
  almacen.remove(PREF + '-theme');
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  fijarBarras(eventos.esOscuro());
  initFondo(); initMagia();

  const [v2, v1] = await Promise.all([almacen.get(KEY), almacen.get(KEY_V1)]);
  const { db, migrated } = cargarGuardado(v2, v1);
  const S = crearEstado({ almacen, clave: KEY, db });
  S.subscribe(() => { pintarBarra(S); pintarHoja(S); });

  const startEditing = () => { if (!S.editing) { S.editing = true; S.emit('ui'); } };
  asistentes.configurar(S, { onNewCharacterAddSpells: () => { startEditing(); buscador.abrirBuscador(''); } });
  buscador.init(S, { startEditing });
  conjuro.init(S); rasgos.init(S); historial.init(S); copia.init(S); manual.init(S); tiradas.init(S); glos.init(); retrato.init(S); trasfondo.init(S); diario.init(S); area.init(S); biblioteca.init(S); equipo.init(S); formas.init(S); vida.init(S); efectosDlg.init(S); objetivosDlg.init(S); dados.init(S); buscar.init(S); elegir.init(); aviso.init();
  const app = await eventos.init(S);

  const TOUR_INICIO = [
    { titulo: 'Bienvenido al grimorio', texto: 'Tu compañero de mesa para D&amp;D 2024: hoja de personaje, libro de conjuros, modo combate, dados, diario de campaña y las descripciones de tus manuales, en el móvil o en el PC.' },
    { sel: '.l-rueda', titulo: 'La rueda de clases', texto: 'Las doce clases, cada una con su color y su emblema. Toca una para crear un personaje que ya empiece con ella.' },
    { sel: '.l-grid, .l-empty', titulo: 'Tus personajes', texto: 'Cada tarjeta lleva el color y el emblema de su clase. Toca una para abrir su hoja.' },
    { sel: '[data-lcmd="nuevo"]', titulo: 'Crear un personaje', texto: 'Nombre, clase, subclase, nivel y características: la app calcula CD, ataque, espacios, preparados y recursos con las reglas de 2024.' },
    { sel: '[data-lcmd="manual"]', titulo: 'Tus libros, dentro', texto: 'Importa el PDF de tu Manual del Jugador, de la Guía del DM o de una expansión: la app lee en tu dispositivo conjuros, reglas, objetos mágicos, dotes, trasfondos y subclases.' },
    { sel: '[data-lcmd="biblioteca"]', titulo: 'Biblioteca', texto: 'Todo lo importado en un sitio: reglas con tablas, objetos mágicos con filtros por rareza y tipo, dotes, trasfondos y subclases nivel a nivel.' },
  ];
  const TOUR_HOJA = [
    { sel: '#sbar', titulo: 'Espacios de conjuro', texto: 'Cada círculo lleno es un espacio libre. Tócalo para gastarlo o recuperarlo. El número de la izquierda te lleva a ese nivel.' },
    { sel: '.spell[id] .castzone', titulo: 'Lanzar', texto: '<b>Toca</b> un conjuro para lanzarlo: gasta el espacio adecuado, marca la concentración y te ofrece <b>Tirar</b>. <b>Mantén pulsado</b> para leerlo y elegir nivel o ritual.' },
    { sel: '.spell[id] .prep:not(.none):not(.always), .spell[id] .prep', titulo: 'Preparados', texto: 'El rombo marca los conjuros preparados. En dorado, los que están siempre preparados.' },
    { sel: '#vitales .pg-card', titulo: 'Puntos de golpe', texto: 'Toca aquí para anotar daño, curación y puntos de golpe temporales, gastar dados de golpe o tirar salvaciones contra muerte. Si estás concentrado, la app te dice la CD para mantenerlo.' },
    { sel: '#vitales .vt-estados', titulo: 'Estados', texto: 'Envenenado, derribado, agotamiento o inspiración heroica: márcalos aquí y la hoja los tiene en cuenta (el agotamiento resta a tus tiradas y a tu velocidad).' },
    { sel: '#caracs .cr-grid', titulo: 'Características', texto: 'Cada característica con su salvación y sus habilidades, ya calculadas con tu competencia y tus pericias. <b>Toca</b> cualquiera para tirarla.' },
    { sel: '.hero-av', titulo: 'Tu personaje', texto: 'Toca el retrato para añadir o reencuadrar una imagen. En <b>Historia</b> tienes su trasfondo con índice y búsqueda, y en <b>Diario</b> las notas de cada sesión y su <b>bestiario</b>: lo que sabéis de cada criatura.' },
    { sel: '[data-cmd="equipo"]', titulo: 'Inventario', texto: 'Todo lo que lleva: armas con su ataque y daño, armadura con su CA, equipo, consumibles, comida, tesoro y monedas, con el peso y la carga. Los objetos mágicos traen su sintonización y sus cargas.' },
    { sel: '#res .resources', titulo: 'Rasgos y recursos', texto: 'Los recursos de tu clase y subclase se cuentan aquí y se recuperan solos con los descansos.' },
    { sel: '#dRest, #bRest', titulo: 'Descansar', texto: 'Descanso corto o largo: la app restaura lo que corresponde según tu clase.' },
    { sel: '#dEdit, #bEdit', titulo: 'Editar y añadir', texto: 'En modo edición cambias textos y añades conjuros desde el catálogo o el compendio de 391 conjuros.' },
    { sel: '#dDados, #bDados', titulo: 'Dados', texto: 'Cualquier tirada: suma dados con un toque o escribe «2d6+3», con ventaja o desventaja y las últimas tiradas a mano.' },
    { sel: '#dCombate, #bCombate', titulo: 'Modo combate', texto: 'Una vista solo para la pelea: ronda e iniciativa, lo que has gastado del turno, puntos de golpe, ataques y conjuros ordenados por acción, acción adicional y reacción.' },
    { sel: '#btnBuscar', titulo: 'Buscar', texto: 'Encuentra cualquier cosa del grimorio: conjuros, reglas, objetos, rasgos, inventario o diario. En el ordenador, también con Ctrl+K.' },
    { sel: '#dHist, #btnMore', titulo: 'Historial', texto: 'Todo lo que lances, gastes o tires queda anotado, y puedes deshacer varios pasos. En el ordenador está en el menú.' },
    { sel: '#btnMore', titulo: 'Más opciones', texto: 'Biblioteca, libros, bestiario, copia de seguridad, tema de día o de noche y este tutorial.' },
    { sel: '#whoChip', titulo: 'Cambiar de personaje', texto: 'Desde aquí vuelves a la portada para elegir otro personaje. Allí, «Gestionar personajes» los edita, duplica y borra.' },
  ];
  const OFRECIDO = 'grimorio-libros-ofrecido';
  let listos; const librosListos = new Promise(r => { listos = r; });
  const ofrecerLibros = async () => {
    await librosListos;
    if (libros().length || (await almacen.get(OFRECIDO)) === '1') return;
    await almacen.set(OFRECIDO, '1');
    const si = await confirmar({ titulo: '¿Importamos tus libros ahora?', icono: 'book', ok: 'Importar libros', cancelar: 'Más tarde',
      texto: 'La app rellena descripciones de conjuros, reglas, objetos mágicos, dotes, trasfondos, subclases y perfiles de criaturas con tus PDF: Manual del Jugador, Guía del DM y expansiones. Se leen en este dispositivo y no salen de él. Puedes hacerlo luego desde Libros y manuales.' });
    if (si) app.run('manual');
  };
  const tourHoja = forzar => setTimeout(() => tour('hoja', TOUR_HOJA, { forzar }), 450);
  const regenerarPruebas = () => {
    const habia = hayPruebas(S.db); let r; const h = S.edit(db => { r = sembrarPruebas(db, compendio()); });
    toast(r.creados ? `${r.creados} personajes de prueba ${habia ? 'regenerados' : 'creados'} a nivel 8.` : 'El compendio aún no ha cargado; inténtalo en un momento.', r.creados ? [botonDeshacer(S, h)] : []);
  };
  const quitarPruebas = () => {
    const n = S.db.chars.filter(c => c.prueba).length; if (!n) return;
    const h = S.edit(db => { db.chars = db.chars.filter(c => !c.prueba); if (!db.chars.some(c => c.id === db.activeId)) db.activeId = db.chars[0]?.id ?? null; });
    toast(`${n} personajes de prueba quitados. Tus personajes no se tocan.`, [botonDeshacer(S, h)]);
  };
  portada.init(S, {
    pruebasAuto: PRUEBAS,
    cmd: (c, arg) => ({ pruebas: regenerarPruebas, quitarPruebas, nuevo: () => (arg ? asistentes.abrirCreacion(null, { clase: arg }) : app.run('newchar')), copia: () => app.run('backup'), manual: () => app.run('manual'), biblioteca: () => app.run('biblioteca'), gestionar: () => app.run('chars'), tutorial: () => tour('inicio', TOUR_INICIO, { forzar: true }) }[c]?.()),
    onOpen: () => tourHoja(false),
    onShow: () => setTimeout(() => tour('inicio', TOUR_INICIO, { alTerminar: () => setTimeout(ofrecerLibros, 250) }), 500),
  });
  app.COMMANDS._tutorial = () => (document.body.classList.contains('on-landing') ? tour('inicio', TOUR_INICIO, { forzar: true }) : tourHoja(true));
  document.addEventListener('grimorio:creado', () => { if (portada.portadaVisible()) portada.ocultarPortada(); tourHoja(false); });
  document.addEventListener('grimorio:abierto', () => { if (portada.portadaVisible()) portada.ocultarPortada(); });

  S.emit('boot');
  portada.mostrarPortada();
  if (migrated) S.save();
  document.documentElement.classList.add('ready');

  alEventosApp({ back: app.back, pause: () => S.flush(), resume: app.resume });
  addEventListener('pagehide', () => S.flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') S.flush(); });

  idle(async () => {
    const fuente = import.meta.env.MODE === 'windows' ? import('../public/data/compendio.json').then(m => m.default) : 'data/compendio.json';
    const ok = await cargarCompendio(fuente);
    await manual.cargarLibros();
    const incluidos = ok ? await manual.aplicarIncluidos() : [];
    listos();
    if (incluidos.length) toast(`Libros listos: <b>${incluidos.map(l => esc(l.titulo)).join('</b>, <b>')}</b>.`, [{ label: 'Abrir biblioteca', fn: () => app.run('biblioteca') }]);
    if (ok && PRUEBAS && !hayPruebas(S.db) && sembrarPruebas(S.db, compendio()).creados) S.save();
    if (ok && enlazarCatalogo(S.db)) S.save();
    S.emit('srd');
    idle(asistentes.precargar);
  });
}
// Si el arranque falla, se quita igualmente la pantalla de carga para no tapar la página
boot().catch(e => { document.documentElement.classList.add('ready'); throw e; });

// En la web (no en la app de Android ni en el HTML de Windows) la app se guarda para abrirse sin conexión
if (import.meta.env.PROD && import.meta.env.MODE !== 'windows' && !NATIVO && location.protocol === 'https:' && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
