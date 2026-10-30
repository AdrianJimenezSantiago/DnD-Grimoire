// Puente con la plataforma: Capacitor en Android (preferencias, archivos, vibración, compartir, barras del sistema)
// y las alternativas del navegador en la web y en Windows. Ningún otro módulo importa Capacitor.
import { Capacitor, SystemBars } from '@capacitor/core';
import { crearArchivosWeb, idbKv } from './archivosWeb.js';

export const NATIVO = Capacitor.isNativePlatform();

export const almacen = {
  async get(k) {
    if (NATIVO) { const { Preferences } = await import('@capacitor/preferences'); return (await Preferences.get({ key: k })).value; }
    try { return localStorage.getItem(k); } catch { return null; }
  },
  async guardar(k, v) {
    if (NATIVO) { const { Preferences } = await import('@capacitor/preferences'); return Preferences.set({ key: k, value: v }); }
    localStorage.setItem(k, v);
  },
  async set(k, v) { try { await almacen.guardar(k, v); } catch {} },
  async remove(k) {
    if (NATIVO) { const { Preferences } = await import('@capacitor/preferences'); return Preferences.remove({ key: k }); }
    try { localStorage.removeItem(k); } catch {}
  },
};

export function vibrar(kind = 'light') {
  if (NATIVO) { import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light })).catch(() => {}); return; }
  try { navigator.vibrate?.(kind === 'heavy' ? 24 : 12); } catch {}
}

const tactil = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
export async function compartirArchivo(name, contenido, tipo = 'application/json', titulo = 'Copia del grimorio') {
  if (NATIVO) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const w = await Filesystem.writeFile({ path: name, data: contenido, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: titulo, dialogTitle: 'Guardar en…', files: [w.uri] });
    return;
  }
  const archivo = typeof File === 'function' ? new File([contenido], name, { type: tipo }) : null;
  if (archivo && tactil() && navigator.canShare?.({ files: [archivo] })) { await navigator.share({ files: [archivo], title: name }); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export const compartirJson = (name, json) => compartirArchivo(name, json);
export async function compartirTexto(titulo, texto) {
  if (NATIVO) { const { Share } = await import('@capacitor/share'); await Share.share({ title: titulo, dialogTitle: titulo, text: texto }); return 'compartido'; }
  if (tactil() && navigator.share) { await navigator.share({ title: titulo, text: texto }); return 'compartido'; }
  await navigator.clipboard.writeText(texto); return 'copiado';
}

export async function mantenerDespierta(on) {
  if (!NATIVO) return;
  try { const { KeepAwake } = await import('@capacitor-community/keep-awake'); await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()); } catch {}
}

export function fijarBarras(dark) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0D14' : '#E9ECF2');
  if (NATIVO) SystemBars.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {});
}

export async function alEventosApp({ back, pause, resume }) {
  if (!NATIVO) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', back);
  App.addListener('pause', pause);
  App.addListener('resume', resume);
}
export async function minimizar() { if (NATIVO) { const { App } = await import('@capacitor/app'); App.minimizeApp(); } }

const archivosWeb = NATIVO ? null : crearArchivosWeb({ kv: idbKv(), ls: (() => { try { return localStorage; } catch { return null; } })() });
export const archivos = {
  async get(name) {
    if (NATIVO) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      try { return (await Filesystem.readFile({ path: name, directory: Directory.Data, encoding: Encoding.UTF8 })).data; } catch { return null; }
    }
    return archivosWeb.get(name);
  },
  async set(name, text) {
    if (NATIVO) { const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem'); return Filesystem.writeFile({ path: name, data: text, directory: Directory.Data, encoding: Encoding.UTF8 }); }
    return archivosWeb.set(name, text);
  },
  async remove(name) {
    if (NATIVO) { const { Filesystem, Directory } = await import('@capacitor/filesystem'); try { await Filesystem.deleteFile({ path: name, directory: Directory.Data }); } catch {} return; }
    try { await archivosWeb.remove(name); } catch {}
  },
  migrar: () => (NATIVO ? Promise.resolve(0) : archivosWeb.migrar().catch(() => 0)),
};

export async function pedirPersistencia() {
  if (NATIVO) return true;
  try { const st = navigator.storage; if (!st?.persist) return false; return (await st.persisted()) || (await st.persist()); } catch { return false; }
}
export async function espacioUsado() {
  if (NATIVO) return null;
  try { const e = await navigator.storage?.estimate?.(); return e ? { usado: e.usage || 0, total: e.quota || 0, persistente: !!(await navigator.storage.persisted?.()) } : null; } catch { return null; }
}
