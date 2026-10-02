import { norm, uid } from '../../core/util.js';
import { recState, usosGastados, reglas } from '../clases/rasgos.js';
import { perfil } from '../reglas/reglas2024.js';
import { curar } from '../combate/vida.js';
import { tirarExpr } from '../combate/automatismos.js';

// Lo que se puede HACER con un objeto mágico (Guía del Dungeon Master de 2024) y cuánto gasta:
//   recuperar: recupera un espacio de conjuro gastado de nivel nivMax o inferior (Perla de poder, Vara del pacto)
//   curar: recuperas puntos de golpe (Talismán de salud, Anillo de regeneración…)
//   conjuro: lanzas un conjuro desde el objeto gastando cargas (0 = a voluntad); nivel: versión del conjuro;
//            escala: hasta cuántas cargas, una más por nivel (varitas); porNivel: el coste es el nivel del conjuro (Bastón de curación);
//            cd/atk: los del objeto (si no, los tuyos)
//   tirada: gastas cargas para tirar unos dados (Bastón de impacto, Anillo del carnero)
//   uso: 'cargas' (las del objeto), 'diario' (una vez hasta el amanecer, contador propio), 'largo' (hasta un descanso largo) o 'libre'
// Revisado a mano contra el texto de la Guía: las tablas de los bastones salen del PDF con los costes mal leídos.
const C = (nombre, coste = 1, extra = {}) => ({ tipo: 'conjuro', nombre, coste, ...extra });
const DIA = (nombre, extra = {}) => C(nombre, 0, { uso: 'diario', ...extra });
const LIBRE = (nombre, extra = {}) => C(nombre, 0, { uso: 'libre', ...extra });
export const ACCIONES = [
  [/^perla de poder/, [{ tipo: 'recuperar', nivMax: 3, uso: 'diario', titulo: 'Recuperar un espacio de conjuro (nivel 3 o inferior)' }]],
  [/^vara del pacto/, [{ tipo: 'recuperar', nivMax: 9, uso: 'largo', titulo: 'Recuperar un espacio de conjuro' }]],
  [/^talisman de salud/, [{ tipo: 'curar', expr: '2d4+2', uso: 'diario', titulo: 'Recuperar 2d4 + 2 PG' }]],
  [/^armadura de marinero/, [{ tipo: 'curar', expr: '1d4', uso: 'diario', titulo: 'Recuperar 1d4 PG', nota: 'Solo si empiezas tu turno bajo el agua con 0 PG.' }]],
  [/^anillo de regeneracion/, [{ tipo: 'curar', expr: '1d6', uso: 'libre', titulo: 'Regenerar 1d6 PG', nota: 'Cada 10 minutos, si tienes al menos 1 PG.' }]],
  [/^piedra ioun de regeneracion/, [{ tipo: 'curar', expr: '15', uso: 'libre', titulo: 'Regenerar 15 PG', nota: 'Al final de cada hora, si tienes al menos 1 PG.' }]],
  [/^anillo de estrellas fugaces/, [LIBRE('Luces danzantes'), LIBRE('Luz'), C('Fuego feérico')]],
  [/^anillo de los tres deseos|^filo de la fortuna/, [C('Deseo')]],
  [/^anillo de salto/, [LIBRE('Salto', { nota: 'Solo sobre ti.' })]],
  [/^anillo de telequinesis/, [LIBRE('Telequinesis')]],
  [/^anillo de influencia animal/, [C('Encantar animal', 1, { cd: 13 }), C('Hablar con los animales'), C('Terror', 1, { cd: 13, nota: 'Solo afecta a bestias.' })]],
  [/^anillo del carnero/, [{ tipo: 'tirada', titulo: 'Cabeza de carnero', expr: '2d10', dano: 'fuerza', escala: 3, atk: 7, nota: 'Ataque a distancia +7; 2d10 de fuerza por carga.' }]],
  [/^baston de curacion/, [C('Curar heridas', 1, { porNivel: 4 }), C('Curar heridas en masa', 5), C('Restablecimiento menor', 2)]],
  [/^baston de enjambre de insectos/, [C('Insecto gigante', 4), C('Plaga de insectos', 5)]],
  [/^baston de escarcha/, [C('Cono de frío', 5), C('Muro de hielo', 4), C('Nube de oscurecimiento', 1), C('Tormenta de hielo', 4)]],
  [/^baston de fuego/, [C('Bola de fuego', 3), C('Manos ardientes', 1), C('Muro de fuego', 4)]],
  [/^baston de los bosques/, [C('Despertar', 5), C('Encantar animal', 1), C('Hablar con las plantas', 3), C('Hablar con los animales', 1), C('Localizar animales o plantas', 2),
    C('Muro de espinas', 6), C('Pasar sin rastro', 2), C('Piel robliza', 2)]],
  [/^baston de(l)? (los )?magos/, [C('Abrir', 2), LIBRE('Agrandar/reducir'), C('Bola de fuego', 7, { nivel: 7 }), LIBRE('Cerradura arcana'), C('Conjurar elemental', 7),
    C('Desplazamiento entre planos', 7), LIBRE('Detectar magia'), C('Disipar magia', 3), C('Esfera de llamas', 2), C('Invisibilidad', 2), LIBRE('Luz'), LIBRE('Mano de mago'),
    C('Muro de fuego', 4), C('Pasamuros', 5), LIBRE('Protección contra el bien y el mal'), C('Relámpago', 7, { nivel: 7 }), C('Telaraña', 2), C('Telequinesis', 5), C('Tormenta de hielo', 4)]],
  [/^baston de(l)? poder/, [C('Bola de fuego', 5, { nivel: 5 }), C('Cono de frío', 5), C('Globo de invulnerabilidad', 6), C('Inmovilizar monstruo', 5), C('Levitar', 2),
    C('Muro de fuerza', 5), C('Proyectil mágico', 1), C('Rayo debilitador', 1), C('Relámpago', 5, { nivel: 5 })]],
  [/^baston de impacto/, [{ tipo: 'tirada', titulo: 'Golpe de impacto', expr: '1d6', dano: 'fuerza', escala: 3, nota: 'Al acertar con el bastón: 1d6 de fuerza por carga.' }]],
  [/^baston de marchitamiento/, [{ tipo: 'tirada', titulo: 'Marchitar', expr: '2d10', dano: 'necrótico', nota: 'Al acertar con el bastón; salvación de Constitución CD 15 o desventaja en Fuerza y Constitución 1 hora.' }]],
  [/^baston del cautivador/, [C('Entender idiomas'), C('Hechizar persona'), C('Orden imperiosa')]],
  [/^collar de plegarias/, [C('Castigo brillante'), C('Curar heridas', 1, { nivel: 2 }), C('Bendición'), C('Viajar con el viento'), C('Restablecimiento mayor'), C('Guardián de la fe')]],
  [/^cubo de fuerza/, [C('Armadura de mago', 1, { cd: 17 }), C('Escudo', 1, { cd: 17 }), C('Pequeña choza de Leomund', 3, { cd: 17 }), C('Esfera elástica de Otiluke', 4, { cd: 17 }),
    C('Sanctasanctórum privado de Mordenkainen', 4, { cd: 17 }), C('Muro de fuerza', 5, { cd: 17 })]],
  [/^diadema de estallidos/, [DIA('Rayo abrasador', { atk: 5 })]],
  [/^gema de vision/, [C('Visión veraz')]],
  [/^medallon de los pensamientos/, [C('Detectar pensamientos', 1, { cd: 13 })]],
  [/^ojo de bruja/, [C('Ver invisibilidad', 1, { nota: 'Solo sobre ti.' }), C('Visión en la oscuridad', 1, { nota: 'Solo sobre ti.' })]],
  [/^oleaje/, [C('Dominar bestia', 1, { cd: 20, nota: 'Sobre una bestia con velocidad nadando.' })]],
  [/^tridente de comandar peces/, [C('Dominar bestia', 1, { cd: 15, nota: 'Sobre una bestia con velocidad nadando.' })]],
  [/^portal cubico/, [C('Desplazamiento entre planos'), C('Portal')]],
  [/^vara de la resurreccion/, [C('Curar', 1), C('Resurrección', 5)]],
  [/^varita de atadura/, [C('Inmovilizar monstruo', 5, { cd: 17 }), C('Inmovilizar persona', 2, { cd: 17 })]],
  [/^varita de bolas de fuego/, [C('Bola de fuego', 1, { nivel: 3, escala: 3, cd: 15 })]],
  [/^varita de deteccion magica/, [C('Detectar magia')]],
  [/^varita de polimorfar/, [C('Polimorfar', 1, { cd: 15 })]],
  [/^varita de proyectiles magicos/, [C('Proyectil mágico', 1, { nivel: 1, escala: 3 })]],
  [/^varita de relampagos/, [C('Relámpago', 1, { nivel: 3, escala: 3, cd: 15 })]],
  [/^varita de telarana/, [C('Telaraña', 1, { cd: 13 })]],
  [/^varita del terror/, [C('Orden imperiosa', 1, { cd: 15, nota: 'Solo «huye» o «póstrate».' }), C('Terror', 3, { cd: 15, nota: 'Cono de 18 m.' })]],
  [/^anteojos de encantamiento/, [C('Hechizar persona', 1, { nivel: 1, escala: 3, cd: 13 })]],
  [/^yelmo de teletransporte/, [C('Teletransporte')]],
  [/^yelmo de telepatia/, [DIA('Detectar pensamientos', { cd: 13 }), DIA('Sugestión', { cd: 13 })]],
  [/^yelmo de entender idiomas/, [LIBRE('Entender idiomas')]],
  [/^bola de cristal/, [LIBRE('Escudriñar', { cd: 17 })]],
  [/^botas de levitacion/, [LIBRE('Levitar', { nota: 'Solo sobre ti.' })]],
  [/^sombrero de disfraz/, [LIBRE('Disfrazarse')]],
  [/^capa del charlatan/, [DIA('Puerta dimensional')]],
  [/^abanico del viento/, [LIBRE('Ráfaga de viento', { cd: 13, nota: 'Cada uso más antes del amanecer: 20 % acumulativo de que se rompa.' })]],
];

