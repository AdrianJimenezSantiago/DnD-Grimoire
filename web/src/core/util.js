export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const clone = o => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
export const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const norm = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const joinY = arr => arr.join(', ').replace(/, ([^,]*)$/, ' y $1');
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export const numLibre = v => { const m = /\d+/.exec(String(v ?? '').replace(/\s/g, '')); return m ? parseInt(m[0], 10) : NaN; };
