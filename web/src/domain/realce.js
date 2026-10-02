// Realce del texto de reglas, conjuros, rasgos, dotes y objetos. Cada estilo significa siempre lo mismo:
//   dados            → cifra dorada en su cajita          CD y CA          → negrita
//   salvación        → subrayado dorado                   ataque           → subrayado azul
//   prueba           → subrayado verde azulado            distancias       → seminegrita
//   tipo de daño     → su color y su icono                curación         → verde; PG temporales → azul
//   ventaja          → verde; desventaja → rojo           bonificadores    → negrita (+1, −2)
//   cuándo y cuánto  → cursiva                            acción adicional, reacción → versalitas
//   nombres de conjuro → cursiva, como en el manual
const CAR = '(?:Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)';
const TIPOS = { 'ácido': 'acido', contundente: 'contundente', cortante: 'cortante', 'frío': 'frio', fuego: 'fuego', fuerza: 'fuerza', 'necrótico': 'necrotico',
  perforante: 'perforante', 'psíquico': 'psiquico', radiante: 'radiante', 'relámpago': 'relampago', trueno: 'trueno', veneno: 'veneno' };
const L = '\\p{L}';
// Solo un fragmento de texto plano (sin etiquetas); el HTML ya escrito se respeta
export const porTexto = (html, fn) => html.split(/(<[^>]+>)/).map(p => (p.startsWith('<') ? p : fn(p))).join('');

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let memoNombres = null, memoRe = null;
// Nombres de conjuro de dos o más palabras («Bola de fuego», «Detectar magia»): los de una sola palabra («Luz», «Escudo»)
// se confunden con palabras corrientes y no se marcan
function reConjuros(nombres) {
  if (nombres === memoNombres) return memoRe;
  memoNombres = nombres;
  const n = [...new Set((nombres || []).filter(x => /\s/.test(x.trim()) && x.length >= 7 && /^\p{Lu}/u.test(x)))].sort((a, b) => b.length - a.length);
  memoRe = n.length ? new RegExp(`(^|[^${L}])(${n.map(escRe).join('|')})(?![${L}])`, 'gu') : null;
  return memoRe;
}

export function realzador({ icono = () => '', conjuros = () => [] } = {}) {
  const pasos = [
    // Los PG temporales y la curación, antes que los dados para que el dado quede dentro del realce
    [new RegExp(`(^|[^${L}\\d])((?:\\d+(?:d\\d+)?(?:\\s*\\+\\s*\\d+)? )?puntos de golpe temporales)(?![${L}])`, 'giu'), '$1<span class="k-temp">$2</span>'],
    [new RegExp(`((?:recupera|recuperas|recuperan|recuperar|recobra|recobras|cura|curas|restablece)[^.;:<]{0,40}?)((?:\\d+(?:d\\d+)?(?:\\s*\\+\\s*\\d+)? )?puntos de golpe)(?!\\s+temporales)`, 'giu'), '$1<span class="k-heal">$2</span>'],
    [/\b(\d+d\d+(?:\s*\+\s*\d+)?)\b/g, '<span class="k-dice">$1</span>'],
    [new RegExp(`((?:tirada|tiradas) de salvación de ${CAR}|salvaci(?:ón|ones) de ${CAR})`, 'gu'), '<span class="k-save">$1</span>'],
    [new RegExp(`(prueba(?:s)? de ${CAR}(?: \\([^)]{3,40}\\))?)`, 'gu'), '<span class="k-check">$1</span>'],
    [/((?:tirada de )?ataque (?:de conjuro|con arma) (?:a distancia|cuerpo a cuerpo)|ataque de conjuro (?:a distancia|cuerpo a cuerpo)|ataque (?:cuerpo a cuerpo|a distancia) con (?:un |una )?arma)/g, '<span class="k-atk">$1</span>'],
    [/(^|[^\p{L}\d,])(\d+(?:,\d+)?\s?(?:m|km))(?![\p{L}\d])/gu, '$1<span class="k-dist">$2</span>'],
    [/(de daño )(de |por )?(ácido|contundente|cortante|frío|fuego|fuerza|necrótico|perforante|psíquico|radiante|relámpago|trueno|veneno)(?![\p{L}])/giu,
      (m, a, b, tipo) => { const k = TIPOS[tipo.toLowerCase()] || 'fuerza'; return `${a}${b || ''}<span class="k-dmg dmg-${k}">${icono(k)}${tipo}</span>`; }],
    // Lo que se tira contra un número y la armadura: en negrita
    [/(^|[^\p{L}])((?:CD|CA) (?:de )?\d{1,2})(?![\p{L}\d])/gu, '$1<span class="k-cd">$2</span>'],
    // Bonificadores y penalizadores: +1, −2
    [/(^|[\s(])([+−]\d{1,2})(?![\d\p{L}])/gu, '$1<b class="k-bono">$2</b>'],
    // Ventaja en verde, desventaja en rojo: el color dice hacia dónde empuja la tirada
    [/(^|[^\p{L}])(desventaja|ventaja)(?![\p{L}])/giu, (m, pre, w) => `${pre}<span class="k-${/^d/i.test(w) ? 'dis' : 'adv'}">${w}</span>`],
    // Cuándo, cuánto dura y cuántas veces: en cursiva
    [new RegExp(`(^|[^${L}\\d])(una vez por (?:turno|ronda|día)|(?:una|dos|tres) veces (?:por|al) (?:turno|ronda|día)|hasta (?:el (?:inicio|comienzo|final) de )?tu siguiente turno|(?:hasta que )?(?:al )?(?:terminar|finalizar|termines|terminas|finalices) un descanso (?:corto|largo)|(?:al|hasta el) (?:siguiente )?amanecer|\\d+ (?:minutos?|horas?|días?|rondas?|asaltos?))(?![${L}])`, 'giu'), '$1<em class="k-time">$2</em>'],
    // Lo que gasta del turno: versalitas
    [/(^|[^\p{L}])(acci[oó]n adicional|reacci[oó]n)(?![\p{L}])/giu, '$1<span class="k-eco">$2</span>'],
  ];
  return h => {
    let out = pasos.reduce((acc, [re, rep]) => porTexto(acc, t => t.replace(re, rep)), h);
    const re = reConjuros(conjuros());
    if (re) out = porTexto(out, t => t.replace(re, '$1<i class="k-spell">$2</i>'));
    return out;
  };
}
