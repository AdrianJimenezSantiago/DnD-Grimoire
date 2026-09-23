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
  conjuro.init(S); nivel.init(S); rasgos.init(S); historial.init(S); copia.init(S); manual.init(S);
  const app = await eventos.init(S);

  S.emit('boot');
  if (migrated) S.save();
  document.documentElement.classList.add('ready');

  onAppEvents({ back: app.back, pause: () => S.flush(), resume: app.resume });
  addEventListener('pagehide', () => S.flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') S.flush(); });

  // El compendio (≈330 kB) y las descripciones importadas se cargan cuando el navegador está libre
  idle(async () => {
    const [ok] = await Promise.all([loadSrd('data/compendio.json'), manual.cargarManualGuardado()]);
    if (ok && linkCatalog(S.db)) S.save();
    S.emit('srd');
  });
}
boot();
