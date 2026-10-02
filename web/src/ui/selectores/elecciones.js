import { esc, norm } from '../../core/util.js';
import { ESPECIES, TRASFONDOS_2024, dotesDe } from '../../domain/reglas/reglas2024.js';
import { HAB_TRASFONDO, NOMBRE_HAB, AB_CORTA } from '../../domain/reglas/habilidades.js';
import { biblioteca } from '../../domain/conjuros/catalogo.js';
import { PREDEFINIDOS, NOMBRE_CAT, CATEGORIAS } from '../../domain/equipo/equipo.js';
import { resumen } from '../../domain/clases/enJuego.js';
import { vdTexto } from '../../domain/criaturas/monstruos.js';
import { elegir } from '../dialogs/elegir.js';
import { md } from '../dialogs/conjuro.js';
import { gi } from '../componentes/tema.js';
import { esRepetible } from '../../domain/personaje/creacion.js';
import { faltaRequisito } from '../../domain/origen/origen.js';
import { opcionesEstilo } from '../../domain/clases/estilos.js';

export const campoElegible = (attrs, valor, tipo, ico, placeholder = '') => `<div class="elg"><span class="elg-ico" aria-hidden="true">${gi(ico)}</span><input ${attrs} value="${esc(valor || '')}" autocomplete="off" placeholder="${esc(placeholder)}"><button type="button" class="elg-b" data-elegir="${tipo}" aria-label="Ver la lista">${gi('biblioteca')}<span>Lista</span></button></div>`;
export function ponerValor(input, valor) {
  if (!input || valor == null) return;
  input.dataset.antes = input.value; input.value = valor;
  input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
}

const GRUPO_DOTE = { Origen: 'Dotes de origen', General: 'Dotes generales', 'Estilo de combate': 'Estilos de combate', 'Don épico': 'Dones épicos' };
const TONO_DOTE = { Origen: 42, General: 212, 'Estilo de combate': 4, 'Don épico': 276 };
const DOTES_BASE = [['Alerta', 'Sumas tu bonificador de competencia a la iniciativa y puedes intercambiarla con un aliado.'],
  ['Afortunado', 'Puntos de suerte para darte ventaja o imponer desventaja a quien te ataque.'], ['Atacante salvaje', 'Una vez por turno, tiras dos veces los dados de daño de un arma y eliges.'],
  ['Duro', 'Tus puntos de golpe máximos aumentan en el doble de tu nivel.'], ['Fabricante', 'Competencia con tres herramientas de artesano y descuentos al comprar.'],
  ['Habilidoso', 'Competencia en tres habilidades o herramientas a tu elección.'], ['Iniciado en la magia (clérigo)', 'Dos trucos y un conjuro de nivel 1 de la lista de clérigo.'],
  ['Iniciado en la magia (druida)', 'Dos trucos y un conjuro de nivel 1 de la lista de druida.'], ['Iniciado en la magia (mago)', 'Dos trucos y un conjuro de nivel 1 de la lista de mago.'],
  ['Matón de taberna', 'Tus golpes sin armas hacen 1d4, puedes empujar y repetir unos del daño.'], ['Músico', 'Competencia con tres instrumentos; das inspiración heroica tras un descanso.'],
  ['Sanador', 'Con un kit de sanador curas con dados de golpe y repites unos al curar.']];

const BLOQ = 'Ya la tienes. Esta dote no se puede elegir dos veces.';
export function elegirDote(ch, { titulo = 'Elegir dote', grupoInicial = '', excluirOrigen = false } = {}) {
  const lib = biblioteca().dotes, suyas = ch ? dotesDe(ch, biblioteca().trasfondos) : [];
  const tiene = new Set(suyas.map(d => norm(d.detalle ? `${d.nombre} (${d.detalle})` : d.nombre))), tieneBase = new Set(suyas.map(d => norm(d.nombre)));
  const items = lib.length ? lib.filter(d => !(excluirOrigen && d.cat === 'Origen')).map(d => {
    const ya = tiene.has(norm(d.nombre)) || (!esRepetible(d.nombre, lib) && tieneBase.has(norm(d.nombre)));
    const falta = ch ? faltaRequisito(d.req || (d.cat === 'Don épico' ? 'nivel 19' : d.cat === 'General' ? 'nivel 4' : d.cat === 'Estilo de combate' ? 'rasgo Estilo de combate' : ''), ch) : '';
    return { nombre: d.nombre, grupo: GRUPO_DOTE[d.cat] || d.cat || 'Otras', tono: TONO_DOTE[d.cat], ico: 'dote', sub: d.req ? `Requisitos: ${d.req}` : resumen(d.texto).slice(0, 110),
      tag: ya ? 'la tienes' : falta ? 'no cumples' : '', bloqueado: ya && !esRepetible(d.nombre, lib) ? BLOQ : falta ? `No puedes elegirla: ${falta.charAt(0).toLowerCase()}${falta.slice(1)}` : '', buscar: d.texto.slice(0, 400),
      detalle: `<div class="sp-text">${md(d.texto)}</div>${d.fuente ? `<p class="el-fuente">${esc(d.fuente)}</p>` : ''}` };
  }).sort((a, b) => !!a.bloqueado - !!b.bloqueado) : DOTES_BASE.map(([n, t]) => { const ya = tiene.has(norm(n)) || (!esRepetible(n) && tieneBase.has(norm(n)));
    return { nombre: n, grupo: 'Dotes de origen', tono: 42, sub: t, tag: ya ? 'la tienes' : '', bloqueado: ya && !esRepetible(n) ? BLOQ : '' }; });
  return elegir({ titulo, ico: 'dote', items, grupos: [...Object.values(GRUPO_DOTE), 'Otras'], grupoInicial, placeholder: 'Buscar una dote',
    sub: lib.length ? 'Toca una para leerla antes de elegirla. También puedes escribir otra.' : 'Sin libros importados solo salen las dotes de origen. Importa el Manual del Jugador para verlas todas, o escribe cualquier otra.' });
}