// Acciones del objeto, con una clave estable y su título para el botón
export function accionesDe(o) {
  const n = norm(o?.nombre || ''), x = ACCIONES.find(([re]) => re.test(n)); if (!x) return [];
  return x[1].map((a, i) => {
    const uso = a.uso || 'cargas', id = `${i}:${norm(a.nombre || a.titulo).replace(/[^a-z]+/g, '-')}`;
    const coste = uso === 'cargas' ? a.coste ?? 1 : 0;
    const titulo = a.titulo || `${a.nombre}${a.nivel && !a.escala ? ` (nivel ${a.nivel})` : ''}`;
    return { ...a, id, uso, coste, titulo };
  });
}

// El contador que gasta la acción: las cargas del objeto o su uso diario (que se crea si el objeto aún no lo tenía)
const diarias = acs => acs.filter(a => a.uso === 'diario' || a.uso === 'largo');
export function recursoDe(ch, o, a, crear = false) {
  if (a.uso === 'libre') return null;
  if (a.uso === 'cargas') return o.rasgo ? reglas(ch).find(r => r.id === o.rasgo) || null : null;
  o.accionUso ||= {};
  let id = o.accionUso[a.id];
  // Los usos que el lector ya creó (uno por propiedad) se adoptan en el mismo orden
  if (!id) { const ds = diarias(accionesDe(o)), i = ds.findIndex(d => d.id === a.id); if ((o.usos || []).length === ds.length && i >= 0) id = o.usos[i]; }
  let r = id ? reglas(ch).find(x => x.id === id) : null;
  if (!r && crear) {
    const nuevo = { id: uid('r'), tipo: 'recurso', nombre: `${o.nombre}: ${a.nombre || a.titulo}`, nota: 'Uso del objeto mágico.', maxBase: 'fijo', maxN: 1, maxAb: 'car', dado: 'd20', nivMax: 5,
      escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '', recarga: 'largo', objeto: o.clave, objetoId: o.id };
    (ch.rasgos ||= []).push(nuevo); (o.usos ||= []).push(nuevo.id); id = nuevo.id; r = reglas(ch).find(x => x.id === id);
  }
  if (r) o.accionUso[a.id] = r.id;
  return r;
}
export const libresDe = (ch, r) => (r ? r.max - usosGastados(ch, r) : Infinity);

