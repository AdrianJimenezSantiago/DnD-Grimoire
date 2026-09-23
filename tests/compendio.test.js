import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { conjuros } = JSON.parse(fs.readFileSync(new URL('../web/public/data/compendio.json', import.meta.url)));

test('compendio: 391 conjuros con datos completos y claves únicas', () => {
  assert.equal(conjuros.length, 391);
  assert.equal(new Set(conjuros.map(c => c.k)).size, 391);
  for (const c of conjuros) for (const f of ['es', 'en', 'esc', 't', 'a', 'du', 'co']) assert.ok(c[f], `${c.es}: falta ${f}`);
  const porNivel = conjuros.reduce((a, c) => (a[c.l] = (a[c.l] || 0) + 1, a), {});
  assert.deepEqual(porNivel, { 0: 34, 1: 64, 2: 63, 3: 52, 4: 41, 5: 48, 6: 34, 7: 21, 8: 18, 9: 16 });
});
test('compendio: nombres oficiales de los conjuros de Theo', () => {
  const es = en => conjuros.find(c => c.en === en)?.es;
  assert.equal(es('Counterspell'), 'Contrahechizo'); assert.equal(es('Mind Sliver'), 'Fragmento mental');
  assert.equal(es('Toll the Dead'), 'Tañido por los muertos'); assert.equal(es('Tiny Hut'), 'Pequeña choza de Leomund');
});
