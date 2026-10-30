// Ficha impresa: pinta en blanco y negro, para papel A4 o PDF, los datos de la ficha del personaje activo antes de imprimir.
import { esc } from '../../core/util.js';
import { datosFicha } from '../../domain/presentacion/fichaImpresa.js';
import { $ } from '../componentes/dom.js';

const casilla = on => `<i class="im-c${on ? ' on' : ''}"></i>`;
const marcaHab = n => (n === 2 ? '<i class="im-c on doble"></i>' : casilla(n === 1));

export function fichaHtml(f) {
  const tabla = (cab, filas, cls = '') => `<table class="im-t ${cls}"><thead><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.join('')}</tbody></table>`;
  return `<header class="im-cab"><h1>${esc(f.nombre)}</h1><p>${esc(f.linea)}</p>${f.campana ? `<p class="im-camp">${esc(f.campana)}</p>` : ''}</header>
  <section class="im-vit">${f.vitales.map(([t, v, d]) => `<div class="im-caja"><small>${t}</small><b>${esc(v)}</b>${d ? `<em>${esc(d)}</em>` : ''}</div>`).join('')}</section>
  <div class="im-cols">
    <section class="im-car">${f.caracteristicas.map(c => `<div class="im-ab"><div class="im-ab-c"><small>${c.nombre}</small><b>${c.mod}</b><span>${c.valor}</span></div>
      <ul><li class="im-salv">${casilla(c.salvComp)}<span>Salvación</span><b>${c.salvacion}</b></li>${c.habilidades.map(h => `<li>${marcaHab(h.nivel)}<span>${esc(h.nombre)}</span><b>${h.bono}</b></li>`).join('')}</ul></div>`).join('')}
      <p class="im-pas">Pasivas: ${f.pasivas.map(([n, v]) => `${n} <b>${v}</b>`).join(' · ')}</p>
      ${f.estados.length ? `<p class="im-pas">Estados: ${f.estados.map(esc).join(', ')}</p>` : ''}
    </section>
    <section class="im-der">
      ${f.ataques.length ? `<h2>Ataques</h2>${tabla(['Arma', 'Ataque', 'Daño', 'Notas'], f.ataques.map(a => `<tr><td>${esc(a.nombre)}</td><td>${esc(a.ataque)}</td><td>${esc(a.dano)}${a.versatil ? `<br><small>a dos manos: ${esc(a.versatil)}</small>` : ''}</td><td><small>${esc([a.maestria && `Maestría: ${a.maestria}`, a.notas].filter(Boolean).join('; '))}</small></td></tr>`))}` : ''}
      ${f.rasgos.length ? `<h2>Rasgos y recursos</h2><ul class="im-rasgos">${f.rasgos.map(r => `<li><b>${esc(r.nombre)}.</b> ${esc(r.detalle)}</li>`).join('')}</ul>` : ''}
      ${f.competencias.length ? `<h2>Competencias</h2><dl class="im-dl">${f.competencias.map(([t, l]) => `<dt>${t}</dt><dd>${esc(l)}</dd>`).join('')}</dl>` : ''}
    </section>
  </div>
  ${f.conjuros.length ? `<section class="im-magia"><h2>Conjuros</h2>
    <p class="im-pas">${f.magia.map(m => `${m.aptitud}: CD <b>${m.cd}</b>, ataque <b>${esc(m.ataque)}</b>`).join(' · ')}${f.espacios.length ? ` · Espacios: ${f.espacios.map(e => `${e.nivel}.º ${'○'.repeat(e.n)}`).join('  ')}` : ''}</p>
    ${f.conjuros.map(g => `<h3>${g.titulo}${g.espacios ? ` <small>${g.espacios} espacios</small>` : ''}</h3>${tabla(['', 'Conjuro', 'Tiempo', 'Alcance', 'Duración', 'Comp.'], g.conjuros.map(c => `<tr><td>${g.nivel ? casilla(c.preparado) : ''}</td><td><b>${esc(c.nombre)}</b>${c.conc ? ' <abbr title="Concentración">C</abbr>' : ''}${c.ritual ? ' <abbr title="Ritual">R</abbr>' : ''}<br><small>${esc(c.escuela)}</small></td><td>${esc(c.tiempo)}</td><td>${esc(c.alcance)}</td><td>${esc(c.duracion)}</td><td><small>${esc(c.comp)}</small></td></tr>`), 'im-conj')}`).join('')}
  </section>` : ''}
  <section class="im-equipo"><h2>Equipo</h2>
    ${f.equipo.length ? `<ul class="im-obj">${f.equipo.map(o => `<li>${o.cantidad > 1 ? `${o.cantidad} × ` : ''}${esc(o.nombre)}${o.equipado ? ' <small>(equipado)</small>' : ''}${o.sintonizado ? ' <small>(sintonizado)</small>' : ''}</li>`).join('')}</ul>` : '<p class="im-pas">Sin objetos anotados.</p>'}
    <p class="im-pas">Carga: ${esc(f.carga)}${f.monedas.length ? ` · Monedas: ${f.monedas.map(([n, v]) => `${v} ${n.toLowerCase()}`).join(', ')}` : ''}</p>
  </section>
  ${f.notas ? `<section><h2>Notas</h2><p class="im-notas">${esc(f.notas)}</p></section>` : ''}
  <footer class="im-pie">Grimorio · ${esc(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }))}</footer>`;
}

export function prepararImpresion(S) {
  const ch = S.cur(), el = $('#impresion');
  if (!el) return false;
  el.innerHTML = ch ? fichaHtml(datosFicha(ch, S.db.catalog)) : '';
  document.documentElement.classList.toggle('con-ficha', !!ch);
  return !!ch;
}
export function init(S) {
  addEventListener('beforeprint', () => { if (!document.body.classList.contains('on-landing')) prepararImpresion(S); else document.documentElement.classList.remove('con-ficha'); });
}