// Espacios gastados que se pueden recuperar: [nivel, gastados]
export function espaciosRecuperables(ch, nivMax = 9) {
  const P = perfil(ch), out = [];
  for (let L = 1; L <= Math.min(9, nivMax); L++) { const tot = P.slots?.[L] || 0, u = Math.min(ch.play?.used?.[L] || 0, tot); if (u > 0) out.push([L, u]); }
  return out;
}

// ¿Se puede hacer ahora? '' si sí; si no, por qué
export function motivoAccion(ch, o, a, n = a.coste) {
  if (!o || o.guardado) return 'Llévalo encima para usarlo.';
  if (o.sintonia && !o.sintonizado) return 'Tienes que estar sintonizado con él.';
  if (o.gastado) return 'Ha perdido su magia.';
  if (a.tipo === 'recuperar' && !espaciosRecuperables(ch, a.nivMax).length) return `No tienes espacios de conjuro gastados${a.nivMax < 9 ? ` de nivel ${a.nivMax} o inferior` : ''}.`;
  if (a.uso === 'libre') return '';
  const r = recursoDe(ch, o, a);
  if (a.uso === 'cargas' && !r) return 'El objeto no tiene contador de cargas.';
  if (r && libresDe(ch, r) < Math.max(1, n)) return a.uso === 'cargas' ? `No le quedan ${Math.max(1, n)} cargas.` : 'Ya lo usaste: vuelve con el amanecer.';
  return '';
}

