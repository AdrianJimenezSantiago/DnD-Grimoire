import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { aBestiario, arreglarDadosCon, arreglarDadosTexto, formasPosibles, leerCaracteristicas, limiteFormaSalvaje, leerCriaturas, vdNumero } from '../../web/src/domain/criaturas/monstruos.js';

const linea = (s, y, x = 50, h = 10) => ({ s, x, y, h });
const pagina = (lineas, p = 1) => ({ p, cols: [lineas.map((s, i) => (typeof s === 'string' ? linea(s, 900 - i * 16) : s)), []] });
const TROL = pagina([
  linea('TROL DEL VADO', 916, 50, 14),
  'Gigante Grande, caótico neutral',
  '¡ CA: 15 Iniciativa: +1 (11)',
  '| PG: 84 (8410 + 40)',
  'Velocidad: 9 m, nadar 6 m',
  'MOD. SALV MOD. SALV MOD. SALV',
  'Fue 18 +4 +4 Des 13 +1 +] Con +5 +5',
  'Int 7 -2 -2 Sam 9 -1 41 Car 7 =2 =2',
  'Habilidades: Percepción +2',
  'Vulnerabilidades: fuego',
  'Resistencias: ácido, frío',
  'Inmunidades: veneno; asustado, envenenado',
  'Sentidos: visión en la oscuridad 18 m; Percepción',
  'pasiva 12',
  'Idiomas: gigante',
  'VD: 4 (1100 PX; BC +2)',
  'ATRIBUTOS',
  'Regeneración. El trol recupera 10 puntos de golpe al principio de',
  'su turno salvo que haya sufrido daño de ácido o fuego.',
  'ACCIONES',
  'sex a Ataque múltiple. El trol realiza dos ataques de garra.',
  'Garra. Tirada de ataque cuerpo a cuerpo: +7, alcance 1,5 m.',
  'Acierto: 9 (244 + 4) de daño cortante.',
  'ACCIONES LEGENDARIAS',
  'Usos de acciones legendarias: 1. Justo después del turno de otra criatura.',
  'Rugido. El trol ruge.',
]);

