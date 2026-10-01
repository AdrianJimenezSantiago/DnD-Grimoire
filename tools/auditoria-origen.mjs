// Genera docs/auditoria-origen.md: atributos de especie y dotes (Manual del Jugador 2024 y Héroes de Faerûn) con lo que hace la app.
// Uso: node tools/auditoria-origen.mjs
import fs from 'node:fs';
import { RASGOS_ESPECIE, LINAJES } from '../web/src/domain/especies.js';
import { AUMENTO_DOTE } from '../web/src/domain/dotesDatos.js';

const TXT = { A: 'Automático', P: 'En parte', T: 'Se consulta' };
const ESP = {
  'Manos curativas': ['A', 'Contador; botón «Curarme» con competencia d4.'], 'Portador de luz': ['A', 'Luz siempre preparado.'], 'Resistencia celestial': ['A', 'Resistencia necrótica y radiante.'],
  'Visión en la oscuridad': ['A', 'Alcance en «En juego» (18 m; 36 m enano, orco y drow).'], 'Revelación celestial': ['A', 'Contador; al gastarlo pone la transformación (opción por uso): CD de Mortaja necrótica, daño de Fulgor interior y +competencia radiante o necrótico al impactar y en conjuros.'],
  'Linaje dracónico': ['A', 'Opción de dragón: tipo del aliento y resistencia.'], 'Ataque de aliento': ['A', 'Usos = competencia; CD, dados (1d10 a 4d10) y tipo; botón para tirar el daño.'],
  'Resistencia al daño': ['A', 'Resistencia del tipo del linaje.'], 'Vuelo dracónico': ['A', 'Nivel 5; contador; pone el efecto de vuelo 10 minutos.'],
  'Linaje élfico': ['A', 'Opción (alto elfo, drow, bosques): trucos y conjuros de nivel 3 y 5 con uso gratis diario; velocidad del elfo de los bosques y visión del drow; aptitud mágica (Int, Sab o Car) con su CD y ataque.'],
  'Linaje feérico': ['A', 'Ventaja en salvaciones contra hechizado.'], 'Sentidos agudos': ['A', 'Pide una habilidad.'], 'Trance': ['T', 'Resumen integrado; sin efecto mecánico.'],
  'Afinidad con la piedra': ['A', 'Contador (competencia).'], 'Aguante enano': ['A', '+1 PG por nivel.'], 'Resistencia enana': ['A', 'Resistencia al veneno y ventaja contra envenenado.'],
  'Astucia gnoma': ['A', 'Ventaja en salvaciones de Int, Sab y Car.'], 'Linaje gnomo': ['A', 'Opción (rocas, bosques): trucos; Hablar con los animales gratis (competencia) en el de los bosques; aptitud mágica (Int, Sab o Car).'],
  'Constitución poderosa': ['A', 'Ventaja para librarse de agarrado; carga ×2 (×4 en Forma grande).'], 'Forma grande': ['A', 'Nivel 5; contador; pone el efecto (ventaja en Fuerza, +3 m).'],
  'Linaje gigante': ['A', 'Opción; usos = competencia; Abrasión, Escarcha y Colinas al impactar; Piedra y Tormenta como reacción al recibir daño; Nubes avisa del teletransporte.'],
  'Diestro': ['A', 'Pide una habilidad (Humano (Diestro)).'], 'Ingenioso': ['A', 'Inspiración heroica en cada descanso largo.'], 'Versátil': ['A', 'Pide una dote de origen.'],
  'Agilidad de mediano': ['T', 'Resumen integrado; sin efecto mecánico.'], 'Fortuna': ['A', 'Los 1 en pruebas con d20 se repiten solos.'], 'Sigiloso por naturaleza': ['T', 'Resumen integrado; sin efecto mecánico.'], 'Valiente': ['A', 'Ventaja contra asustado.'],
  'Aguante incansable': ['A', 'Al caer a 0 PG, botón para quedarte a 1 PG (gasta el uso).'], 'Descarga de adrenalina': ['A', 'Contador (descanso corto); al gastarlo da PG temporales = competencia y pone Correr.'],
  'Legado infernal': ['A', 'Opción (abisal, ctónico, infernal): resistencia, truco y conjuros de nivel 3 y 5 con uso gratis; aptitud mágica (Int, Sab o Car) con su CD y ataque.'], 'Presencia sobrenatural': ['A', 'Taumaturgia siempre preparado, con la aptitud del legado.'],
};
const DOT = {
  afortunado: ['A', 'Puntos de suerte (competencia).'], alerta: ['A', '+competencia a la iniciativa.'], duro: ['A', '+2 PG por nivel.'], 'iniciado en la magia': ['A', 'Trucos y conjuro de nivel 1 con uso gratis.'],
  'maton de taberna': ['A', 'Golpe sin armas 1d4.'], musico: ['A', 'Aviso en los descansos.'], habilidoso: ['A', 'Pide tres habilidades o herramientas.'],
  'atacante a la carga': ['A', '+1d8 al impactar tras cargar.'], 'azote de magos': ['A', 'Mente robusta (descanso corto).'], 'duelista defensivo': ['A', 'Parada desde «En juego»: +competencia a la CA.'],
  'entrenamiento con armas marciales': ['A', 'Competencia con armas marciales.'], 'experto en habilidades': ['A', 'Habilidad y pericia.'], 'influencia feerica': ['A', 'Paso brumoso y un conjuro de nivel 1, gratis.'],
  'influencia sombria': ['A', 'Invisibilidad y un conjuro de nivel 1, gratis.'], 'lanzador en combate': ['A', 'Ventaja en concentración.'], 'lanzador ritual': ['A', 'Ritual rápido.'],
  'lider inspirador': ['A', 'PG temporales (nivel + mod.) al descansar.'], 'ligeramente acorazado': ['A', 'Entrenamiento.'], 'moderadamente acorazado': ['A', 'Entrenamiento.'], 'muy acorazado': ['A', 'Entrenamiento.'],
  'maestro de armas': ['A', 'Una maestría más.'], 'maestro en armaduras medias': ['A', 'Des +3 en armadura media con Des 16.'], 'maestro en armaduras pesadas': ['A', 'Botón para reducir el daño en tu competencia.'],
  'maestro en armas pesadas': ['A', '+competencia al daño con armas pesadas.'], 'mente aguda': ['A', 'Habilidad; Estudiar como acción adicional.'], observador: ['A', 'Habilidad; Buscar como acción adicional.'],
  resiliente: ['A', 'Competencia en la salvación elegida.'], resistente: ['A', 'Ventaja en salvaciones contra muerte.'], telepatico: ['A', 'Detectar pensamientos gratis.'], telequinetico: ['A', 'Mano de mago.'],
  veloz: ['A', '+3 m.'], 'don de la fortaleza': ['A', '+40 PG.'], 'don de la habilidad': ['A', 'Competencia en todas las habilidades.'], 'don de la recuperacion': ['A', 'Última defensa y reserva de 10d10.'],
  'don de la velocidad': ['A', '+9 m; Destrabarse como acción adicional.'], 'don del destino': ['A', 'Contador; se recupera al tirar iniciativa.'], 'don del recuerdo de conjuros': ['A', '1d4 al gastar un espacio de nivel 1-4.'],
  'chispa del fuego magico': ['A', 'Llama sagrada; usos como acción adicional.'], 'conjurador de frio': ['A', 'Rayo de escarcha.'], 'principiante del enclave esmeralda': ['A', 'Hablar con los animales.'],
  'magia del enclave': ['A', 'Sentidos de la bestia gratis.'], 'aprendiz del dragon purpura': ['A', 'Habilidad; contador.'], 'comandante del dragon purpura': ['A', 'Alentar a aliado; ventaja al atacar maltrecho.'],
  'embaucador feerico': ['A', 'Golpe desquiciador (contador).'], 'magia de genio': ['A', 'Contador.'], 'tocado por los mythales': ['A', 'Contador.'], 'iniciado del culto del dragon': ['A', 'Contador.'],
  dracosenalado: ['A', 'Resistencia elegida (entre paréntesis).'], 'don de la absorcion de almas': ['A', 'Resistencias y contador.'], 'don de la furia de la tormenta': ['A', 'Resistencias.'],
  'don de la resistencia desesperada': ['A', 'Resistencias estando maltrecho.'], 'don de la salud plena': ['A', 'Dados de golpe al máximo y +5 temporales.'], 'don del dominio de los venenos': ['A', 'Inmunidades.'],
  'don del terror': ['A', 'Inmune a asustado; contador.'], 'don del jolgorio': ['A', 'Baile irresistible de Otto gratis.'], 'don de las formas fluidas': ['A', 'Contador.'], 'don del fulgor exquisito': ['A', 'Contador.'],
  'determinacion senorial': ['A', 'Contador.'],
};
const n = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
let md = '# Auditoría de especies y dotes (reglas de 2024)\n\nGenerado por `tools/auditoria-origen.mjs`, contrastado con el Manual del Jugador de 2024 y Héroes de Faerûn.\n\n## Especies\n';
for (const [esp, rs] of Object.entries(RASGOS_ESPECIE)) {
  md += `\n### ${esp.charAt(0).toUpperCase() + esp.slice(1)}\n\n| Nivel | Atributo | Estado | Cómo lo aplica la app |\n|---|---|---|---|\n`;
  for (const [L, r] of rs) { const [e, t] = ESP[r] || ['T', '']; md += `| ${L} | ${r} | ${TXT[e]} | ${t || 'Texto en «En juego» con el manual importado.'} |\n`; }
  const lin = LINAJES.filter(d => d.especie === esp); for (const d of lin) md += `\n${d.rasgo}: ${d.opciones.map(o => o.nombre).join(', ')}.\n`;
}
md += '\n## Dotes\n\nTodas las dotes generales y dones épicos suben su característica al elegirlas en la subida de nivel (tabla integrada, sin necesidad del libro).\n\n| Dote | Aumento | Estado | Cómo lo aplica la app |\n|---|---|---|---|\n';
const nombres = [...new Set([...Object.keys(AUMENTO_DOTE), ...Object.keys(DOT)])].sort();
for (const k of nombres) { const [e, t] = DOT[k] || ['T', '']; md += `| ${k} | ${(AUMENTO_DOTE[k] || []).join(', ') || '—'} | ${TXT[e]} | ${t || 'Texto en «En juego» con el libro importado.'} |\n`; }
fs.writeFileSync(new URL('../docs/auditoria-origen.md', import.meta.url), md);
console.log('ok');
