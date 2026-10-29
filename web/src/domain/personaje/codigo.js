// Código de texto para pasar un personaje por un chat: el paquete en JSON, comprimido y en base64url con un prefijo propio.
export const PREFIJO = 'GRIMORIO1:';
export const MAX_DESCOMPRIMIDO = 4 * 1024 * 1024;

const aBase64url = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const deBase64url = t => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4)); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };

async function leerTodo(stream, max) {
  const r = stream.getReader(), partes = []; let n = 0;
  for (;;) {
    const { done, value } = await r.read(); if (done) break;
    n += value.length; if (n > max) { await r.cancel(); throw new Error('demasiado grande'); }
    partes.push(value);
  }
  const out = new Uint8Array(n); let o = 0; for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}

export const esCodigo = t => String(t ?? '').trim().startsWith(PREFIJO);

export async function codificar(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const comp = await leerTodo(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')), Infinity);
  return PREFIJO + aBase64url(comp);
}

export async function decodificar(texto) {
  const t = String(texto ?? '').trim().replace(/\s+/g, '');
  if (!t.startsWith(PREFIJO)) return null;
  try {
    const bytes = deBase64url(t.slice(PREFIJO.length));
    const json = await leerTodo(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')), MAX_DESCOMPRIMIDO);
    return JSON.parse(new TextDecoder().decode(json));
  } catch { return null; }
}