// Atributos de cada especie con los nombres del Manual del Jugador de 2024
export const ESPECIE_BASE = {
  Aasimar: 'Manos curativas · Portador de luz · Resistencia celestial · Visión en la oscuridad · Revelación celestial (nivel 3)',
  'Dracónido': 'Linaje dracónico · Ataque de aliento · Resistencia al daño · Visión en la oscuridad · Vuelo dracónico (nivel 5)',
  Elfo: 'Linaje élfico · Linaje feérico · Sentidos agudos · Trance · Visión en la oscuridad',
  Enano: 'Afinidad con la piedra · Aguante enano · Resistencia enana · Visión en la oscuridad (36 m)',
  Gnomo: 'Astucia gnoma · Linaje gnomo · Visión en la oscuridad',
  Goliat: 'Velocidad 10,5 m · Constitución poderosa · Forma grande (nivel 5) · Linaje gigante',
  Humano: 'Diestro · Ingenioso · Versátil (una dote de origen)',
  Mediano: 'Agilidad de mediano · Fortuna · Sigiloso por naturaleza · Valiente',
  Orco: 'Aguante incansable · Descarga de adrenalina · Visión en la oscuridad (36 m)',
  Tiefling: 'Legado infernal · Presencia sobrenatural · Visión en la oscuridad',
};
export function elegirEspecie(actual = '') {
  const lib = biblioteca().especies, items = ESPECIES.map(n => {
    const x = lib.find(e => norm(e.nombre) === norm(n));
    return { nombre: n, grupo: 'Manual del Jugador', ico: 'criatura', sub: x ? x.rasgos.map(r => r.nombre).join(' · ') : ESPECIE_BASE[n],
      detalle: x ? `<ul class="el-rasgos">${x.rasgos.map(r => `<li><b>${esc(r.nombre)}${r.nivel > 1 ? ` <small>nivel ${r.nivel}</small>` : ''}</b><span>${esc(resumen(r.texto))}</span></li>`).join('')}</ul>` : '' };
  });
  for (const e of lib) if (!items.some(i => norm(i.nombre) === norm(e.nombre))) items.push({ nombre: e.nombre, grupo: e.fuente || 'Otros libros', ico: 'criatura', sub: e.rasgos.map(r => r.nombre).join(' · ') });
  return elegir({ titulo: 'Elegir especie', ico: 'criatura', items, actual, placeholder: 'Buscar una especie', sub: 'Toca una para ver sus atributos. También puedes escribir otra (por ejemplo, «Elfo (drow)»).' });
}

