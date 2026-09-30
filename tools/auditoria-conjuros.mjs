// Genera docs/auditoria-conjuros.md: cada conjuro del compendio con lo que la app lee y aplica sola.
// Uso: node tools/auditoria-conjuros.mjs
import fs from 'node:fs';
import { analizarTiradas, tieneTiradas } from '../web/src/domain/tiradas.js';
import { tiradasBase, ajustarTiradas } from '../web/src/domain/tiradasBase.js';
import { efectoDeConjuro } from '../web/src/domain/efectos.js';
import { RECURSO_DE_CONJURO } from '../web/src/domain/rasgos.js';

const d = JSON.parse(fs.readFileSync(new URL('../web/public/data/compendio.json', import.meta.url), 'utf8')).conjuros;
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const dados = r => [...r.danos.map(x => `${x.n}d${x.caras}${x.bono ? '+' + x.bono : ''}${x.mod ? '+mod' : ''} ${x.tipo}${x.cond ? ' (condicional)' : ''}`),
  ...(r.curacion ? [`${r.curacion.n ? `${r.curacion.n}d${r.curacion.caras}` : ''}${r.curacion.bono ? '+' + r.curacion.bono : ''}${r.curacion.mod ? '+mod' : ''} ${r.curacion.temp ? 'PG temporales' : 'curación'}`] : [])].join(', ');
const escala = r => (r.veces ? (r.veces.truco ? 'rayos por nivel de personaje' : `+1 proyectil por espacio sobre ${r.veces.desde}`) : !r.escala ? '' : r.escala.tipo === 'truco' ? 'por nivel de personaje'
  : r.escala.porNivel ? `+${r.escala.porNivel} por espacio sobre ${r.escala.desde}` : `+${r.escala.n}d${r.escala.caras} por espacio sobre ${r.escala.desde}`);
let md = `# Auditoría de conjuros (compendio del SRD 5.2 y Manual del Jugador de 2024)

Generado por \`tools/auditoria-conjuros.mjs\`. Para cada conjuro: lo que la app lee de su texto (ataque, salvación, dados y
escalado) para tirarlo con un toque, el efecto que te aplica sola cuando te lo lanzas o te lo lanzan, y si algún rasgo o dote
permite lanzarlo sin gastar espacio. «Respaldo» indica que el SRD no trae su texto y la app usa sus datos mecánicos de 2024
hasta que importes el manual. Con el manual importado, la app lee el texto en español.

`;
let conDatos = 0;
for (let L = 0; L <= 9; L++) {
  const xs = d.filter(c => c.l === L).sort((a, b) => a.es.localeCompare(b.es, 'es'));
  md += `\n## ${L === 0 ? 'Trucos' : `Nivel ${L}`}\n\n| Conjuro | Escuela | C/R | Tirada | Dados | Escalado | Efecto automático / uso gratis |\n|---|---|---|---|---|---|---|\n`;
  for (const c of xs) {
    let r = analizarTiradas(c.d, c.h), base = false;
    if (!tieneTiradas(r) && !r.salvacion && tiradasBase(c.en)) { r = tiradasBase(c.en); base = true; }
    r = ajustarTiradas(r, c.en);
    const tir = [r.ataque ? `ataque ${r.ataque}` : '', r.salvacion ? `salvación de ${r.salvacion}${r.mitad ? ' (mitad)' : ''}` : ''].filter(Boolean).join('; ');
    const ef = efectoDeConjuro(c.es), rec = RECURSO_DE_CONJURO[norm(c.es)];
    const auto = [ef ? `${ef.nombre}${ef.bueno ? '' : ' (perjuicio)'}` : '', rec ? `gratis con ${rec.map(x => x.replace('tpl:', '')).join(' / ')}` : ''].filter(Boolean).join('; ');
    if (tir || dados(r) || auto) conDatos++;
    md += `| ${c.es}${base ? ' ·respaldo' : ''} | ${c.esc} | ${[c.c ? 'C' : '', c.ri ? 'R' : ''].filter(Boolean).join(' ') || '—'} | ${tir || '—'} | ${dados(r) || '—'} | ${escala(r) || '—'} | ${auto || '—'} |\n`;
  }
}
md = md.replace('\n## Trucos', `Conjuros con tirada, dados o efecto automático: ${conDatos} de ${d.length}. El resto son utilitarios (sin tiradas del lanzador).\n\n## Trucos`);
fs.writeFileSync(new URL('../docs/auditoria-conjuros.md', import.meta.url), md);
console.log(conDatos, d.length);
