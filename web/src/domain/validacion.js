// Validación de lo que se escribe a mano: números, bonos, textos y tiradas.
// Cada lector devuelve { ok, n|t } o { ok: false, motivo }, y burla() convierte el motivo en un aviso con sabor a mesa de rol.
// Sin DOM: la interfaz (ui/componentes/validacion.js) decide cómo enseñarlo.

const limpiaNum = v => String(v ?? '').trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');

// Número escrito a mano. Rechaza letras sueltas («abc»), mezclas («12 de daño»), decimales donde no caben y lo que se sale del rango.
export function leerNumero(v, { min = -Infinity, max = Infinity, decimal = false, obligatorio = true } = {}) {
  const t = limpiaNum(v);
  if (!t) return obligatorio ? { ok: false, motivo: 'vacio' } : { ok: true, n: null };
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t)) return { ok: false, motivo: /\d/.test(t) ? 'mezcla' : 'letras' };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, motivo: 'alto' };
  if (!decimal && !Number.isInteger(n)) return { ok: false, motivo: 'decimal' };
  if (n < min) return { ok: false, motivo: n < 0 && min >= 0 ? 'negativo' : n === 0 && min === 1 ? 'cero' : 'bajo' };
  if (n > max) return { ok: false, motivo: 'alto' };
  return { ok: true, n };
}

// Bono de un efecto o de un objeto: «+2», «-1» o un dado como «1d4» / «-1d6». Vacío = sin bono.
export function leerBono(v, { max = 20, dados = true } = {}) {
  const t = limpiaNum(v).toLowerCase();
  if (!t) return { ok: true, t: '' };
  const m = /^([+-]?)(\d{1,3})$/.exec(t);
  if (m) { const n = +m[2]; if (n > max) return { ok: false, motivo: 'alto' }; return { ok: true, t: n ? `${m[1] === '-' ? '-' : '+'}${n}` : '' }; }
  const d = /^([+-]?)(\d{0,2})d(\d{1,3})$/.exec(t);
  if (d && dados) { const n = +(d[2] || 1), c = +d[3]; if (n < 1 || ![4, 6, 8, 10, 12, 20, 100].includes(c)) return { ok: false, motivo: 'dado' }; if (n > 10) return { ok: false, motivo: 'alto' }; return { ok: true, t: `${d[1] === '-' ? '-' : ''}${n}d${c}` }; }
  return { ok: false, motivo: /\d/.test(t) ? 'formato' : 'letras' };
}

// Daño de un arma: «1d8», «2d6», «1d10+2» o un número fijo («1»).
export function leerDano(v) {
  const t = String(v ?? '').toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');
  if (!t) return { ok: true, t: '' };
  const m = /^(\d{1,2})d(\d{1,3})([+-]\d{1,2})?$/.exec(t), fijo = /^\d{1,2}$/.test(t);
  if (fijo) return { ok: true, t };
  if (!m) return { ok: false, motivo: /\d/.test(t) ? 'formato' : 'letras' };
  if (![4, 6, 8, 10, 12, 20].includes(+m[2]) || +m[1] < 1) return { ok: false, motivo: 'dado' };
  if (+m[1] > 20) return { ok: false, motivo: 'alto' };
  return { ok: true, t: `${+m[1]}d${+m[2]}${m[3] || ''}` };
}

