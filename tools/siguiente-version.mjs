// Versión de cada publicación en Releases, con versionado semántico (MAYOR.MENOR.PARCHE).
// - La primera vez sale la de package.json (2.3.0). Después, cada push a main sube el parche: 2.3.0 → 2.3.1 → 2.3.2…
// - «[menor]» o «[minor]» en el título del pull request (o en un commit) sube la versión menor: 2.3.7 → 2.4.0.
// - «[mayor]» o «[major]» sube la mayor: 2.4.1 → 3.0.0.
// - Subir a mano package.json por encima de la última publicada hace que la siguiente salga con ese número.
// Las etiquetas antiguas (v1.0.N, una por compilación) quedan por debajo y no cuentan.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const leer = t => { const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(t).trim()); return m ? m.slice(1).map(Number) : null; };
const comparar = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function siguienteVersion({ base, etiquetas = [], mensajes = [] }) {
  const b = leer(base);
  if (!b) throw new Error(`Versión de package.json no válida: ${base}`);
  const previas = etiquetas.map(leer).filter(v => v && comparar(v, b) >= 0).sort(comparar);
  if (!previas.length) return b.join('.');
  const [M, m, p] = previas.at(-1), texto = mensajes.join('\n');
  if (/\[(mayor|major)\]/i.test(texto)) return `${M + 1}.0.0`;
  if (/\[(menor|minor)\]/i.test(texto)) return `${M}.${m + 1}.0`;
  return `${M}.${m}.${p + 1}`;
}

// Desde la línea de órdenes (GitHub Actions): mira las etiquetas del repositorio y los commits desde la última publicada
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
  const base = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  const etiquetas = git('tag', '--list', 'v*').split('\n').filter(Boolean);
  const ultima = etiquetas.filter(leer).sort((a, b) => comparar(leer(a), leer(b))).at(-1);
  const mensajes = git('log', '--format=%B', ultima ? `${ultima}..HEAD` : '-1').split('\n');
  const v = siguienteVersion({ base, etiquetas, mensajes });
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${v}\n`);
  console.log(v);
}
