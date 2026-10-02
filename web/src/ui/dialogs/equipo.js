import { campoElegible, ponerValor, elegirObjetoComun } from '../elecciones.js';
import { esc, norm } from '../../core/util.js';
import { CATEGORIAS, MONEDAS, PREDEFINIDOS, MAX_SINTONIA, equipoDe, sintonizados, alternarSintonia, equipar, desequipar, cambiarCantidad,
  quitarObjeto, anadirComun, normObjeto, pesoTotal, pesoGuardado, capacidadCarga, capacidadArrastre, valorMonedas, valorObjetos, claseArmadura, ataqueArma,
  manos, esEscudo, aDosManos, vaEnMano, armaduraPuesta, dosArmasLigeras, requisitosArmadura, penalizacionArmadura, alternarGuardado,
  pagar, cobrar, juntarMonedas, enCobre, precioVenta, venderObjeto, municionDe, curacionDe, motivoSintonia, requisitoSintonia } from '../../domain/equipo.js';
import { usoDe, usarObjeto } from '../../domain/usarObjeto.js';
import { reglas, usosGastados } from '../../domain/rasgos.js';
import { efectoDe, objetoActivo, bonoDeNombre, describirEfecto, statsEfectivos } from '../../domain/objetosEfecto.js';
import { armadurasDe, competenteConArma } from '../../domain/competencias.js';
import { biblioteca } from '../../domain/catalogo.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { avatarHtml } from '../avatar.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { pedir } from '../modal.js';
import { burstFrom, reducedMotion } from '../fx.js';
import { golpe } from '../golpes.js';
import { haptic } from '../../platform/native.js';
import { undoBtn, stepResource } from '../../app/acciones.js';
import { RAR_K, TIPO_I, abrirObjeto, openBiblioteca } from './biblioteca.js';

