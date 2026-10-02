import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { blankChar, normChar } from '../web/src/domain/personaje/modelo.js';
import { CLASES, perfil } from '../web/src/domain/reglas/reglas2024.js';
import { SUBCLASES, conjurosAutomaticos, escalas, progresion } from '../web/src/domain/clases/clases2024.js';
import { reglas, recState, recuperarEnDescanso } from '../web/src/domain/clases/rasgos.js';
import { rasgosEnJuego } from '../web/src/domain/clases/enJuego.js';
import { opcionesAlImpactar, danoSiempre } from '../web/src/domain/combate/alImpactar.js';
import { alTirarIniciativa, alEmpezarTurno, alGastarRecurso, curacionDeRecurso } from '../web/src/domain/combate/automatismos.js';
import { opcionesIntercambio } from '../web/src/domain/clases/intercambios.js';
import { opcionesDe } from '../web/src/domain/clases/opcionesRasgo.js';
import { canjesDe } from '../web/src/domain/clases/canjes.js';
import { PREDEFINIDOS, golpeSinArmas, claseArmadura } from '../web/src/domain/equipo/equipo.js';
import { velocidad, iniciativa } from '../web/src/domain/reglas/habilidades.js';
import { modsTirada, caEfectiva } from '../web/src/domain/combate/efectos.js';
import { pgMaximo } from '../web/src/domain/combate/vida.js';

const compendio = JSON.parse(fs.readFileSync(new URL('../web/public/data/compendio.json', import.meta.url), 'utf8')).conjuros;
const nombres = new Set(compendio.map(c => c.es.toLowerCase()));
const stats = { fue: 14, des: 14, con: 14, int: 14, sab: 14, car: 14 };
const armas = ['Espada larga', 'Arco largo', 'Daga'].map(n => JSON.parse(JSON.stringify(PREDEFINIDOS.find(p => p.nombre === n))));

function ejercitar(ch) {
  reglas(ch); escalas(ch); progresion(ch); perfil(ch); rasgosEnJuego(ch); opcionesDe(ch);
  claseArmadura(ch); caEfectiva(ch); velocidad(ch); iniciativa(ch); pgMaximo(ch);
  for (const sobre of ['ataque', 'salvacion', 'prueba', 'iniciativa']) modsTirada(ch, { sobre });
  for (const a of [...armas, golpeSinArmas(ch)]) { opcionesAlImpactar(ch, a); danoSiempre(ch, a); }
  opcionesIntercambio(ch, 'corto'); opcionesIntercambio(ch, 'largo'); opcionesIntercambio(ch, 'nivel');
  // Gasta un uso de cada recurso y lo que dispara, recupera con descansos, y dispara iniciativa y turno
  for (const r of reglas(ch)) {
    if (r.tipo !== 'recurso') continue;
    recState(ch, r.id).used = Math.min(r.max, 1); alGastarRecurso(ch, r.id); curacionDeRecurso(ch, r.id); canjesDe(ch, r.id);
    for (const t of ['corto', 'largo']) { const x = recuperarEnDescanso(r, 1, t); assert.ok(x.usados >= 0 && x.usados <= 1, `${r.nombre} ${t}`); }
  }
  alTirarIniciativa(ch); alEmpezarTurno(ch);
}

test('todas las clases y subclases, niveles 1 a 20: el motor responde y los conjuros automáticos existen', () => {
  let n = 0; const faltan = new Set();
  for (const clase of Object.keys(CLASES)) {
    for (const sub of ['', ...(SUBCLASES[clase] || []).map(s => s.nombre)]) {
      for (let nivel = 1; nivel <= 20; nivel++) {
        const ch = normChar(blankChar({ clase, subclase: nivel >= 3 ? sub : '', nivel, stats }));
        ejercitar(ch); n++;
        for (const c of conjurosAutomaticos(ch)) if (!nombres.has(c.nombre.toLowerCase())) faltan.add(`${clase}/${sub}: ${c.nombre}`);
      }
    }
  }
  assert.ok(n > 1000);
  assert.deepEqual([...faltan], [], 'conjuros siempre preparados que no están en el compendio');
});

test('multiclases de dos clases a nivel 20 (10/10): el motor responde', () => {
  const clases = Object.keys(CLASES);
  for (const a of clases) for (const b of clases) {
    if (a === b) continue;
    const sa = SUBCLASES[a]?.[0]?.nombre || '', sb = SUBCLASES[b]?.[0]?.nombre || '';
    ejercitar(normChar(blankChar({ clase: a, subclase: sa, nivel: 10, stats, multiclase: [{ clase: b, subclase: sb, nivel: 10 }] })));
  }
});

test('los recursos de todas las subclases a nivel 20 tienen máximo positivo y recarga válida', () => {
  for (const clase of Object.keys(CLASES)) for (const s of SUBCLASES[clase] || []) {
    const ch = normChar(blankChar({ clase, subclase: s.nombre, nivel: 20, stats }));
    for (const r of reglas(ch)) {
      if (r.tipo === 'al_lanzar') continue;
      assert.ok(r.max > 0, `${clase}/${s.nombre}: ${r.nombre} max ${r.max}`);
      assert.ok(['largo', 'corto', 'corto1', 'nunca', 'dado'].includes(r.recarga), `${r.nombre}: ${r.recarga}`);
    }
  }
});

test('todas las especies y sus linajes, de nivel 1 a 20: el motor responde y sus conjuros existen', async () => {
  const { LINAJES, conjurosEspecie, RASGOS_ESPECIE } = await import('../web/src/domain/origen/especies.js');
  const especies = { aasimar: 'Aasimar', draconido: 'Dracónido', elfo: 'Elfo', enano: 'Enano', gnomo: 'Gnomo', goliat: 'Goliat', humano: 'Humano', mediano: 'Mediano', orco: 'Orco', tiefling: 'Tiefling' };
  assert.deepEqual(Object.keys(RASGOS_ESPECIE).sort(), Object.keys(especies).sort());
  for (const [k, especie] of Object.entries(especies)) {
    const d = LINAJES.find(x => x.especie === k && x.cambia === 'fija'), ops = d ? d.opciones.map(o => o.nombre) : [''];
    for (const op of ops) for (const nivel of [1, 3, 5, 11, 17, 20]) {
      const ch = normChar(blankChar({ clase: 'Guerrero', nivel, stats, especie, opciones: op ? { [d.id]: op } : {} }));
      ejercitar(ch);
      for (const c of conjurosEspecie(ch, nivel)) assert.ok(nombres.has(c.nombre.toLowerCase()), `${especie} ${op}: ${c.nombre}`);
    }
  }
});
