// Atajos de teclado del ordenador: qué orden corresponde a cada tecla según dónde está el usuario.
export const ATAJOS = [
  ['d', 'dados', 'Dados'],
  ['c', 'combate', 'Entrar o salir del modo combate'],
  ['v', 'vida', 'Puntos de golpe'],
  ['i', 'equipo', 'Inventario'],
  ['r', 'rest', 'Descansar'],
  ['h', 'hist', 'Historial'],
  ['e', 'estados', 'Estados'],
  ['n', 'diario', 'Diario de campaña'],
  ['b', 'biblioteca', 'Biblioteca'],
];
const POR_TECLA = Object.fromEntries(ATAJOS.map(([k, cmd]) => [k, cmd]));

export function ordenDeTecla({ key = '', ctrl = false, meta = false, alt = false, shift = false } = {}, { escribiendo = false, dialogo = false, enHoja = false } = {}) {
  if (escribiendo || alt) return null;
  const k = String(key).toLowerCase();
  if ((ctrl || meta) && k === 'z' && !shift) return dialogo || !enHoja ? null : 'deshacer';
  if (ctrl || meta || dialogo) return null;
  if (key === '?') return 'atajos';
  return enHoja ? POR_TECLA[k] || null : null;
}

export const textoAtajos = () => [...ATAJOS.map(([k, , t]) => `${k.toUpperCase()}: ${t}`), 'Ctrl+Z: deshacer la última acción', 'Ctrl+K o /: buscar', '?: esta ayuda'].join('\n');