// Texto libre: se recortan espacios de más y caracteres de control. Rechaza lo vacío (si es obligatorio), lo larguísimo y lo que solo son símbolos.
export function leerTexto(v, { max = 200, obligatorio = false } = {}) {
  const t = String(v ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim();
  if (!t) return obligatorio ? { ok: false, motivo: 'vacio' } : { ok: true, t: '' };
  if (t.length > max) return { ok: false, motivo: 'largo' };
  if (obligatorio && !/[\p{L}\p{N}]/u.test(t)) return { ok: false, motivo: 'simbolos' };
  return { ok: true, t };
}

// Por qué no vale una tirada escrita («2d6+3», «4d6kh3», «1d20+5-1d4»). Devuelve '' si vale.
export function motivoTirada(expr, { maxDados = 100, maxCaras = 1000, maxBono = 1000 } = {}) {
  const t = String(expr ?? '').toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-');
  if (!t) return 'vacio';
  if (!/^[0-9dkhl+-]+$/.test(t)) return /\d/.test(t) ? 'formato' : 'letras';
  for (const p of t.match(/[+-]?[^+-]+/g) || []) {
    const x = p.replace(/^[+-]/, ''), m = /^(\d*)d(\d+)(?:k[hl]?(\d+))?$/.exec(x);
    if (m) { const n = +(m[1] || 1), c = +m[2]; if (n < 1 || c < 2) return 'dado'; if (n > maxDados || c > maxCaras) return 'alto'; if (m[3] != null && +m[3] < 1) return 'formato'; }
    else if (/^\d+$/.test(x)) { if (+x > maxBono) return 'alto'; }
    else return 'formato';
  }
  return '';
}

// ===== Burlas =====
// Una por motivo, elegidas al azar sin repetir la anterior. ctx: { campo, min, max, tema }.
const rango = c => (c.min != null && c.max != null && Number.isFinite(c.min) && Number.isFinite(c.max) ? `entre ${c.min} y ${c.max}` : c.max != null && Number.isFinite(c.max) ? `hasta ${c.max}` : c.min != null && Number.isFinite(c.min) ? `desde ${c.min}` : '');
const de = c => (c.campo ? ` en «${c.campo}»` : '');
const BURLAS = {
  vacio: [
    c => `${c.campo ? `«${c.campo}»` : 'Este campo'} está más vacío que la bolsa de un bardo tras la taberna. Escribe algo.`,
    c => `Has dejado ${c.campo ? `«${c.campo}»` : 'esto'} en blanco. Ni un mimo lanza conjuros sin decir nada.`,
    c => `Nada${de(c)}. El vacío es de los brujos del Gran Antiguo, no de este formulario.`,
  ],
  letras: [
    c => `Eso no es un número${de(c)}. Las runas van en los pergaminos; aquí, cifras.`,
    c => `${c.campo ? `«${c.campo}»` : 'Este campo'} pide números. El ábaco del enano no entiende de poesía.`,
    () => `Ni un mago de nivel 20 sabe sumar letras. Escribe una cifra.`,
  ],
  mezcla: [
    c => `Sobran letras${de(c)}. Solo la cifra, sin adornos de juglar.`,
    () => `Mezclar cifras y palabras es cosa de goblins. Deja solo el número.`,
  ],
  decimal: [
    c => `Aquí no caben decimales${de(c)}. En D&D se redondea hacia abajo y sin rechistar.`,
    () => `¿Medio punto? Ni los medianos se conforman con la mitad. Número entero, por favor.`,
  ],
  negativo: [
    c => `Un número negativo${de(c)} solo tiene sentido en la contabilidad de un nigromante. Mínimo ${c.min ?? 0}.`,
    () => `Eso está por debajo de cero. Ni el Abismo llega tan hondo en esta hoja.`,
  ],
  cero: [
    c => `Cero${de(c)} no cuenta. Hasta un kobold aporta al menos 1.`,
    () => `Con cero no se va de aventuras. Pon al menos 1.`,
  ],
  bajo: [
    c => `Demasiado poco${de(c)}. Tiene que ser ${rango(c)}.`,
    c => `Eso se queda corto${de(c)}: ${rango(c)}. Que no te vea el DJ.`,
  ],
  alto: [
    c => `Tranquilo, Tiamat. ${c.campo ? `«${c.campo}»` : 'Esto'} va ${rango(c) || 'con algo más de mesura'}.`,
    c => `Ni con un deseo llegas a tanto${de(c)}. Tiene que ser ${rango(c) || 'algo razonable'}.`,
    c => `Ese número no lo tira ni un dios con dados trucados. ${rango(c) ? `Va ${rango(c)}.` : 'Rebaja un poco.'}`,
  ],
  largo: [
    c => `Eso ocupa más que el Manual del Jugador${de(c)}. Máximo ${c.max ?? 200} caracteres.`,
    c => `Ni un elfo tiene paciencia para leer tanto${de(c)}. Hasta ${c.max ?? 200} caracteres.`,
  ],
  simbolos: [
    c => `Solo símbolos${de(c)}. Eso parece una maldición, no un nombre.`,
    () => `Con signos raros no te presentas en la taberna. Usa letras o números.`,
  ],
  formato: [
    c => `No entiendo eso${de(c)}. Prueba con algo como «+2» o «1d4».`,
    c => `Ese formato${de(c)} no existe ni en el Plano Elemental del Caos. Ejemplo: «2d6+3».`,
  ],
  dado: [
    () => `Ese dado no viene en ninguna bolsa: d4, d6, d8, d10, d12, d20 o d100.`,
    () => `¿Un dado de esas caras? Ni el gnomo inventor lo ha fabricado. Usa d4, d6, d8, d10, d12 o d20.`,
  ],
  archivo: [
    c => `Eso no es ${c.tipo || 'el archivo que toca'}. Ni el mejor mago de la escuela de Adivinación sabría qué hacer con él.`,
    c => `Archivo equivocado: aquí va ${c.tipo || 'otro tipo de archivo'}. El mímico no cuela.`,
  ],
  copia: [
    () => `Eso no es una copia del grimorio. Parece el diario de un aboleth: ilegible.`,
    () => `Ese texto no es una copia válida. Pega la copia completa, sin cortar ni retocar.`,
  ],
};
// Temas que afinan la burla con algo más concreto: { tema: { motivo: [...] } }; «alto» es el más habitual
const TEMAS = {
  dados: {
    letras: [() => `Eso no es una tirada, es un conjuro mal pronunciado. Prueba con «2d6+3» o «1d20».`],
    mezcla: [() => `Esa tirada lleva cosas que no son dados. Solo cifras, «d», «+» y «-»: «1d8+2».`],
    formato: [() => `No sé tirar eso. Escribe algo como «2d6+3», «4d6kh3» o «1d20-1».`, () => `Ni un dado de cristal sabría leer esa tirada. Ejemplo: «1d12+4».`],
    vacio: [() => `No hay nada que tirar. Toca unos dados o escribe la tirada.`],
  },
};
const ALTO = {
  dano: [c => `¿${c.valor} de daño? Ni el aliento de un dragón ancestral pega tanto. Máximo ${c.max}.`, c => `Ese golpe partiría el mundo en dos. Hasta ${c.max} PG de una vez.`],
  curacion: [c => `¿${c.valor} de curación? Ni un Deseo cura tanto. Máximo ${c.max}.`],
  nivel: [c => `El nivel ${c.valor} no existe ni para los semidioses. Va ${rango(c)}.`],
  monedas: [c => `Con ${c.valor} monedas comprarías Aguas Profundas entera. Hasta ${c.max}.`],
  caracteristica: [c => `Una puntuación de ${c.valor} es de dios mayor, no de aventurero. Va ${rango(c)}.`],
  ca: [c => `CA ${c.valor}: ni un tarrasque te tocaría. Va ${rango(c)}.`],
  rondas: [c => `${c.valor} rondas son más que una campaña entera. Hasta ${c.max}.`],
  dados: [() => `Esa tirada no cabe ni en la mesa ni en la bolsa de dados. Hasta 100 dados de 1000 caras y bonos de 1000.`],
};
let ultima = '';
export function burla(motivo, ctx = {}, rng = Math.random) {
  const lista = TEMAS[ctx.tema]?.[motivo] || (motivo === 'alto' && ALTO[ctx.tema]) || BURLAS[motivo] || BURLAS.formato;
  let i = Math.floor(rng() * lista.length) % lista.length, txt = lista[i](ctx);
  if (txt === ultima && lista.length > 1) txt = lista[(i + 1) % lista.length](ctx);
  ultima = txt; return txt;
}
