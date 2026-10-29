// Copias de seguridad: cuándo recordar que se haga una, rotación de las copias automáticas del dispositivo y su resumen.
const DIA = 864e5;
export const DIAS_RECORDAR = 14;
export const DIAS_APLAZAR = 3;
export const MAX_AUTOMATICAS = 5;

export const diaDe = t => { const d = new Date(t), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
const num = x => (Number.isFinite(+x) && +x > 0 ? +x : null);

export const hayPersonajesPropios = db => (db?.chars || []).some(c => !c.prueba);

export function recordatorioCopia({ db, ultima, primerUso, aplazado, ahora = Date.now() }) {
  if (!hayPersonajesPropios(db)) return null;
  const ref = num(ultima) ?? num(primerUso);
  if (ref == null || ahora - ref < DIAS_RECORDAR * DIA) return null;
  if (num(aplazado) != null && ahora - num(aplazado) < DIAS_APLAZAR * DIA) return null;
  return { nunca: num(ultima) == null, dias: Math.floor((ahora - ref) / DIA) };
}

export function leerIndice(raw) {
  let x; try { x = JSON.parse(raw || '[]'); } catch { x = []; }
  return (Array.isArray(x) ? x : []).filter(e => e && typeof e.archivo === 'string' && /^copia-auto-[\d-]+\.json$/.test(e.archivo) && num(e.t))
    .map(e => ({ archivo: e.archivo, t: +e.t, dia: String(e.dia || diaDe(+e.t)), personajes: Math.max(0, parseInt(e.personajes, 10) || 0), nombres: (Array.isArray(e.nombres) ? e.nombres : []).map(String).slice(0, 6) }))
    .sort((a, b) => b.t - a.t);
}

export function planAutomatica(indice, db, ahora = Date.now(), max = MAX_AUTOMATICAS) {
  if (!hayPersonajesPropios(db)) return null;
  const dia = diaDe(ahora);
  if (indice.some(e => e.dia === dia)) return null;
  const propios = db.chars.filter(c => !c.prueba);
  const nueva = { archivo: `copia-auto-${dia}.json`, t: ahora, dia, personajes: propios.length, nombres: propios.map(c => c.nombre || 'Sin nombre').slice(0, 6) };
  const lista = [nueva, ...indice.filter(e => e.archivo !== nueva.archivo)];
  return { nueva, indice: lista.slice(0, max), borrar: lista.slice(max).map(e => e.archivo) };
}

export const textoHace = dias => (dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`);

export function formatoBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
  return `${(n / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
}
