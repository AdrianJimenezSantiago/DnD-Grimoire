// Puente con la plataforma: Capacitor en Android (preferencias, archivos, vibración, compartir, barras del sistema)
// y las alternativas del navegador en la web y en Windows. Ningún otro módulo importa Capacitor.
import { Capacitor, SystemBars } from '@capacitor/core';

export const NATIVE = Capacitor.isNativePlatform();

export const storage = {
  async get(k) {
    if (NATIVE) { const { Preferences } = await import('@capacitor/preferences'); return (await Preferences.get({ key: k })).value; }
    try { return localStorage.getItem(k); } catch { return null; }
  },
  async set(k, v) {
    if (NATIVE) { const { Preferences } = await import('@capacitor/preferences'); return Preferences.set({ key: k, value: v }); }
    try { localStorage.setItem(k, v); } catch {}
  },
  async remove(k) {
    if (NATIVE) { const { Preferences } = await import('@capacitor/preferences'); return Preferences.remove({ key: k }); }
    try { localStorage.removeItem(k); } catch {}
  },
};

export function haptic(kind = 'light') {
  if (NATIVE) { import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light })).catch(() => {}); return; }
  try { navigator.vibrate?.(kind === 'heavy' ? 24 : 12); } catch {}
}

export async function shareJson(name, json) {
  if (NATIVE) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const w = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Copia del grimorio', dialogTitle: 'Guardar la copia en…', files: [w.uri] });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export async function keepAwake(on) {
  if (!NATIVE) return;
  try { const { KeepAwake } = await import('@capacitor-community/keep-awake'); await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()); } catch {}
}

export function setBars(dark) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0D14' : '#E9ECF2');
  if (NATIVE) SystemBars.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {});
}

export async function onAppEvents({ back, pause, resume }) {
  if (!NATIVE) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', back);
  App.addListener('pause', pause);
  App.addListener('resume', resume);
}
export async function minimize() { if (NATIVE) { const { App } = await import('@capacitor/app'); App.minimizeApp(); } }

export const fileStore = {
  async get(name) {
    if (NATIVE) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      try { return (await Filesystem.readFile({ path: name, directory: Directory.Data, encoding: Encoding.UTF8 })).data; } catch { return null; }
    }
    try { return localStorage.getItem('file:' + name); } catch { return null; }
  },
  async set(name, text) {
    if (NATIVE) { const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem'); return Filesystem.writeFile({ path: name, data: text, directory: Directory.Data, encoding: Encoding.UTF8 }); }
    localStorage.setItem('file:' + name, text);
  },
  async remove(name) {
    if (NATIVE) { const { Filesystem, Directory } = await import('@capacitor/filesystem'); try { await Filesystem.deleteFile({ path: name, directory: Directory.Data }); } catch {} return; }
    try { localStorage.removeItem('file:' + name); } catch {}
  },
};