// Opciones de una acción escalable: cuántas cargas y a qué nivel
export function opcionesEscala(a) {
  if (a.escala && a.tipo === 'conjuro') return Array.from({ length: a.escala }, (_, i) => ({ cargas: a.coste + i, nivel: (a.nivel || 1) + i }));
  if (a.escala) return Array.from({ length: a.escala }, (_, i) => ({ cargas: i + 1, nivel: null }));
  if (a.porNivel) return Array.from({ length: a.porNivel }, (_, i) => ({ cargas: i + 1, nivel: i + 1 }));
  return [{ cargas: a.coste, nivel: a.nivel || null }];
}

// Aplica la acción: gasta el contador y hace lo que la hoja puede hacer sola. Devuelve qué ha pasado.
//   cargas: las que se gastan (opcionesEscala); L: nivel del espacio a recuperar; tirar: dado para las pruebas
export function usarAccion(ch, o, a, { cargas = a.coste, L = null, tirar } = {}) {
  const motivo = motivoAccion(ch, o, a, cargas); if (motivo) return { ok: false, motivo };
  const r = recursoDe(ch, o, a, true);
  if (r) { const st = recState(ch, r.id); st.used = (st.used || 0) + (a.uso === 'cargas' ? cargas : 1); }
  const out = { ok: true, recurso: r, gastadas: r ? (a.uso === 'cargas' ? cargas : 1) : 0 };
  if (a.tipo === 'recuperar') {
    const opciones = espaciosRecuperables(ch, a.nivMax), nivel = opciones.some(([x]) => x === L) ? L : opciones[opciones.length - 1][0];
    ch.play.used[nivel] = Math.max(0, (ch.play.used[nivel] || 0) - 1); out.nivel = nivel;
  }
  // Curación: tira y la aplica; daño (Bastón de impacto, Anillo del carnero): tira los dados por carga
  if (a.tipo === 'curar') { out.tirada = tirarExpr(a.expr, tirar); out.curado = curar(ch, out.tirada.total); }
  if (a.tipo === 'tirada') { const m = /^(\d+)d(\d+)$/.exec(a.expr), n = a.escala ? cargas : 1; out.tirada = tirarExpr(m ? `${+m[1] * n}d${m[2]}` : a.expr, tirar); }
  return out;
}
