# Arquitectura

Guía para orientarse en el código de Grimorio: cómo está organizado, qué puede depender de qué y dónde va cada cosa nueva. Cada archivo de `web/src` empieza con un comentario que dice qué contiene; este documento da el mapa de conjunto.

## Capas

```
                 main.js  (arranque: crea el store e inicia cada pieza)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
      app/  ◄──────────────►   ui/          casos de uso  ·  pantallas, diálogos y componentes
        │                       │
        └───────────┬───────────┘
                    ▼
                 domain/                     reglas de D&D 2024: funciones puras, sin DOM
                    │
                    ▼
                  core/                      estado (store) y utilidades
   platform/  ◄── la usan app/ y ui/         Capacitor, almacenamiento, pdf.js
```

| Capa | Qué hay | Puede importar |
|---|---|---|
| `core/` | El store (estado, guardado, deshacer), utilidades de texto y números, carga perezosa de módulos | Nada de la app |
| `domain/` | Todas las reglas del juego y el modelo de datos. Funciones que reciben un personaje (`ch`) y calculan algo o lo modifican | `domain/`, `core/` |
| `platform/` | Lo que depende del dispositivo: Capacitor en Android, almacenamiento, compartir archivos, pdf.js | Paquetes de npm, `core/` |
| `app/` | Casos de uso que combinan reglas, estado y avisos: `acciones.js` (lanzar, gastar, descansar), `combate.js` (iniciativa, rondas, ataques), `edicionConjuros.js`, `importarManual.js`. `eventos.js` conecta la hoja con todo lo demás | Todo |
| `ui/` | HTML de pantallas y diálogos, componentes y animaciones | `domain/`, `core/`, `platform/`; de `app/` solo `acciones.js` (y `importarManual.js` con carga perezosa) |

`tests/arquitectura/capas.test.js` comprueba las reglas principales: `core/` no importa nada, `domain/` solo usa `domain/` y `core/`, y solo `platform/` importa Capacitor o pdf.js. Si esa prueba falla, la lógica nueva está en la capa equivocada.

## Mapa de carpetas

### `web/src/domain/` — reglas del juego

| Carpeta | Contenido | Módulo de entrada |
|---|---|---|
| `reglas/` | Núcleo de las reglas de 2024: características, competencia, niveles, multiclase, habilidades, salvaciones, dados y resúmenes de reglas | `reglas2024.js` (`perfil(ch)`: CD, ataque, espacios, preparados) |
| `clases/` | Clases y subclases, rasgos y recursos, subida de nivel, opciones y variantes de rasgo, estilos, maniobras, «En juego» | `clases2024.js`, `rasgos.js` |
| `origen/` | Especies, trasfondos, dotes de origen y conjuros que dan las dotes | `especies.js`, `origen.js` |
| `personaje/` | Modelo de datos y normalización, creación de personaje, diario, historia, personajes de prueba | `modelo.js` |
| `combate/` | Vida y muerte, efectos y estados, concentración, combate por rondas, ataques al impactar, maestrías, áreas | `vida.js`, `efectos.js`, `combate.js` |
| `conjuros/` | Catálogo y compendio, espacios de conjuro, análisis de tiradas de cada conjuro, validación | `catalogo.js`, `espacios.js` |
| `equipo/` | Inventario, armas y armaduras, monedas y carga, objetos mágicos (efectos, variantes, acciones, consumibles) | `equipo.js` |
| `criaturas/` | Bestiario de la campaña, perfiles para invocar o transformarse y lector de perfiles de los libros | `bestiario.js` |
| `libros/` | Importación de PDF (corrección del OCR, columnas, tablas y un lector por tipo de contenido) y lo ya importado: libros cargados y glosario | `libroCompleto.js` (`analizarLibro`), `biblioteca.js` (`setLibros`), `terminos.js` |
| `presentacion/` | Lógica pura de presentación que se prueba sin navegador: búsqueda, realce de texto, paleta de colores | — |

### `web/src/ui/` — interfaz

| Carpeta | Contenido |
|---|---|
| `componentes/` | Piezas base reutilizables: DOM (`$`, `on`, `patch`), apertura de diálogos, modales, avisos (`toast`), iconos, tema por clase, tutorial |
| `pantallas/` | Lo que está siempre en pantalla: portada (`landing`), hoja (`sheet`, `vitales`), modo combate, fichas de lectura rápida y pantalla de luto |
| `dialogs/` | Un módulo por diálogo de la app (conjuro, inventario, vida, dados, biblioteca, subir de nivel…) |
| `selectores/` | Piezas de elección que usan varios diálogos: subclase, especie, dote, habilidades, maestrías, maniobras, «al impactar» |
| `animaciones/` | Efectos visuales: fondo animado (con su Worker), chispas, runas, golpes, impactos y dados que ruedan |

### Resto del repositorio

| Ruta | Contenido |
|---|---|
| `web/index.html` | Estructura de la página, con un `<dialog id="…">` por cada diálogo |
| `web/src/styles/` | Un CSS por área (`sheet.css`, `dialogs.css`, `inventario.css`…) y `tokens.css` con los colores y medidas |
| `web/public/data/` | Compendio de conjuros del SRD y vocabulario para corregir el OCR |
| `tests/` | Pruebas automáticas (ver más abajo) |
| `tools/` | Scripts: compendio, iconos, preparación de libros, auditorías que generan los documentos de `docs/`, y `tools/ocr/` para medir el OCR |
| `android/` | Proyecto Android de Capacitor |

