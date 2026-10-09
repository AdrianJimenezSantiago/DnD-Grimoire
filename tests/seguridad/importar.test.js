import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normBd, cargarGuardado, bdDeEjemplo } from '../../web/src/domain/personaje/modelo.js';
import { esc } from '../../web/src/core/util.js';

// Una copia de seguridad o un personaje exportado puede venir de cualquiera: lo que llega se limpia antes de pintarse
const CARGA = '"\'><img src=x onerror=alert(1)>';
const hostil = () => ({
  schema: 2, activeId: '../../shared_prefs/x',
  catalog: { [`s${CARGA}`]: { id: `s${CARGA}`, es: 'Bola de fuego', level: 3 }, ok_1: { id: 'ok_1', es: 'Luz', level: 0 }, roto: null },
  chars: [{
    id: '../../shared_prefs/x', nombre: CARGA, book: [{ sid: `s${CARGA}` }, { sid: 'ok_1' }],
    rasgos: [{ id: 'tpl:mago.recuperacion', nombre: 'Recuperación arcana' }],
    retrato: { src: `x${CARGA}` },
    play: { efectos: [{ id: `e${CARGA}`, nombre: 'Bendición', objetivos: ['Orco', { malo: 1 }] }, null, 'x'], concObj: [3, 'Goblin'], conc: 'Bendición', log: [null] },
    diario: { sesiones: [{ id: 'ses_1', n: CARGA, titulo: CARGA, notas: [{ tipo: CARGA, texto: 'x' }, null] }] },
    bestiario: { criaturas: [{ id: 'bx_1', nombre: 'Trol', danos: { fuego: CARGA, frio: 'res' }, salv: { fue: CARGA }, conjuros: { s1: 'eficaz', s2: CARGA }, estados: 'no-es-lista', sesiones: [CARGA, 'ses_1'] }, 7] },
    equipo: { objetos: [{ id: 'ob_1', nombre: 'Coraza', cat: 'armadura', armadura: { base: CARGA, bono: '2', dex: CARGA, tipo: 'media' } }, { id: 'ob_2', nombre: 'Daga', cat: 'arma', arma: { dano: `1d4${CARGA}`, bono: '1d4' } }] },
  }, 'no-es-un-personaje', null],
});
const sinHtml = v => !/[<>"']/.test(String(v));

describe('importar datos de fuera', () => {
  test('los identificadores peligrosos se cambian y las referencias siguen enlazando', () => {
    const db = normBd(hostil()), c = db.chars[0];
    assert.equal(db.chars.length, 1);
    for (const k of Object.keys(db.catalog)) assert.ok(sinHtml(k) && !k.includes('/'), k);
    assert.ok(!c.id.includes('/') && sinHtml(c.id));
    assert.equal(db.activeId, c.id);
    assert.equal(c.book.length, 2);
    for (const e of c.book) assert.ok(db.catalog[e.sid], 'el conjuro sigue en el catálogo');
    assert.equal(c.rasgos[0].id, 'tpl:mago.recuperacion', 'los ids propios de la app no cambian');
    assert.ok(sinHtml(c.play.efectos[0].id));
  });
  test('el retrato solo puede ser una imagen incrustada', () => {
    assert.equal(normBd(hostil()).chars[0].retrato, null);
    const d = hostil(); d.chars[0].retrato = { src: 'https://rastreador.example/pixel.png' };
    assert.equal(normBd(d).chars[0].retrato, null, 'nada de imágenes remotas');
    d.chars[0].retrato = { src: 'data:image/webp;base64,UklGRg==', x: 0.5, y: 0.5, z: 1 };
    assert.equal(normBd(d).chars[0].retrato.src, 'data:image/webp;base64,UklGRg==');
  });
  test('efectos, diario, bestiario y equipo llegan con sus tipos', () => {
    const c = normBd(hostil()).chars[0];
    assert.deepEqual(c.play.efectos.map(e => e.objetivos), [['Orco']]);
    assert.deepEqual(c.play.concObj, ['Goblin']);
    assert.ok(c.play.log.every(x => x && typeof x === 'object'));
    const s = c.diario.sesiones[0];
    assert.equal(typeof s.n, 'number'); assert.equal(s.notas.length, 1); assert.equal(s.notas[0].tipo, 'nota');
    const x = c.bestiario.criaturas[0];
    assert.equal(c.bestiario.criaturas.length, 1);
    assert.deepEqual(x.danos, { frio: 'res' }); assert.deepEqual(x.salv, {}); assert.deepEqual(x.conjuros, { s1: 'eficaz' });
    assert.deepEqual(x.estados, []); assert.ok(x.sesiones.every(v => typeof v === 'string'));
    const [cor, daga] = c.equipo.objetos;
    assert.equal(cor.armadura.base, 0); assert.equal(cor.armadura.bono, 2); assert.equal(cor.armadura.dex, 'todo');
    assert.equal(daga.arma.dano, ''); assert.equal(daga.arma.bono, '1d4');
  });
  test('lo guardado que no se puede leer se marca para apartarlo, no se pisa', () => {
    assert.equal(cargarGuardado('{roto', null).fallo, true);
    assert.equal(cargarGuardado(JSON.stringify(bdDeEjemplo()), null).fallo, undefined);
    assert.equal(cargarGuardado(null, null).fallo, false);
  });
  test('esc escapa también la comilla simple', () => {
    assert.equal(esc(`<a href='x'>"&`), '&lt;a href=&#39;x&#39;&gt;&quot;&amp;');
  });
});

describe('configuración segura', () => {
  const leer = r => fs.readFileSync(new URL(`../../${r}`, import.meta.url), 'utf8');
  test('la clave de firma del APK no está en el repositorio', () => {
    const ignorado = leer('.gitignore');
    for (const p of ['*.keystore', '*.jks', 'keystore.properties']) assert.ok(ignorado.includes(p), p);
    assert.ok(!/storePassword\s*=/.test(leer('android/app/build.gradle')));
  });
  test('la web y la APK llevan una política de contenido que no deja ejecutar código inyectado', async () => {
    const vite = leer('web/vite.config.js'), vercel = leer('vercel.json');
    for (const t of [vite, vercel]) { assert.ok(t.includes("script-src-attr 'none'")); assert.ok(t.includes("object-src 'none'")); assert.ok(!/script-src[^;"]*unsafe-inline/.test(t)); }
  });
  test('el FileProvider de Android solo expone la caché', () => {
    const x = leer('android/app/src/main/res/xml/file_paths.xml');
    assert.ok(!/external-path|files-path|root-path/.test(x));
  });
});