let S;
const PREF_VISTA = 'grimorio-inv-vista';
const leerVista = () => { try { return localStorage.getItem(PREF_VISTA) === 'lista' ? 'lista' : 'rejilla'; } catch { return 'rejilla'; } };
// sel: objeto abierto en el inspector; hueco: ranura del maniquí para la que se elige objeto; fx: efecto pendiente tras pintar
const V = { cat: '', q: '', form: null, monedas: false, vista: leerVista(), sel: null, hueco: null, fx: null };
const dlg = () => $('#equipoDlg');
const kg = n => `${(Math.round((n || 0) * 100) / 100).toLocaleString('es-ES')} kg`;
const po = n => `${(Math.round((n || 0) * 100) / 100).toLocaleString('es-ES')} po`;
const icoCat = k => (CATEGORIAS.find(c => c[0] === k) || [])[2] || 'cofre';
const APILABLE = new Set(['consumible', 'comida', 'tesoro', 'equipo', 'otro', 'herramienta']);
const HUECOS = { principal: 'Mano principal', secundaria: 'Mano secundaria', armadura: 'Armadura' };
const rarK = o => (o.rareza ? `r-${RAR_K[o.rareza] || 'varia'}` : '');
const buscar = (ch, id) => equipoDe(ch).objetos.find(x => x.id === id) || null;
// Iconos de los objetos comunes, por el nombre
const ICONO_NOMBRE = [[/^antorcha/, 'it_antorcha'], [/^cuerda/, 'it_cuerda'], [/^tienda/, 'it_tienda'], [/^linterna/, 'it_linterna'], [/^palanca/, 'it_palanca'],
  [/^raciones?/, 'it_racion'], [/^pan\b/, 'it_pan'], [/^queso/, 'it_queso'], [/^vino/, 'it_vino'], [/^(agua\b(?! bendita)|odre)/, 'it_agua'], [/^(gema|joya|perla|diamante|rubi|zafiro|esmeralda)/, 'it_gema'],
  [/^agua bendita/, 'it_bendita'], [/^fuego de alquimista/, 'it_fuego'], [/^saco de dormir/, 'it_saco'], [/^manta/, 'it_manta'], [/^herramientas de ladron/, 'it_ganzuas'],
  [/^(laud|lira|flauta|tambor|gaita|viola)/, 'it_laud'], [/^utiles de herrero/, 'it_herrero'], [/^kit de herborista/, 'it_hierbas'], [/^(suministros de caligrafia|tinta)/, 'it_tinta'],
  [/^olla/, 'it_olla'], [/^grilletes/, 'it_grilletes'], [/^perfume/, 'it_perfume'], [/^(ropa|tunica|capa\b(?! de))/, 'it_ropa'], [/^kit de sanador/, 'it_sanador'], [/^yesquero/, 'it_yesquero'],
  [/^objeto de arte/, 'it_arte'], [/^lampara/, 'it_lampara'], [/^(mochila)/, 'inv_mochila'], [/^bolsa\b/, 'inv_bolsa'], [/^carcaj/, 'inv_municion'], [/^libro/, 'libro'],
  [/^foco arcano \(orbe|cristal/, 'adivino'], [/^(foco arcano \(baston|foco druidico \(baston)/, 'mago'], [/^simbolo sagrado/, 'clerigo'], [/^foco druidico/, 'druida'], [/^(kit de )?disfraz/, 'engano'], [/^pergamino/, 'o_pergamino']];
function icoDe(o) {
  if (o.clave && TIPO_I[o.tipo] && !o.arma && !o.armadura) return TIPO_I[o.tipo];
  if (esEscudo(o)) return 'ca';
  if (o.arma) return 'o_arma';
  if (o.armadura) return 'o_armadura';
  if (curacionDe(o)) return 'o_pocion';
  if (/^(flechas|virotes|balas|agujas)/.test(norm(o.nombre))) return 'inv_municion';
  if (o.clave) return 'o_maravilloso';
  const n = norm(o.nombre);
  return ICONO_NOMBRE.find(([r]) => r.test(n))?.[1] || icoCat(o.cat);
}
// Color en hexadecimal de una variable CSS, para las chispas del lienzo
function hexDe(el, v = 'var(--gold)') {
  const t = document.createElement('i'); t.style.color = v; (el || document.body).appendChild(t);
  const m = getComputedStyle(t).color.match(/\d+(\.\d+)?/g); t.remove();
  return m ? '#' + m.slice(0, 3).map(n => Math.round(+n).toString(16).padStart(2, '0')).join('') : '#E7B85F';
}

// Lo que hace el objeto en la hoja, y si está funcionando
function efectoTexto(o) {
  const b = describirEfecto(efectoDe(o.nombre)); if (!b.length) return '';
  const falta = o.guardado ? 'al llevarlo encima' : o.sintonia && !o.sintonizado ? 'al sintonizarlo' : 'al equiparlo';
  return objetoActivo(o) ? `<span class="obj-ef on">${esc(b.join(', '))}</span>` : `<span class="obj-ef">${esc(b.join(', '))} (${falta})</span>`;
}
// Una línea con lo esencial: ataque y daño, CA, curación o peso
function claveCorta(ch, o) {
  if (o.arma) { const at = ataqueArma(ch, o); return `${at.ataque} · ${at.expr}`; }
  if (esEscudo(o)) return `+${(o.armadura.base || 2) + (o.armadura.bono || 0)} CA`;
  if (o.armadura) return `CA ${(o.armadura.base || 10) + (o.armadura.bono || 0)}${o.armadura.dex === 'todo' ? '+Des' : o.armadura.dex === 'max2' ? '+Des²' : ''}`;
  if (curacionDe(o)) return `${curacionDe(o)} PG`;
  return o.peso ? kg(o.peso * Math.max(1, o.cantidad || 0)) : o.valor || '';
}
const enUso = (ch, o) => o.equipado || o.sintonizado;
const donde = o => (o.mano === 'ambas' ? 'A dos manos' : o.mano === 'principal' ? 'Mano principal' : o.mano === 'secundaria' ? 'Mano secundaria' : o.armadura ? 'Puesta' : 'Equipado');

// ——— Maniquí: manos, armadura y sintonía ———
function hueco(ch, k, o, extra = '') {
  const lleno = !!o, a = o?.arma ? ataqueArma(ch, o) : null;
  const sub = !o ? (k === 'armadura' ? 'Sin armadura' : 'Libre') : a ? `${a.ataque} · ${a.dano}` : claveCorta(ch, o);
  const ico = o ? icoDe(o) : k === 'armadura' ? 'o_armadura' : 'inv_mano';
  return `<button type="button" class="inv-hueco h-${k} ${lleno ? 'lleno' : ''} ${o ? rarK(o) : ''} ${extra}" data-hueco="${k}" data-soltar="${k}" ${o ? `data-hid="${o.id}"` : ''}
      aria-label="${HUECOS[k]}: ${o ? esc(o.nombre) : 'vacía'}">
    <span class="inv-h-ico">${gi(ico)}</span>
    <span class="inv-h-t"><small>${HUECOS[k]}</small><b>${o ? esc(o.nombre) : '—'}</b><em>${esc(sub)}</em></span></button>`;
}
function maniqui(ch) {
  const m = manos(ch), arm = armaduraPuesta(ch), ca = claseArmadura(ch), sin = sintonizados(ch);
  const dos = m.principal && m.principal === m.secundaria;
  const gemas = Array.from({ length: MAX_SINTONIA }, (_, i) => {
    const o = sin[i];
    return o ? `<button type="button" class="inv-gema lleno ${rarK(o) || 'r-comun'}" data-hueco="sintonia" data-hid="${o.id}" data-soltar="sintonia" aria-label="Sintonizado: ${esc(o.nombre)}"><span>${gi(icoDe(o))}</span><small>${esc(o.nombre)}</small></button>`
      : `<button type="button" class="inv-gema" data-hueco="sintonia" data-soltar="sintonia" aria-label="Hueco de sintonía libre"><span>${gi('sintonia')}</span><small>Libre</small></button>`;
  }).join('');
  return `<section class="inv-hero" aria-label="Equipo puesto">
    <div class="inv-maniqui">
      ${hueco(ch, 'principal', m.principal, dos ? 'dos' : '')}
      <div class="inv-figura" aria-hidden="true"><span class="inv-runa"></span>${avatarHtml(ch, 'lg')}
        <span class="inv-ca" title="Clase de armadura">${gi('ca')}<b>${ca.ca}</b><small>CA</small></span></div>
      ${dos ? `<div class="inv-hueco h-secundaria ocupada" aria-hidden="true"><span class="inv-h-ico">${gi(icoDe(m.principal))}</span><span class="inv-h-t"><small>${HUECOS.secundaria}</small><b>A dos manos</b><em>${esc(m.principal.nombre)}</em></span></div>`
        : hueco(ch, 'secundaria', m.secundaria)}
      ${hueco(ch, 'armadura', arm)}
      <div class="inv-sinto" role="group" aria-label="Sintonía: ${sin.length} de ${MAX_SINTONIA}"><span class="inv-sinto-t">${gi('sintonia')}Sintonía <b>${sin.length}/${MAX_SINTONIA}</b></span><div class="inv-gemas">${gemas}</div></div>
    </div>
    <p class="inv-ca-det">${gi('ca')}<span><b>CA ${ca.ca}</b> · ${esc(ca.detalle)}</span></p>
  </section>`;
}

// ——— Carga y monedas ———
function medidores(ch) {
  const eq = equipoDe(ch), peso = pesoTotal(ch), cap = capacidadCarga(ch), pct = Math.min(100, peso / cap * 100), alijo = pesoGuardado(ch);
  const nivel = peso > cap ? 'over' : pct >= 75 ? 'alto' : '';
  const total = valorMonedas(ch), bienes = valorObjetos(ch);
  const monedas = MONEDAS.map(([k]) => `<i class="mon m-${k} ${eq.monedas[k] ? '' : 'cero'}" title="${eq.monedas[k] || 0} ${k}"></i>`).join('');
  return `<section class="inv-medidores" aria-label="Carga y monedas">
    <div class="inv-med inv-carga ${nivel}">
      <span class="inv-med-ico">${gi('inv_carga')}</span>
      <span class="inv-med-t"><small>Carga</small><b>${kg(peso)} <i>/ ${kg(cap)}</i></b>
        <span class="inv-gauge" role="meter" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${peso}" aria-label="Carga"><i style="--p:${pct}%"></i></span>
        <em>${peso > cap ? 'Por encima de tu capacidad' : `Fuerza ${ch.stats?.fue || 10} · empujas o arrastras hasta ${kg(capacidadArrastre(ch))}`}${alijo ? ` · ${kg(alijo)} en el alijo` : ''}</em></span>
    </div>
    <button type="button" class="inv-med inv-mon" data-inv="monedas" aria-expanded="${V.monedas}">
      <span class="inv-pila" aria-hidden="true">${monedas}</span>
      <span class="inv-med-t"><small>Monedas</small><b class="inv-oro">${po(total)}</b>
        <em>${MONEDAS.filter(([k]) => eq.monedas[k]).map(([k]) => `${eq.monedas[k]} ${k}`).join(' · ') || 'Toca para abrir la bolsa'}${bienes ? ` · equipo: ${po(bienes)}` : ''}</em></span>
      <span class="inv-chev" aria-hidden="true">${icon('chevron')}</span>
    </button>
  </section>`;
}
function bolsaMonedas(ch) {
  const eq = equipoDe(ch);
  return `<section class="inv-monedero" aria-label="Bolsa de monedas">
    <div class="inv-mons">${MONEDAS.map(([k, n, v]) => `<label class="inv-moneda m-${k}"><span class="mon" aria-hidden="true">${k}</span>
      <span class="inv-mn-t"><small>${n}</small><input type="number" inputmode="numeric" min="0" data-moneda="${k}" value="${eq.monedas[k] || 0}" aria-label="Monedas de ${n.toLowerCase()}"></span>
      <em>${v >= 1 ? `${v} po` : `${v.toLocaleString('es-ES')} po`}</em></label>`).join('')}</div>
    <div class="inv-mon-acts"><button type="button" data-inv="pagar">${gi('inv_pagar')}Pagar</button><button type="button" data-inv="cobrar">${gi('inv_cobrar')}Cobrar</button>
      <button type="button" data-inv="juntar" title="Cambia el cobre, la plata y el electro por monedas más grandes">${gi('inv_juntar')}Juntar</button></div>
    <p class="note">Al pagar se usan primero las monedas pequeñas y el cambio vuelve en oro, plata y cobre. 50 monedas pesan medio kilo.</p>
  </section>`;
}

// ——— Avisos de reglas: lo que el equipo puesto hace (o estropea) ———
function avisos(ch) {
  const out = [], pa = penalizacionArmadura(ch), sabe = armadurasDe(ch), m = manos(ch);
  const puesta = equipoDe(ch).objetos.filter(o => o.equipado && o.armadura);
  for (const o of puesta) if (!sabe.has(o.armadura.tipo)) out.push(['mal', 'estados', `Sin entrenamiento con ${esEscudo(o) ? 'escudos' : `armadura ${o.armadura.tipo}`}: desventaja en lo que use Fuerza o Destreza y no puedes lanzar conjuros`]);
  if (pa.lenta) out.push(['mal', 'velocidad', `${pa.armadura.nombre} pide Fuerza ${pa.fue}: −${pa.lenta} m de velocidad`]);
  if (pa.sigilo) out.push(['aviso', 'ojo', `${pa.armadura.nombre}: desventaja en Destreza (Sigilo)`]);
  for (const o of new Set([m.principal, m.secundaria])) {
    if (!o?.arma) continue;
    if (!competenteConArma(ch, o)) out.push(['mal', 'o_arma', `Sin competencia con ${o.nombre}: no sumas tu bonificador al ataque`]);
    const mu = municionDe(ch, o);
    if ((o.arma.props || []).some(p => norm(p).startsWith('municion')) && !(mu?.cantidad > 0)) out.push(['mal', 'inv_municion', `${o.nombre}: ${mu ? `no te quedan ${mu.nombre.toLowerCase()}` : 'no llevas munición'}`]);
  }
  if (dosArmasLigeras(ch)) out.push(['bien', 'combate', 'Dos armas ligeras: al atacar con una puedes atacar con la otra como acción adicional']);
  if (pesoTotal(ch) > capacidadCarga(ch)) out.push(['mal', 'inv_carga', 'Llevas más de lo que puedes cargar: deja algo en el alijo']);
  if (!out.length) return '';
  return `<ul class="inv-avisos" aria-label="Avisos del equipo">${out.map(([t, ico, x]) => `<li class="${t}">${gi(ico)}<span>${esc(x)}</span></li>`).join('')}</ul>`;
}

// ——— Bolsa: casillas o lista ———
function casilla(ch, o, i) {
  const r = o.rasgo && reglas(ch).find(x => x.id === o.rasgo), libres = r ? r.max - usosGastados(ch, r) : null;
  const marca = o.equipado ? `<span class="inv-c-marca" title="${donde(o)}">${gi(o.armadura && !esEscudo(o) ? 'o_armadura' : 'inv_mano')}</span>`
    : o.sintonizado ? `<span class="inv-c-marca sin" title="Sintonizado">${gi('sintonia')}</span>` : '';
  const arrastra = vaEnMano(o) || o.armadura || o.sintonia;
  return `<li class="inv-c ${rarK(o)} ${enUso(ch, o) ? 'on' : ''} ${o.cantidad === 0 ? 'agotado' : ''} ${o.magico ? 'magico' : ''}" style="--i:${Math.min(i, 24)}" data-oid="${o.id}">
    <button type="button" class="inv-c-b" data-inspec="${o.id}" ${arrastra ? `draggable="true" data-arrastra="${o.id}"` : ''} aria-label="${esc(o.nombre)}${o.cantidad > 1 ? `, ${o.cantidad}` : ''}${enUso(ch, o) ? `, ${o.sintonizado && !o.equipado ? 'sintonizado' : donde(o).toLowerCase()}` : ''}">
      <span class="inv-c-ico">${gi(icoDe(o))}</span>${marca}
      ${o.cantidad > 1 || (APILABLE.has(o.cat) && o.cantidad !== 1) ? `<span class="inv-c-n">${o.cantidad}</span>` : ''}
      ${libres != null ? `<span class="inv-c-carg" title="${libres} de ${r.max} cargas">${libres}/${r.max}</span>` : ''}
      <span class="inv-c-t"><b>${esc(o.nombre)}</b><small>${esc(claveCorta(ch, o))}</small></span></button></li>`;
}
function fila(ch, o, R) {
  const r = o.rasgo && R.find(x => x.id === o.rasgo), libres = r ? r.max - usosGastados(ch, r) : 0;
  const at = o.arma ? ataqueArma(ch, o) : null;
  const meta = [
    enUso(ch, o) ? `<span class="inv-uso">${esc(o.sintonizado && !o.equipado ? 'Sintonizado' : donde(o))}</span>` : '',
    at ? `${at.ataque} · ${at.dano}` : '',
    o.armadura ? claveCorta(ch, o) : '',
    o.rareza ? `<span class="rar-txt">${esc(o.rareza)}</span>` : '',
    efectoTexto(o),
    r ? `${libres} de ${r.max} cargas` : '',
    o.peso ? kg(o.peso * (o.cantidad || 1)) : '',
    o.valor,
  ].filter(Boolean);
  const uso = usoDe(o);
  const acts = [
    vaEnMano(o) || o.armadura ? `<button type="button" class="chip ${o.equipado ? 'gold' : ''}" data-inveq="${o.id}" aria-pressed="${o.equipado}">${o.equipado ? 'Equipado' : 'Equipar'}</button>` : '',
    o.sintonia && !o.guardado ? `<button type="button" class="chip ${o.sintonizado ? 'gold' : ''}" data-eqsin="${o.id}" aria-pressed="${o.sintonizado}">${gi('sintonia')}${o.sintonizado ? 'Sintonizado' : 'Sintonizar'}</button>` : '',
    uso ? `<button type="button" class="chip" data-invusar="${o.id}" ${o.cantidad ? '' : 'disabled'}>${uso.accion === 'beber' ? 'Beber' : uso.accion === 'leer' ? 'Leer' : 'Usar'}</button>` : '',
    APILABLE.has(o.cat) || o.cantidad > 1 ? `<span class="inv-qty"><button type="button" data-invcant="${o.id}|-1" aria-label="Quitar uno de ${esc(o.nombre)}">−</button><b>${o.cantidad}</b><button type="button" data-invcant="${o.id}|1" aria-label="Añadir uno de ${esc(o.nombre)}">+</button></span>` : '',
  ].filter(Boolean).join('');
  return `<li class="inv-it ${rarK(o)} ${enUso(ch, o) ? 'on' : ''} ${o.cantidad === 0 ? 'agotado' : ''}" data-oid="${o.id}">
    <button type="button" class="inv-main" data-inspec="${o.id}" ${vaEnMano(o) || o.armadura || o.sintonia ? `draggable="true" data-arrastra="${o.id}"` : ''} aria-label="Ver ${esc(o.nombre)}">
      <span class="obj-ico">${gi(icoDe(o))}</span>
      <span class="obj-t"><b>${esc(o.nombre)}${o.cantidad > 1 ? ` <small class="inv-x">×${o.cantidad}</small>` : ''}</b><small>${meta.map(m => (m.startsWith('<') ? m : esc(m))).join(' · ')}</small></span></button>
    <span class="inv-acts">${acts}</span></li>`;
}
function grupos(ch, lista, R) {
  const orden = (a, b) => (enUso(ch, b) - enUso(ch, a)) || a.nombre.localeCompare(b.nombre, 'es');
  let i = 0;
  return CATEGORIAS.filter(([k]) => lista.some(o => o.cat === k)).map(([k, t, ico]) => {
    const items = lista.filter(o => o.cat === k).sort(orden), peso = items.reduce((s, o) => s + (o.peso || 0) * o.cantidad, 0);
    const cuerpo = V.vista === 'lista' ? `<ul class="inv-list">${items.map(o => fila(ch, o, R)).join('')}</ul>` : `<ul class="inv-rejilla">${items.map(o => casilla(ch, o, i++)).join('')}</ul>`;
    return `<section class="inv-grupo"><h4>${gi(ico)}${esc(t)}<small>${items.length}${peso ? ` · ${kg(peso)}` : ''}</small></h4>${cuerpo}</section>`;
  }).join('');
}

// ——— Formulario de añadir o editar ———
function formulario() {
  const f = V.form, o = f.o, cat = o.cat;
  const catOpts = CATEGORIAS.map(([k, t]) => `<option value="${k}" ${k === cat ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const arma = o.arma || {}, arm = o.armadura || {}, req = o.armadura ? requisitosArmadura(o) : { fue: 0, sigilo: false };
  return `<section class="inv-form" aria-label="${f.id ? 'Editar objeto' : 'Añadir objeto'}"><h3>${gi(f.id ? 'md_pluma' : 'cofre')}${f.id ? `Editar ${esc(o.nombre)}` : 'Añadir objeto'}</h3>
    <div class="frow"><div class="f wide"><span>Nombre</span>${campoElegible('id="ivNom" aria-label="Nombre del objeto"', o.nombre, 'objeto', 'cofre', 'Escribe o elige: espada larga, raciones, cuerda…')}</div></div>
    <div class="frow"><label class="f">Categoría<select id="ivCat">${catOpts}</select></label>
      <label class="f">Cantidad<input id="ivCant" type="number" inputmode="numeric" min="0" value="${o.cantidad ?? 1}"></label>
      <label class="f">Peso (kg, cada uno)<input id="ivPeso" inputmode="decimal" value="${o.peso ? String(o.peso).replace('.', ',') : ''}" placeholder="0"></label>
      <label class="f">Valor<input id="ivValor" value="${esc(o.valor || '')}" placeholder="15 po" autocomplete="off"></label></div>
    ${cat === 'arma' ? `<div class="frow"><label class="f">Daño<input id="ivDano" value="${esc(arma.dano || '')}" placeholder="1d8" autocomplete="off"></label>
      <label class="f">Tipo de daño<input id="ivTipo" value="${esc(arma.tipo || '')}" placeholder="cortante" autocomplete="off"></label>
      <label class="f">Bonificador mágico<input id="ivBonoA" type="number" inputmode="numeric" value="${arma.bono ?? bonoDeNombre(o.nombre)}"></label>
      <label class="f wide">Propiedades<input id="ivProps" value="${esc((arma.props || []).join(', '))}" placeholder="Sutil, Ligera, Arrojadiza, Dos manos" autocomplete="off"></label>
      <label class="f">Maestría<input id="ivMaes" value="${esc(arma.maestria || '')}" placeholder="Irritar" autocomplete="off"></label>
      <label class="f">Alcance<input id="ivDist" value="${esc(arma.distancia || '')}" placeholder="24/96 m" autocomplete="off"></label></div>` : ''}
    ${cat === 'armadura' ? `<div class="frow"><label class="f">Tipo<select id="ivArmT">${[['ligera', 'Ligera'], ['media', 'Media'], ['pesada', 'Pesada'], ['escudo', 'Escudo']].map(([k, t]) => `<option value="${k}" ${arm.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f">${arm.tipo === 'escudo' ? 'Bonificador a la CA' : 'CA base'}<input id="ivBase" type="number" inputmode="numeric" value="${arm.base ?? (arm.tipo === 'escudo' ? 2 : 11)}"></label>
      ${arm.tipo === 'escudo' ? '' : `<label class="f">Destreza<select id="ivDex">${[['todo', 'Suma toda'], ['max2', 'Máximo +2'], ['no', 'No suma']].map(([k, t]) => `<option value="${k}" ${arm.dex === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`}
      <label class="f">Bonificador mágico<input id="ivBonoR" type="number" inputmode="numeric" value="${arm.bono ?? bonoDeNombre(o.nombre)}"></label>
      ${arm.tipo === 'escudo' ? '' : `<label class="f">Fuerza mínima<input id="ivFue" type="number" inputmode="numeric" min="0" value="${req.fue || ''}" placeholder="—"></label>
      <label class="f inv-check"><input id="ivSig" type="checkbox" ${req.sigilo ? 'checked' : ''}><span>Desventaja en Sigilo</span></label>`}</div>` : ''}
    <label class="f wide">Notas<input id="ivNotas" value="${esc(o.notas || '')}" placeholder="Dónde lo guarda, efectos, usos…" autocomplete="off"></label>
    <div class="inv-form-acts"><button type="button" data-inv="cancelar">Cancelar</button><span class="spacer"></span><button type="button" class="gold" data-inv="guardar">${f.id ? 'Guardar' : 'Añadir al inventario'}</button></div></section>`;
}
function leerFormulario() {
  const v = id => ($(id)?.value ?? '').trim(), o = { ...V.form.o };
  Object.assign(o, { nombre: v('#ivNom'), cat: v('#ivCat') || o.cat, cantidad: v('#ivCant'), peso: v('#ivPeso'), valor: v('#ivValor'), notas: v('#ivNotas') });
  if (o.cat === 'arma' && $('#ivDano')) o.arma = { ...(o.arma || {}), dano: v('#ivDano'), tipo: v('#ivTipo'), bono: parseInt(v('#ivBonoA'), 10) || 0, props: v('#ivProps').split(',').map(x => x.trim()).filter(Boolean), maestria: v('#ivMaes'), distancia: v('#ivDist') };
  if (o.cat === 'armadura' && $('#ivBase')) {
    o.armadura = { ...(o.armadura || {}), tipo: v('#ivArmT'), base: parseInt(v('#ivBase'), 10) || 0, dex: $('#ivDex') ? v('#ivDex') : 'todo', bono: parseInt(v('#ivBonoR'), 10) || 0 };
    if ($('#ivFue')) Object.assign(o.armadura, { fue: parseInt(v('#ivFue'), 10) || 0, sigilo: !!$('#ivSig')?.checked });
  }
  if (o.cat !== 'arma') delete o.arma; if (o.cat !== 'armadura') delete o.armadura;
  return o;
}

// ——— Inspector: la ficha del objeto con todo lo que se puede hacer con él ———
const dato = (t, v, cls = '') => (v === '' || v == null ? '' : `<div class="inv-dato ${cls}"><small>${t}</small><b>${v}</b></div>`);
function inspector(ch) {
  if (V.hueco) return selector(ch);
  const o = buscar(ch, V.sel); if (!o) { V.sel = null; return ''; }
  const R = reglas(ch), r = o.rasgo && R.find(x => x.id === o.rasgo), usados = r ? usosGastados(ch, r) : 0;
  const at = o.arma ? ataqueArma(ch, o) : null, req = o.armadura ? requisitosArmadura(o) : null, mu = o.arma ? municionDe(ch, o) : null;
  const conTexto = o.clave && biblioteca().objetos.some(x => x.clave === o.clave), cura = curacionDe(o), venta = precioVenta(o);
  const cat = (CATEGORIAS.find(c => c[0] === o.cat) || [])[1] || '';
  const sub = [cat, o.rareza, o.sintonia ? `requiere sintonización${o.sintoniaCon ? ` (${o.sintoniaCon.replace(/^parte de /, '')})` : ''}` : '', o.guardado ? 'en el alijo' : '', o.gastado ? 'sin magia' : ''].filter(Boolean).join(' · ');
  const usosDia = (o.usos || []).map(id => R.find(x => x.id === id)).filter(Boolean), uso = usoDe(o), fueEf = statsEfectivos(ch).fue || 10;
  const datos = [
    at && dato('Ataque', esc(at.ataque)), at && dato('Daño', esc(at.dano)), at?.versatil && dato('A dos manos', esc(at.versatil.dano)),
    o.arma?.distancia && dato('Alcance', esc(o.arma.distancia)), o.arma?.maestria && dato('Maestría', `${esc(o.arma.maestria)}${at.domina ? ' ✦' : ''}`, at.domina ? 'bien' : ''),
    o.armadura && dato(esEscudo(o) ? 'Escudo' : 'Clase de armadura', esc(claveCorta(ch, o))),
    req && !esEscudo(o) && dato('Tipo', esc(o.armadura.tipo)),
    req?.fue && dato('Fuerza', `${req.fue}${fueEf < req.fue ? ' · −3 m' : ''}`, fueEf < req.fue ? 'mal' : ''),
    req?.sigilo && dato('Sigilo', 'Desventaja', 'mal'),
    cura && dato('Curación', `${cura} PG`, 'bien'),
    dato('Peso', o.peso ? `${kg(o.peso)}${o.cantidad > 1 ? ` · ${kg(o.peso * o.cantidad)} en total` : ''}` : '—'),
    o.valor && dato('Valor', esc(o.valor)),
  ].filter(Boolean).join('');
  const props = o.arma ? [...(o.arma.props || [])].map(p => `<span class="inv-prop">${esc(p)}</span>`).join('') : '';
  const notas = [...(at?.notas || []), ...(at?.estilos || [])];
  const unaMano = vaEnMano(o) && !aDosManos(o);
  const equipa = !(vaEnMano(o) || o.armadura) ? ''
    : o.equipado ? `<button type="button" class="gold" data-insp="desequipar">${gi('inv_mochila')}${o.armadura && !esEscudo(o) ? 'Quitarse' : 'Soltar'}</button>`
      : unaMano ? `<button type="button" class="gold" data-insp="equipar" data-mano="principal">${gi('inv_mano')}Mano principal</button><button type="button" data-insp="equipar" data-mano="secundaria">${gi('inv_mano')}Secundaria</button>`
        : `<button type="button" class="gold" data-insp="equipar">${gi(o.armadura ? 'o_armadura' : 'inv_mano')}${o.armadura ? 'Ponérsela' : 'Empuñar a dos manos'}</button>`;
  const acciones = [
    equipa,
    o.sintonia && !o.guardado ? `<button type="button" class="${o.sintonizado ? '' : 'gold'}" data-insp="sintonia">${gi('sintonia')}${o.sintonizado ? 'Deshacer la sintonía' : 'Sintonizar'}</button>` : '',
    uso ? `<button type="button" class="${uso.accion === 'usar' ? '' : 'gold'}" data-insp="usar" ${o.cantidad ? '' : 'disabled'}>${gi(uso.accion === 'beber' ? 'inv_beber' : uso.accion === 'leer' ? 'libro' : 'o_pocion')}${esc(uso.etiqueta)}</button>` : '',
    `<button type="button" data-insp="alijo">${gi(o.guardado ? 'inv_mochila' : 'inv_alijo')}${o.guardado ? 'Llevar encima' : 'Dejar en el alijo'}</button>`,
    venta ? `<button type="button" data-insp="vender">${gi('inv_vender')}Vender por ${po(venta)}</button>` : '',
    conTexto ? `<button type="button" data-eqver="${esc(o.clave)}">${gi('libro')}Leer</button>` : '',
  ].filter(Boolean).join('');
  return `<div class="inv-velo" data-insp="cerrar"></div>
  <section class="inv-insp ${rarK(o)} ${enUso(ch, o) ? 'on' : ''}" role="dialog" aria-modal="true" aria-labelledby="inspT" tabindex="-1">
    <header class="inv-insp-h"><span class="inv-insp-ico">${gi(icoDe(o))}</span>
      <div><h3 id="inspT">${esc(o.nombre)}</h3><p>${esc(sub)}</p>${enUso(ch, o) ? `<span class="inv-uso">${gi(o.sintonizado && !o.equipado ? 'sintonia' : 'inv_mano')}${esc(o.sintonizado && !o.equipado ? 'Sintonizado' : donde(o))}${o.sintonizado && o.equipado ? ' · sintonizado' : ''}</span>` : ''}</div>
      <button type="button" class="iconbtn sm" data-insp="cerrar" aria-label="Cerrar">×</button></header>
    <div class="inv-insp-b">
      ${datos ? `<div class="inv-datos">${datos}</div>` : ''}
      ${props ? `<div class="inv-props">${props}</div>` : ''}
      ${efectoTexto(o) ? `<p class="inv-ef">${gi('inspiracion')}${efectoTexto(o)}</p>` : ''}
      ${notas.length ? `<ul class="inv-notas">${notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${r ? `<div class="inv-cargas"><small>Cargas</small><span class="inv-pips">${Array.from({ length: Math.min(r.max, 20) }, (_, i) => `<i class="${i < r.max - usados ? 'on' : ''}"></i>`).join('')}</span><b>${r.max - usados}/${r.max}</b>
        <button type="button" class="chip" data-insp="carga" data-d="1" ${usados >= r.max ? 'disabled' : ''}>Gastar</button><button type="button" class="chip" data-insp="carga" data-d="-1" ${usados ? '' : 'disabled'}>Recuperar</button></div>` : ''}
      ${usosDia.map(u => { const g = usosGastados(ch, u), q = u.max - g; return `<div class="inv-cargas"><small>${esc(u.nombre.replace(`${o.nombre}: `, '').replace(o.nombre, 'Uso'))}</small><span class="inv-pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < q ? 'on' : ''}"></i>`).join('')}</span><b>${q}/${u.max}</b>
        <button type="button" class="chip" data-insp="usodia" data-rid="${u.id}" data-d="1" ${g >= u.max ? 'disabled' : ''}>Usar</button><button type="button" class="chip" data-insp="usodia" data-rid="${u.id}" data-d="-1" ${g ? '' : 'disabled'}>Recuperar</button></div>`; }).join('')}
      ${o.sintonia && !o.sintonizado && requisitoSintonia(ch, o) ? `<p class="inv-nota mal">${esc(requisitoSintonia(ch, o))}</p>` : ''}
      ${mu ? `<div class="inv-mun ${mu.cantidad ? '' : 'mal'}">${gi('inv_municion')}<span><b>${esc(mu.nombre)}</b> · quedan ${mu.cantidad}</span><button type="button" class="chip" data-insp="disparo" ${mu.cantidad ? '' : 'disabled'}>Gastar una</button></div>` : ''}
      ${APILABLE.has(o.cat) || o.cantidad > 1 ? `<div class="inv-cant"><small>Cantidad</small><span class="inv-qty"><button type="button" data-invcant="${o.id}|-1" aria-label="Quitar uno">−</button><b>${o.cantidad}</b><button type="button" data-invcant="${o.id}|1" aria-label="Añadir uno">+</button></span></div>` : ''}
      ${o.notas ? `<p class="inv-nota">${esc(o.notas)}</p>` : ''}
      <div class="inv-insp-acts">${acciones}</div>
      <div class="inv-insp-pie"><button type="button" class="ghost" data-invedit="${o.id}">${icon('quill')}Editar</button><span class="spacer"></span><button type="button" class="ghost warn" data-eqdel="${o.id}">${icon('trash')}Quitar del inventario</button></div>
    </div>
  </section>`;
}
// Elegir qué va en una ranura del maniquí
function selector(ch) {
  const k = V.hueco, eq = equipoDe(ch), m = manos(ch);
  const vale = o => !o.guardado && (k === 'armadura' ? o.armadura && !esEscudo(o) : k === 'sintonia' ? o.sintonia && !o.sintonizado : vaEnMano(o));
  const actual = k === 'armadura' ? armaduraPuesta(ch) : k === 'sintonia' ? null : m[k];
  const ops = eq.objetos.filter(o => vale(o) && o !== actual).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const titulo = k === 'sintonia' ? 'Sintonizar un objeto' : `${HUECOS[k]}: ¿qué llevas?`;
  const lleno = k === 'sintonia' && sintonizados(ch).length >= MAX_SINTONIA;
  return `<div class="inv-velo" data-insp="cerrar"></div>
  <section class="inv-insp sel" role="dialog" aria-modal="true" aria-labelledby="inspT" tabindex="-1">
    <header class="inv-insp-h"><span class="inv-insp-ico">${gi(k === 'armadura' ? 'o_armadura' : k === 'sintonia' ? 'sintonia' : 'inv_mano')}</span>
      <div><h3 id="inspT">${titulo}</h3><p>${k === 'sintonia' ? 'Hasta tres objetos a la vez; sintonizar lleva un descanso corto' : k === 'armadura' ? 'Solo se lleva una armadura a la vez' : 'Las armas a dos manos ocupan las dos'}</p></div>
      <button type="button" class="iconbtn sm" data-insp="cerrar" aria-label="Cerrar">×</button></header>
    <div class="inv-insp-b">
      ${lleno ? '<p class="note">Ya tienes tres objetos sintonizados. Deshaz una sintonía antes.</p>' : ''}
      ${ops.length ? `<ul class="inv-ops">${ops.map(o => `<li><button type="button" class="inv-op ${rarK(o)} ${o.equipado ? 'on' : ''}" data-elige="${o.id}" ${lleno ? 'disabled' : ''}>
        <span class="obj-ico">${gi(icoDe(o))}</span><span class="obj-t"><b>${esc(o.nombre)}</b><small>${esc([claveCorta(ch, o), aDosManos(o) ? 'a dos manos' : '', o.equipado ? donde(o).toLowerCase() : ''].filter(Boolean).join(' · '))}</small></span></button></li>`).join('')}</ul>`
        : `<p class="note">No llevas nada que vaya aquí. Añádelo desde «Añadir objeto»${k === 'sintonia' ? ' o desde la biblioteca de objetos mágicos' : ''}.</p>`}
      ${actual ? `<div class="inv-insp-acts"><button type="button" data-insp="vaciar">${gi('inv_mochila')}Dejar libre (${esc(actual.nombre)} a la mochila)</button></div>` : ''}
    </div>
  </section>`;
}

function render() {
  const ch = S.cur(); if (!ch) return;
  const eq = equipoDe(ch), R = reglas(ch), n = eq.objetos.reduce((s, o) => s + (o.cantidad || 0), 0);
  $('#eqHead').innerHTML = `${avatarHtml(ch, 'md')}<div><h2 id="eqTitle">Inventario de ${esc(ch.nombre)}</h2><div class="dsub">${eq.objetos.length ? `${n} ${n === 1 ? 'objeto' : 'objetos'} · ${kg(pesoTotal(ch))} encima · ${po(valorMonedas(ch) + valorObjetos(ch))} en total` : 'Lo que lleva encima: armas, armadura, equipo, provisiones y tesoros'}</div></div>`;
  const hay = CATEGORIAS.filter(([k]) => eq.objetos.some(o => o.cat === k));
  if (V.cat && !hay.some(([k]) => k === V.cat)) V.cat = '';
  const q = norm(V.q.trim());
  const pasa = o => (!V.cat || o.cat === V.cat) && (!q || norm(`${o.nombre} ${o.notas} ${o.tipo || ''} ${o.rareza || ''}`).includes(q));
  const encima = eq.objetos.filter(o => !o.guardado && pasa(o)), alijo = eq.objetos.filter(o => o.guardado && pasa(o));
  let h = maniqui(ch) + avisos(ch) + medidores(ch);
  if (V.monedas) h += bolsaMonedas(ch);
  h += V.form ? formulario() : `<div class="inv-barra"><button type="button" class="gold" data-inv="nuevo">${icon('plus')}Añadir objeto</button><button type="button" data-eq="bib">${gi('biblioteca')}Objetos mágicos</button>
    <span class="spacer"></span>${eq.objetos.length ? `<span class="inv-vistas" role="group" aria-label="Vista"><button type="button" class="inv-vista" data-vista="rejilla" aria-pressed="${V.vista === 'rejilla'}" aria-label="Casillas" title="Casillas">${icon('grid')}</button><button type="button" class="inv-vista" data-vista="lista" aria-pressed="${V.vista === 'lista'}" aria-label="Lista" title="Lista">${icon('list')}</button></span>` : ''}</div>`;
  if (eq.objetos.length) h += `<div class="inv-tools"><input type="search" id="ivQ" value="${esc(V.q)}" placeholder="Buscar en el inventario" aria-label="Buscar en el inventario" autocomplete="off">
    ${hay.length > 1 ? `<div class="inv-cats" role="radiogroup" aria-label="Categoría"><button type="button" role="radio" aria-checked="${!V.cat}" data-invcat="">Todo</button>${hay.map(([k, t, ico]) => `<button type="button" role="radio" aria-checked="${V.cat === k}" data-invcat="${k}">${gi(ico)}${esc(t)}<small>${eq.objetos.filter(o => o.cat === k).length}</small></button>`).join('')}</div>` : ''}</div>`;
  if (!eq.objetos.length) h += `<div class="bib-empty">${gi('inv_bolsa')}<p>La mochila está vacía.</p><p class="note">Añade lo que lleva: elige de la lista de objetos comunes (con su peso y, en las armas y armaduras, su daño y su CA) o escríbelo a mano. Los objetos mágicos se añaden desde la biblioteca, con sus cargas.</p></div>`;
  else if (!encima.length && !alijo.length) h += '<p class="pempty">Nada coincide con la búsqueda.</p>';
  else {
    if (encima.length) h += `<section class="inv-zona" aria-label="Mochila"><h3>${gi('inv_mochila')}Mochila<small>${kg(pesoTotal(ch))} con las monedas</small></h3>${grupos(ch, encima, R)}</section>`;
    if (alijo.length) h += `<section class="inv-zona inv-alijo" aria-label="Alijo"><h3>${gi('inv_alijo')}Alijo<small>${kg(pesoGuardado(ch))} · no cuenta en la carga</small></h3>
      <p class="note">Lo que dejas en la posada, el carro o el campamento. No lo llevas encima ni puedes usarlo hasta recogerlo.</p>${grupos(ch, alijo, R)}</section>`;
  }
  $('#eqBody').innerHTML = h;
  $('#eqFoot').innerHTML = `<span class="spacer"></span><button type="button" data-close>Cerrar</button>`;
  pintarInspector(ch);
  efectoPendiente();
}
function pintarInspector(ch = S.cur()) {
  const el = $('#eqInsp'), abierto = !!(V.sel || V.hueco), h = abierto && ch ? inspector(ch) : '';
  const nuevo = !el.classList.contains('abierto') && !!h;
  el.innerHTML = h; el.classList.toggle('abierto', !!h);
  if (nuevo) el.querySelector('.inv-insp')?.focus({ preventScroll: true });
}
// Los efectos se lanzan tras repintar, sobre el elemento nuevo
function efectoPendiente() {
  const fx = V.fx; V.fx = null; if (!fx || reducedMotion()) return;
  requestAnimationFrame(() => {
    for (const { sel, cls, chispas = true, color } of [].concat(fx)) {
      const el = dlg().querySelector(sel); if (!el) continue;
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 1100);
      if (chispas) burstFrom(el, { color: color || hexDe(el, getComputedStyle(el).getPropertyValue('--rar').trim() || 'var(--gold)'), n: 26, speed: 3, up: 1.4, life: 850, size: 2 });
    }
  });
}
export function openEquipo(sel = null) {
  if (!S.cur()) return; V.form = null; V.sel = sel; V.hueco = null; render(); openSheet(dlg());
  const b = $('#eqBody'); if (reducedMotion()) return;
  b.classList.add('fx-abre'); clearTimeout(b.__fxT); b.__fxT = setTimeout(() => b.classList.remove('fx-abre'), 900);
}

// ——— Acciones ———
function soltarAviso(r) {
  const q = r?.quitados || []; if (!q.length) return '';
  return ` ${q.map(o => `<b>${esc(o.nombre)}</b>`).join(' y ')} ${q.length > 1 ? 'vuelven' : 'vuelve'} a la mochila.`;
}
function equiparYa(id, mano = '') {
  let r; const h = S.edit((db, ch) => { r = equipar(ch, id, mano); }); if (!r) return;
  haptic(); V.sel = null; V.hueco = null;
  const k = r.o.armadura && !esEscudo(r.o) ? 'armadura' : r.o.mano === 'ambas' ? 'principal' : r.o.mano;
  V.fx = [{ sel: `.inv-hueco.h-${k}`, cls: 'fx-forja' }, ...r.quitados.map(o => ({ sel: `[data-oid="${o.id}"]`, cls: 'fx-vuelve', chispas: false }))];
  repintar();
  toast(`<b>${esc(r.o.nombre)}</b>: ${esc(r.o.armadura && !esEscudo(r.o) ? 'puesta' : donde(r.o).toLowerCase())}.${soltarAviso(r)}`, [undoBtn(S, h)]);
}
function sintonizarYa(id) {
  const motivo = motivoSintonia(S.cur(), id);
  if (motivo) { toast(`${esc(motivo)}${/Ya hay/.test(motivo) ? ' (sintonizar lleva un descanso corto)' : ''}`); return; }
  let o; const h = S.edit((db, ch) => { alternarSintonia(ch, id); o = buscar(ch, id); });
  haptic(); V.hueco = null;
  if (o.sintonizado) { V.sel = null; V.fx = { sel: `.inv-gema[data-hid="${o.id}"]`, cls: 'fx-sinto' }; }
  repintar();
  toast(`<b>${esc(o.nombre)}</b> ${o.sintonizado ? 'sintonizado' : 'ya no está sintonizado'}.`, [undoBtn(S, h)]);
}
function usarYa(id) {
  const ch0 = S.cur(), o0 = buscar(ch0, id), uso = usoDe(o0); if (!uso || (uso.accion !== 'leer' && !o0?.cantidad)) return;
  const el = dlg().querySelector(`[data-oid="${id}"]`) || dlg().querySelector('.inv-insp');
  let r; const h = S.act(`${uso.accion === 'leer' ? 'Lee' : uso.accion === 'beber' ? 'Bebe' : 'Usa'} ${o0.nombre}`, (db, ch) => { r = usarObjeto(ch, id); });
  if (!r) return;
  haptic('light');
  if (r.curado || r.tirada && !r.dano) golpe('cura', r.curado);
  if (el && !reducedMotion()) burstFrom(el, r.curado ? { color: '#E2566A', n: 34, speed: 3.4, up: 2.4, life: 1000 } : { color: '#7FD1A8', n: 18, speed: 2.4, up: 2, life: 800 });
  repintar();
  const partes = [];
  if (r.tirada && !r.dano) partes.push(`${esc(curacionDe(o0))} (${esc(r.tirada.detalle)}) = <b>${r.tirada.total}</b>. ${r.curado ? `Recuperas <b>${r.curado}</b> PG.` : 'Ya estabas al máximo.'}`);
  if (r.dano) partes.push(`Sufres <b>${r.dano}</b> de daño (${esc(r.tirada.detalle)}).`);
  if (r.temp) partes.push(`<b>${r.temp}</b> PG temporales.`);
  if (r.texto) partes.push(esc(r.texto));
  if (r.quitados.length) partes.push(`Ya no estás ${esc(r.quitados.join(', '))}.`);
  if (uso.accion === 'usar' && !partes.length) partes.push(r.o.cantidad ? `Quedan ${r.o.cantidad}.` : 'Se ha acabado.');
  toast(`${uso.accion === 'leer' ? 'Lees' : uso.accion === 'beber' ? 'Bebes' : 'Usas'} <b>${esc(o0.nombre)}</b>. ${partes.join(' ')}`, [undoBtn(S, h)]);
}
async function venderYa(id) {
  const o0 = buscar(S.cur(), id); if (!o0) return;
  let n = 1;
  if (o0.cantidad > 1) {
    const v = await pedir({ titulo: `Vender ${o0.nombre}`, texto: `¿Cuántos vendes? Te dan ${po(precioVenta(o0))} por cada uno${o0.cat === 'tesoro' ? ' (los tesoros se venden por su valor)' : ' (la mitad de su precio)'}.`, valor: String(o0.cantidad), tipo: 'number', min: 1, max: o0.cantidad, ok: 'Vender' });
    if (v == null) return; n = Math.max(1, Math.min(o0.cantidad, parseInt(v, 10) || 1));
  }
  const el = dlg().querySelector('.inv-insp') || dlg().querySelector(`[data-oid="${id}"]`);
  let r; const h = S.act(`Vende ${n > 1 ? `${n} × ` : ''}${o0.nombre}`, (db, ch) => { r = venderObjeto(ch, id, n); });
  if (el && !reducedMotion()) burstFrom(el, { color: '#F0C060', n: 30, speed: 3.2, up: 2.2, life: 950 });
  haptic(); if (!buscar(S.cur(), id)) V.sel = null;
  V.fx = { sel: '.inv-mon', cls: 'fx-tintineo', chispas: false };
  repintar(); toast(`Vendes ${n > 1 ? `${n} × ` : ''}<b>${esc(o0.nombre)}</b> por <b>${po(r.precio)}</b>.`, [undoBtn(S, h)]);
}
async function monedasYa(que) {
  if (que === 'juntar') {
    let n = 0; const h = S.edit((db, ch) => { n = juntarMonedas(ch); });
    V.fx = { sel: '.inv-monedero', cls: 'fx-tintineo', chispas: false }; repintar();
    return toast(n ? `Monedas juntadas: <b>${n}</b> menos en la bolsa.` : 'Ya estaban juntas.', n ? [undoBtn(S, h)] : []);
  }
  const v = await pedir({ titulo: que === 'pagar' ? 'Pagar' : 'Cobrar', texto: que === 'pagar' ? `¿Cuánto pagas, en piezas de oro? Tienes ${po(valorMonedas(S.cur()))}. Puedes escribir decimales: 0,5 son 5 pp.` : '¿Cuánto recibes, en piezas de oro? Entra como oro, plata y cobre.', tipo: 'text', ok: que === 'pagar' ? 'Pagar' : 'Cobrar' });
  const x = parseFloat(String(v ?? '').replace(',', '.')); if (!(x > 0)) return;
  if (que === 'pagar' && enCobre(S.cur()) < Math.round(x * 100)) return toast(`No te llega: tienes ${po(valorMonedas(S.cur()))}.`);
  let r; const h = S.act(`${que === 'pagar' ? 'Paga' : 'Cobra'} ${po(x)}`, (db, ch) => { r = que === 'pagar' ? pagar(ch, x) : cobrar(ch, x); });
  if (!r) return;
  haptic(); V.fx = { sel: '.inv-mon', cls: 'fx-tintineo', color: '#F0C060' };
  repintar(); toast(que === 'pagar' ? `Pagas <b>${po(x)}</b>${r.cambio ? ` y te devuelven ${po(r.cambio)}` : ''}. Te quedan ${po(valorMonedas(S.cur()))}.` : `Cobras <b>${po(x)}</b>. Tienes ${po(valorMonedas(S.cur()))}.`, [undoBtn(S, h)]);
}
let repintar = () => {};

export function init(store) {
  S = store;
  const d = dlg();
  const capa = document.createElement('div'); capa.id = 'eqInsp'; capa.className = 'inv-capa'; d.append(capa);
  repintar = () => { const b = $('#eqBody'), y = b.scrollTop; render(); b.scrollTop = y; };
  const cerrarInsp = () => { V.sel = null; V.hueco = null; pintarInspector(); };
  on(d, 'click', '[data-eq="bib"]', () => openBiblioteca('objetos'));
  on(d, 'click', '[data-eqver]', (e, b) => abrirObjeto(b.dataset.eqver));
  on(d, 'click', '[data-invcat]', (e, b) => { V.cat = b.dataset.invcat; repintar(); });
  on(d, 'click', '[data-vista]', (e, b) => { V.vista = b.dataset.vista; try { localStorage.setItem(PREF_VISTA, V.vista); } catch { /* sin almacenamiento */ } repintar(); });
  on(d, 'click', '[data-inspec]', (e, b) => { V.sel = b.dataset.inspec; V.hueco = null; pintarInspector(); });
  on(d, 'click', '[data-hueco]', (e, b) => { if (b.dataset.hid) { V.sel = b.dataset.hid; V.hueco = null; } else { V.hueco = b.dataset.hueco; V.sel = null; } pintarInspector(); });
  on(d, 'click', '[data-elige]', (e, b) => (V.hueco === 'sintonia' ? sintonizarYa(b.dataset.elige) : equiparYa(b.dataset.elige, MANOS_DE[V.hueco])));
  on(d, 'click', '[data-insp]', (e, b) => {
    const a = b.dataset.insp, id = V.sel;
    if (a === 'cerrar') return cerrarInsp();
    if (a === 'vaciar') {
      const ch = S.cur(), x = V.hueco === 'armadura' ? armaduraPuesta(ch) : manos(ch)[V.hueco]; if (!x) return;
      const h = S.edit((db, c) => desequipar(c, x.id)); V.hueco = null; haptic(); V.fx = { sel: `[data-oid="${x.id}"]`, cls: 'fx-vuelve', chispas: false };
      repintar(); return toast(`<b>${esc(x.nombre)}</b> vuelve a la mochila.`, [undoBtn(S, h)]);
    }
    if (a === 'equipar') return equiparYa(id, b.dataset.mano || '');
    if (a === 'desequipar') { let o; const h = S.edit((db, ch) => { o = desequipar(ch, id); }); haptic(); V.sel = null; V.fx = { sel: `[data-oid="${id}"]`, cls: 'fx-vuelve', chispas: false }; repintar(); return toast(`<b>${esc(o.nombre)}</b> vuelve a la mochila.`, [undoBtn(S, h)]); }
    if (a === 'sintonia') return sintonizarYa(id);
    if (a === 'usar') return usarYa(id);
    if (a === 'vender') return venderYa(id);
    if (a === 'usodia') { Promise.resolve(stepResource(S, b.dataset.rid, +b.dataset.d)).then(() => repintar()); return; }
    if (a === 'carga') { const o = buscar(S.cur(), id); if (o?.rasgo) Promise.resolve(stepResource(S, o.rasgo, +b.dataset.d)).then(() => repintar()); return; }
    if (a === 'disparo') { const mu = municionDe(S.cur(), buscar(S.cur(), id)); if (!mu) return; let x; const h = S.edit((db, ch) => { x = cambiarCantidad(ch, mu.id, -1); }); haptic('light'); repintar(); return toast(`<b>${esc(x.nombre)}</b>: quedan ${x.cantidad}.`, [undoBtn(S, h)]); }
    if (a === 'alijo') {
      let o; const h = S.edit((db, ch) => { o = alternarGuardado(ch, id); }); haptic();
      V.fx = { sel: `[data-oid="${id}"]`, cls: 'fx-vuelve', chispas: false }; V.sel = null;
      repintar(); return toast(`<b>${esc(o.nombre)}</b> ${o.guardado ? 'se queda en el alijo: ya no pesa' : 'vuelve a la mochila'}.`, [undoBtn(S, h)]);
    }
  });
  on(d, 'click', '[data-inv]', (e, b) => {
    const a = b.dataset.inv;
    if (a === 'monedas') { V.monedas = !V.monedas; return repintar(); }
    if (a === 'pagar' || a === 'cobrar' || a === 'juntar') return monedasYa(a);
    if (a === 'nuevo') { V.form = { id: null, o: { cat: V.cat || 'equipo', cantidad: 1 } }; render(); return $('#ivNom')?.focus(); }
    if (a === 'cancelar') { V.form = null; return repintar(); }
    if (a === 'guardar') {
      const o = leerFormulario(); if (!o.nombre) { $('#ivNom').focus(); return toast('Escribe el nombre del objeto.'); }
      const id = V.form.id; let nuevo;
      const h = S.edit((db, ch) => { const eq = equipoDe(ch);
        if (id) { const i = eq.objetos.findIndex(x => x.id === id); if (i >= 0) eq.objetos[i] = normObjeto({ ...eq.objetos[i], ...o, id }); } else nuevo = anadirComun(ch, o); });
      V.form = null; haptic(); if (nuevo) V.fx = { sel: `[data-oid="${nuevo.id}"]`, cls: 'fx-nuevo' };
      repintar();
      toast(`<b>${esc(o.nombre)}</b> ${id ? 'guardado' : 'añadido al inventario'}.`, [undoBtn(S, h)]);
    }
  });
  on(d, 'click', '[data-invedit]', (e, b) => { const o = buscar(S.cur(), b.dataset.invedit); if (!o) return;
    V.sel = null; V.hueco = null; V.form = { id: o.id, o: JSON.parse(JSON.stringify(o)) }; render(); $('#eqBody').scrollTop = $('.inv-form')?.offsetTop - 12 || 0; $('#ivNom')?.focus({ preventScroll: true }); });
  on(d, 'click', '[data-inveq]', (e, b) => { const o = buscar(S.cur(), b.dataset.inveq); if (!o) return; if (o.equipado) { S.edit((db, ch) => desequipar(ch, o.id)); haptic(); repintar(); } else equiparYa(o.id); });
  on(d, 'click', '[data-invcant]', (e, b) => { const [id, n] = b.dataset.invcant.split('|'); S.edit((db, ch) => cambiarCantidad(ch, id, +n)); repintar(); });
  on(d, 'click', '[data-invusar]', (e, b) => usarYa(b.dataset.invusar));
  on(d, 'click', '[data-eqsin]', (e, b) => sintonizarYa(b.dataset.eqsin));
  on(d, 'click', '[data-eqdel]', (e, b) => {
    let o; const h = S.edit((db, ch) => { o = quitarObjeto(ch, b.dataset.eqdel); });
    V.sel = null; repintar(); toast(`<b>${esc(o?.nombre || 'Objeto')}</b> quitado.`, [undoBtn(S, h)]);
  });
  on(d, 'click', '[data-elegir="objeto"]', async (e, b) => { const inp = b.closest('.elg').querySelector('input'), v = await elegirObjetoComun(); if (v != null) ponerValor(inp, v); });
  // Arrastrar de la mochila al maniquí (con ratón)
  d.addEventListener('dragstart', e => { const t = e.target.closest?.('[data-arrastra]'); if (!t) return; e.dataTransfer.setData('text/x-objeto', t.dataset.arrastra); e.dataTransfer.effectAllowed = 'move'; d.classList.add('arrastrando'); });
  d.addEventListener('dragend', () => { d.classList.remove('arrastrando'); d.querySelectorAll('.sobre').forEach(x => x.classList.remove('sobre')); });
  d.addEventListener('dragover', e => { const t = e.target.closest?.('[data-soltar]'); if (!t || !e.dataTransfer.types.includes('text/x-objeto')) return; e.preventDefault(); t.classList.add('sobre'); });
  d.addEventListener('dragleave', e => e.target.closest?.('[data-soltar]')?.classList.remove('sobre'));
  d.addEventListener('drop', e => {
    const t = e.target.closest?.('[data-soltar]'), id = e.dataTransfer.getData('text/x-objeto'); if (!t || !id) return;
    e.preventDefault(); t.classList.remove('sobre'); d.classList.remove('arrastrando');
    const o = buscar(S.cur(), id), k = t.dataset.soltar; if (!o) return;
    if (k === 'sintonia') return o.sintonia ? (o.sintonizado ? null : sintonizarYa(id)) : toast(`<b>${esc(o.nombre)}</b> no necesita sintonización.`);
    if (k === 'armadura' ? !(o.armadura && !esEscudo(o)) : !vaEnMano(o)) return toast(`<b>${esc(o.nombre)}</b> no va ${k === 'armadura' ? 'puesta como armadura' : 'en la mano'}.`);
    equiparYa(id, MANOS_DE[k]);
  });
  d.addEventListener('cancel', e => { if (V.sel || V.hueco) { e.preventDefault(); cerrarInsp(); } });
  d.addEventListener('close', () => { V.sel = null; V.hueco = null; pintarInspector(); });
  d.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ivQ') { V.q = t.value; const pos = t.selectionStart; render(); const i = $('#ivQ'); i.focus(); i.setSelectionRange(pos, pos); }
    if (t.id === 'ivNom' && !V.form?.id) { const p = PREDEFINIDOS.find(x => norm(x.nombre) === norm(t.value)); if (p) { V.form.o = { ...JSON.parse(JSON.stringify(p)), cantidad: parseInt($('#ivCant')?.value, 10) || 1 }; render(); $('#ivNom').focus(); } }
  });
  d.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.moneda) { const k = t.dataset.moneda, v = Math.max(0, parseInt(t.value, 10) || 0); S.edit((db, ch) => { equipoDe(ch).monedas[k] = v; }); repintar(); }
    if (t.id === 'ivCat' || t.id === 'ivArmT') { V.form.o = leerFormulario(); if (t.id === 'ivArmT') V.form.o.armadura.tipo = t.value; render(); }
  });
  d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest?.('.inv-form') && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); d.querySelector('[data-inv="guardar"]')?.click(); } });
  S.subscribe?.(() => { if (d.open && !V.form) render(); });
}
const MANOS_DE = { principal: 'principal', secundaria: 'secundaria' };