const abrev = t => String(t || '').replace(/Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma/g, w => ({ Fuerza: 'Fue', Destreza: 'Des', 'Constitución': 'Con', Inteligencia: 'Int', 'Sabiduría': 'Sab', Carisma: 'Car' })[w]);
export function elegirTrasfondo(actual = '') {
  const lib = biblioteca().trasfondos.filter(t => t.nombre), items = [];
  for (const [n, [cars, dote]] of Object.entries(TRASFONDOS_2024)) {
    const x = lib.find(t => norm(t.nombre) === norm(n)), habs = (HAB_TRASFONDO[n] || []).map(k => NOMBRE_HAB[k]).join(' y ');
    items.push({ nombre: n, grupo: 'Manual del Jugador', ico: 'trasfondo', sub: `${cars.map(k => AB_CORTA[k]).join(', ')} · ${dote}`, buscar: habs,
      detalle: `<dl class="el-dl"><div><dt>Características</dt><dd>${esc(x?.caracteristicas || cars.map(k => AB_CORTA[k]).join(', '))}</dd></div><div><dt>Dote</dt><dd>${esc(x?.dote || dote)}</dd></div>
        <div><dt>Habilidades</dt><dd>${esc(x?.habilidades || habs)}</dd></div>${x?.herramientas ? `<div><dt>Herramientas</dt><dd>${esc(x.herramientas)}</dd></div>` : ''}${x?.equipo ? `<div><dt>Equipo</dt><dd>${esc(x.equipo)}</dd></div>` : ''}</dl>${x?.texto ? `<div class="sp-text">${md(x.texto)}</div>` : ''}` });
  }
  for (const t of lib) if (!items.some(i => norm(i.nombre) === norm(t.nombre))) items.push({ nombre: t.nombre, grupo: String(t.fuente || 'Otros libros').replace(/^D&D\s*[\d.,]*\s*-?\s*/i, '').split(/[:(]/)[0].trim(), ico: 'trasfondo',
    sub: [abrev(t.caracteristicas), t.dote].filter(Boolean).join(' · '),
    detalle: `<dl class="el-dl">${[['Características', t.caracteristicas], ['Dote', t.dote], ['Habilidades', t.habilidades], ['Herramientas', t.herramientas], ['Equipo', t.equipo]].filter(f => f[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${t.texto ? `<div class="sp-text">${md(t.texto)}</div>` : ''}` });
  return elegir({ titulo: 'Elegir trasfondo', ico: 'trasfondo', items, actual, placeholder: 'Buscar un trasfondo', sub: 'Cada trasfondo da tres características para repartir, una dote de origen y dos habilidades.' });
}

export function elegirObjetoComun() {
  const ico = Object.fromEntries(CATEGORIAS.map(([k, , i]) => [k, i]));
  const items = PREDEFINIDOS.map(p => ({ nombre: p.nombre, grupo: NOMBRE_CAT[p.cat], ico: ico[p.cat],
    sub: [p.arma ? `${p.arma.dano} ${p.arma.tipo}` : '', p.armadura ? (p.armadura.tipo === 'escudo' ? `+${p.armadura.base} CA` : `CA ${p.armadura.base}${p.armadura.dex === 'todo' ? ' + Des' : p.armadura.dex === 'max2' ? ' + Des (máx. 2)' : ''}`) : '',
      p.peso ? `${String(p.peso).replace('.', ',')} kg` : '', p.valor].filter(Boolean).join(' · '), buscar: [...(p.arma?.props || []), p.arma?.maestria].join(' ') }));
  return elegir({ titulo: 'Objetos del Manual del Jugador', ico: 'cofre', items, grupos: CATEGORIAS.map(([, t]) => t), placeholder: 'Buscar un objeto', sub: 'Con su peso y su valor; las armas y armaduras traen sus datos. También puedes escribir cualquier otro.' });
}

export function elegirCriatura(actual = '') {
  const cs = biblioteca().criaturas, tipos = [...new Set(cs.map(c => c.tipoBase || 'Otras'))].sort((a, b) => a.localeCompare(b, 'es'));
  const items = [...cs].sort((a, b) => (a.vdNum ?? 99) - (b.vdNum ?? 99) || a.nombre.localeCompare(b.nombre, 'es')).map(c => ({ nombre: c.nombre, grupo: c.tipoBase || 'Otras', ico: 'criatura',
    sub: [c.vdNum != null ? `VD ${vdTexto(c.vdNum)}` : '', c.tamano].filter(Boolean).join(' · ') }));
  return elegir({ titulo: 'Criaturas de tus libros', ico: 'bestia', items, grupos: tipos, actual, placeholder: 'Buscar una criatura', sub: 'Elige una para rellenar su perfil, o escribe cualquier nombre.' });
}

export function elegirEstilo(ch, clase, { titulo = 'Estilo de combate' } = {}) {
  const items = opcionesEstilo(ch, biblioteca().dotes, clase).map(e => ({ nombre: e.nombre, grupo: e.alternativa ? 'En lugar de un estilo' : 'Estilos de combate', ico: e.alternativa ? 'libro' : 'ca',
    tono: e.alternativa ? 150 : 4, sub: resumen(e.texto).slice(0, 120), tag: e.ya ? 'la tienes' : '', bloqueado: e.ya ? BLOQ : '',
    detalle: `<div class="sp-text">${md(e.texto)}</div>${e.fuente ? `<p class="el-fuente">${esc(e.fuente)}</p>` : ''}` }));
  return elegir({ titulo, ico: 'ca', items, libre: false, grupos: ['Estilos de combate', 'En lugar de un estilo'], placeholder: 'Buscar un estilo',
    sub: `${clase ? `${clase}: ` : ''}elige una dote de estilo de combate. Toca una para leerla.` });
}