## Patrones

### Reglas (`domain/`)

- Las funciones reciben el personaje (`ch`) y **devuelven un valor** (`perfil(ch)`, `caEfectiva(ch)`) o **lo modifican en el sitio** (`aplicarDano(ch, n)`, `anadirObjeto(ch, o)`). No guardan, no avisan y no tocan el DOM: eso lo hacen `app/` y `ui/`.
- Los datos del Manual (clases, especies, objetos con efecto…) son constantes en mayúsculas (`CLASES_INFO`, `RASGOS_ESPECIE`, `OBJETOS_EFECTO`) junto a las funciones que los usan.
- Los textos de los libros solo se leen si el usuario los importa; sin ellos, la app usa resúmenes propios (`reglas/referencia.js`, `conjuros/tiradasBase.js`).

### Estado (`core/store.js`)

Hay un único store, `S`, que se pasa a cada pieza al arrancar.

```js
const h = S.act('Lanza Bola de fuego', (db, ch) => { ch.play.used[3]++; }); // acción de juego: va al historial y se puede deshacer
S.edit((db, ch) => { ch.nombre = 'Theo'; });                                // edición de la hoja
toast('Hecho.', [undoBtn(S, h)]);                                             // aviso con «Deshacer»
```

Cada cambio emite un evento; `main.js` vuelve a pintar la hoja y cada diálogo abierto se repinta con `S.subscribe`.

### Diálogos (`ui/dialogs/`)

Todos siguen la misma forma:

```js
let S;                                     // el store, guardado en init
export function openHistory() { render(); openSheet($('#histDlg')); }
export function init(store) {              // main.js lo llama una vez al arrancar
  S = store;
  S.subscribe(() => { if ($('#histDlg').open) render(); });
  on($('#histBody'), 'click', '[data-hundo]', …);
}
```

El `<dialog>` está en `web/index.html`; el módulo lo rellena con HTML generado (`render`) y escucha sus eventos con delegación (`on`). Los botones de la hoja llevan `data-cmd="…"`, y `app/eventos.js` (`COMMANDS`) decide qué abre cada uno.

### Carga perezosa

Los módulos pesados que no hacen falta al abrir la app (asistentes de personaje y de nivel, importación de PDF) se cargan con `import()` a través de `app/asistentes.js` o `core/cargar.js`.

### Nombres

- Archivos y funciones nuevas en castellano y en `camelCase` (`aplicarDano`, `libroCompleto.js`); constantes de datos en `MAYUSCULAS`.
- Quedan nombres antiguos en inglés (`openSpell`, `renderSheet`, `slotsOf`…) que se mantienen para no romper nada; no hace falta traducirlos, pero el código nuevo va en castellano.
- Un archivo de `ui/` puede llamarse igual que uno de `domain/` cuando es su interfaz (`domain/combate/alImpactar.js` y `ui/selectores/alImpactar.js`).

## Pruebas

```bash
npm test                                   # todas
npm run lint                               # ESLint: variables sin declarar e imports sin usar
node --test tests/combate/vida.test.js     # un archivo
node --test --test-name-pattern="muerte" "tests/**/*.test.js"   # las que contienen una palabra
```

| Carpeta | Qué prueba |
|---|---|
| `tests/<área>/<módulo>.test.js` | Un módulo de `web/src/domain/<área>/`. `tests/combate/vida.test.js` prueba `domain/combate/vida.js` |
| `tests/core/` | El store y las utilidades |
| `tests/ui/` | Lógica pura de la interfaz que se puede probar sin navegador |
| `tests/integracion/` | Pruebas que cruzan varios módulos: auditorías contra el Manual, todas las combinaciones de clase y especie, un combate simulado |
| `tests/arquitectura/` | Las reglas de dependencia entre capas y que todo lo importado exista |
| `tests/helpers/fixtures.js` | Utilidades comunes: leer el compendio, copiar un arma predefinida, leer un archivo del repositorio |

Dentro de cada archivo, cada `describe` agrupa las pruebas de una función o de una regla (`describe('salvaciones contra muerte', …)`), y el título de cada `test` dice qué comportamiento comprueba. Los personajes de ejemplo se crean con `normChar(blankChar({ … }))` en un auxiliar al principio del archivo.

## Cómo añadir…

**Una regla nueva** (un rasgo, una dote, un efecto): va en el módulo de `domain/` del área que toca, con su prueba en el archivo espejo de `tests/`. Si la hoja tiene que mostrarla, la pantalla o el diálogo la llama; la regla no sabe nada de la interfaz.

**Un diálogo nuevo**: añade el `<dialog id="…">` en `web/index.html`, crea `ui/dialogs/<nombre>.js` con `init(store)` y `open…()`, llama a su `init` en `main.js` y, si se abre desde un botón con `data-cmd`, añade la orden en `COMMANDS` de `app/eventos.js`. Sus estilos van en el CSS del área (o en `dialogs.css`).

**Un lector para otro tipo de contenido de los libros**: un módulo nuevo en `domain/libros/` que recibe líneas ya corregidas y devuelve objetos; se llama desde `libroCompleto.js`. Las pruebas usan páginas de juguete hechas con auxiliares como `L(x, y, texto)`.

**Una dependencia del dispositivo** (un plugin de Capacitor, una API del navegador): solo en `platform/`, con una alternativa para la web y Windows.
