import { esc } from '../core/util.js';
import { capitulos } from '../domain/historia.js';

const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(«])\*(.+?)\*(?=[\s).,;:»]|$)/g, '$1<i>$2</i>').replace(/(^|[\s(«])_(.+?)_(?=[\s).,;:»]|$)/g, '$1<i>$2</i>');
export function mdDoc(md, q = '') {
  const caps = capitulos(md); let ci = 0;
  const bloques = String(md || '').replace(/\r/g, '').split(/\n{2,}/);
  let html = bloques.map(b => {
    const t = b.trim(); if (!t) return '';
    const h = /^(#{1,3})\s+(.+)$/.exec(t);
    if (h) { const c = caps[ci++]; return `<h${h[1].length + 1} id="doc-${c.id}" class="doc-h">${inline(h[2])}</h${h[1].length + 1}>`; }
    if (/^---+$/.test(t)) return '<hr class="doc-hr">';
    if (/^>\s?/.test(t)) return `<blockquote>${inline(t.replace(/^>\s?/gm, ''))}</blockquote>`;
    if (/^\*[^*].*\*$/.test(t) && t.length < 200) return `<p class="doc-sub">${inline(t.slice(1, -1))}</p>`;
    return `<p>${inline(t).replace(/\n/g, '<br>')}</p>`;
  }).join('');
  if (q && q.trim().length >= 2) {
    const re = new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    html = html.replace(/>([^<]+)</g, (m, txt) => '>' + txt.replace(re, '<mark>$1</mark>') + '<');
  }
  return html;
}