describe('leerCriaturas', () => {
  test('un perfil leído con OCR, corregido por coherencia', () => {
    const [c] = leerCriaturas([TROL]);
    assert.equal(c.nombre, 'Trol del vado'); assert.equal(c.tipoBase, 'Gigante'); assert.equal(c.tamano, 'Grande'); assert.equal(c.alineamiento, 'caótico neutral');
    assert.equal(c.ca, 15); assert.equal(c.ini, 1);
    assert.equal(c.pg, '84 (8d10 + 40)');
    assert.deepEqual(c.car, [18, 13, 20, 7, 9, 7]);
    assert.deepEqual(c.salv, { sab: 1 });
    assert.equal(c.vdNum, 4); assert.equal(c.px, 1100); assert.equal(c.bc, 2);
    assert.equal(c.sentidos, 'visión en la oscuridad 18 m; Percepción pasiva 12');
    assert.deepEqual(c.danos, { fuego: 'vul', 'ácido': 'res', 'frío': 'res', veneno: 'inm' });
    assert.deepEqual(c.estadosInm, ['asustado', 'envenenado']);
    assert.deepEqual(c.rasgos.map(r => r[0]), ['Regeneración']);
    assert.deepEqual(c.acciones.map(r => r[0]), ['Ataque múltiple', 'Garra']);
    assert.match(c.acciones[1][1], /9 \(2d4 \+ 4\)/);
    assert.equal(c.legendarias[0][0], ''); assert.equal(c.legendarias[1][0], 'Rugido');
  });

  test('al bestiario van tipo, CA, PG, daños, estados y salvaciones', () => {
    const [c] = leerCriaturas([TROL]), b = aBestiario({ ...c, salv: { con: 8 } });
    assert.equal(b.tipo, 'Gigante'); assert.equal(b.ca, '15'); assert.equal(b.pg, '84');
    assert.equal(b.danos.fuego, 'vul'); assert.deepEqual(b.estados, ['asustado', 'envenenado']);
    assert.equal(b.salv.con, 'fuerte'); assert.equal(b.salv.int, 'debil');
  });

  test('dados, características y VD con errores típicos del OCR', () => {
    assert.equal(arreglarDadosCon('2010 + 6', 17), '2d10 + 6');
    assert.equal(arreglarDadosCon('348', 13), '3d8');
    assert.equal(arreglarDadosCon('1d8 + 3', 7), '1d8 + 3');
    assert.equal(arreglarDadosCon('raro', 5), 'raro');
    assert.equal(arreglarDadosTexto('Fallo: 13 (348) de daño psíquico.'), 'Fallo: 13 (3d8) de daño psíquico.');
    assert.equal(leerCaracteristicas('Fue 3 -1 -1').car.fue.v, 8);
    assert.equal(vdNumero('1/4'), 0.25); assert.equal(vdNumero('13'), 13);
  });

  test('nombres con restos de OCR o ilegibles se recuperan', () => {
    const bloque = (cab, rasgo) => [...cab, 'CA: 13 Iniciativa: +3 (13)', 'PG: 13 (3d8)', 'Velocidad: 12 m', 'VD: 1 (200 PX; BC +2)', 'ATRIBUTOS', rasgo];
    const [t] = leerCriaturas([pagina(bloque(['TIGRE.', 'Bestia Grande, sin alineamiento'], 'Olfato agudo. Ventaja en las pruebas.'))]);
    assert.equal(t.nombre, 'Tigre');
    const [j] = leerCriaturas([pagina(bloque(['Fl JABALÍ', 'Bestia Mediana, sin alineamiento'], 'Carga. Si se mueve 6 m.'))]);
    assert.equal(j.nombre, 'Jabalí');
    const [l] = leerCriaturas([pagina(bloque(['ll', 'll Bestia Mediana, sin alineamiento'], 'Atacar en manada. El lobo tiene ventaja en las tiradas de ataque.'))]);
    assert.equal(l.nombre, 'Lobo'); assert.ok(l.revisar.includes('nombre deducido del texto'));
    assert.equal(leerCriaturas([pagina(bloque(['ll', 'Bestia Mediana, sin alineamiento'], 'Mordisco. Si el objetivo es una criatura Mediana, la criatura tiene el estado de derribada.'))]).length, 0);
  });
});

describe('formasPosibles', () => {
  test('Forma salvaje por nivel y Círculo de la luna; filtro por VD y vuelo', () => {
    assert.deepEqual(limiteFormaSalvaje({ clase: 'Druida', nivel: 2 }), { vd: 0.25, vuelo: false, conocidas: 4, luna: false });
    assert.deepEqual(limiteFormaSalvaje({ clase: 'Druida', nivel: 8 }), { vd: 1, vuelo: true, conocidas: 8, luna: false });
    assert.equal(limiteFormaSalvaje({ clase: 'Druida', subclase: 'Círculo de la luna', nivel: 9 }).vd, 3);
    assert.equal(limiteFormaSalvaje({ clase: 'Druida', subclase: 'Círculo de la luna', nivel: 3 }).vd, 1);
    const cs = [{ nombre: 'Lobo', tipoBase: 'Bestia', vdNum: 0.25, vel: '12 m' }, { nombre: 'Búho', tipoBase: 'Bestia', vdNum: 0, vel: '1,5 m, volar 18 m' },
      { nombre: 'Oso pardo', tipoBase: 'Bestia', vdNum: 1, vel: '12 m' }, { nombre: 'Ogro', tipoBase: 'Gigante', vdNum: 2, vel: '12 m' }];
    assert.deepEqual(formasPosibles(cs, { vd: 0.25, vuelo: false }).map(c => c.nombre), ['Lobo']);
    assert.deepEqual(formasPosibles(cs, { vd: 1, vuelo: true }).map(c => c.nombre), ['Búho', 'Lobo', 'Oso pardo']);
    assert.deepEqual(formasPosibles(cs, { vd: 2, soloBestias: false }).map(c => c.nombre), ['Búho', 'Lobo', 'Oso pardo', 'Ogro']);
  });
});
