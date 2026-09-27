# Auditoría de rendimiento en móvil

Objetivo: que moverse por la app en el móvil sea fluido sin renunciar a las animaciones.

## Cómo se ha medido

- Build de producción (`npm run build`) servida en local y abierta en Chromium con emulación de móvil: 412×915, DPR 2,625, táctil y **CPU ralentizada ×4**, que se parece a un Android de gama media.
- Con los 57 personajes de prueba que se cargan fuera de `main`. Es un caso duro: la portada y la base de datos pesan más de lo normal.
- Desplazamientos con gestos táctiles sintéticos (`Input.synthesizeScrollGesture`). Los fotogramas se cuentan con `requestAnimationFrame`, las tareas largas con `PerformanceObserver`, y el coste de estilos, pintado y lienzo sale de trazas de DevTools.
- «Tirón» es un fotograma de más de 34 ms, es decir, uno que se salta al menos otro.

El Chromium de pruebas pinta sin GPU, así que el coste de los lienzos sale inflado respecto a un teléfono real. Aun así, la comparación antes/después es válida porque las dos versiones se miden igual.

## Resultados

Antes → primera ronda → segunda ronda (lo que hay ahora):

| Escenario | fps | tirones | peor fotograma (ms) | tareas largas (ms) |
|---|---|---|---|---|
| portada reposo | 8 → 38 → **52** | 7 → 14 → 6 | 450 → 117 → 83 | 2430 → 578 → 393 |
| portada scroll | 21 → 48 → **58** | 4 → 3 → 2 | 500 → 67 → 50 | 1396 → 121 → 55 |
| hoja reposo | 28 → 48 → **60** | 29 → 4 → 0 | 67 → 50 → 17 | 106 → 50 → 0 |
| hoja scroll ↓ | 28 → 49 → **55** | 26 → 2 → 6 | 67 → 50 → 167 | 465 → 53 → 0 |
| hoja scroll ↑ | 23 → 41 → **60** | 42 → 6 → 0 | 83 → 50 → 17 | 975 → 214 → 0 |
| gastar espacio | 13 → 25 → **54** | 12 → 8 → 4 | 167 → 100 → 83 | 760 → 244 → 0 |
| abrir dados | 35 → 54 → **59** | 1 → 1 → 0 | 133 → 117 → 33 | 97 → 77 → 90 |
| entrar combate | 13 → 16 → **37** | 26 → 23 → 6 | 367 → 400 → 350 | 2132 → 1505 → 922 |
| combate reposo | 16 → 35 → **60** | 44 → 8 → 0 | 100 → 67 → 17 | 2641 → 261 → 0 |
| combate scroll | 16 → 38 → **60** | 32 → 2 → 0 | 117 → 50 → 17 | 1963 → 0 → 0 |

El salto de la segunda ronda viene sobre todo de sacar el fondo animado a un Worker (punto 12). El Chromium de pruebas pinta el lienzo sin GPU, así que en un teléfono la diferencia será menor, pero el hilo principal queda igual de libre. La entrada al combate sigue siendo lo más pesado porque monta toda la vista de golpe, pero ocurre mientras el velo de «¡A las armas!» tapa la pantalla.

## Qué se encontró y qué se ha cambiado

### 1. El fondo animado competía con el scroll (`ui/fondo.js`)
El lienzo de partículas ocupa toda la pantalla y se repinta 30 veces por segundo. En las trazas era lo que más costaba con diferencia. Además, en cada fotograma:
- buscaba en todo el DOM si había una ventana abierta (`querySelector('dialog.tall[open]')`);
- leía `innerWidth`, que puede forzar un layout.

**Cambios:**
- Mientras se desplaza la página o una ventana, el fondo se queda quieto y deja la GPU libre para el scroll. Vuelve 180 ms después de parar, sin saltos porque el tiempo en pausa no se acumula.
- En pantallas táctiles el lienzo se pinta a una resolución máxima de 1,25× en vez de 1,5× (un 30 % menos de píxeles). Son brillos difusos y no se nota.
- La comprobación de ventana abierta recorre una colección viva de `<dialog>` y usa el ancho guardado.
- Si solo cambia el alto (la barra del navegador móvil que aparece y desaparece al desplazarse), se conservan las partículas en lugar de regenerarlas.

### 2. `background-attachment: fixed` en `body` (`styles/base.css`)
En Chrome, un fondo fijo obliga a desplazar la página en el hilo principal: cualquier trabajo de JS o de pintado se nota como tirón. El cielo pasa a una capa `html::before` con `position: fixed`, que se ve igual y deja que el scroll lo haga el compositor.

### 3. Desenfoques de fondo sobre contenido que se mueve (`styles/movil.css`, nuevo)
La barra superior, el dock, las cabeceras pegajosas de cada nivel de conjuros y el fondo de las ventanas usaban `backdrop-filter: blur()`. Debajo tienen el lienzo animado y la página desplazándose, así que el desenfoque se recalculaba **en cada fotograma**. Es de lo más caro que hay en una GPU móvil.

En pantallas táctiles (`hover: none` y `pointer: coarse`) esas superficies tienen ahora un fondo casi opaco (93–97 %) sin desenfoque. En el ordenador siguen igual. Al fondo de las ventanas se le añade un velo oscuro muy suave para compensar.

### 4. Animaciones de entrada con `filter: blur()`
Las ventanas (`pagina-in`/`pagina-out`), la vista de combate (`cb-entra`), los pasos de creación (`paso-der`/`paso-izq`), los menús, la lápida y el portal de la portada animaban un desenfoque sobre superficies grandes. En móvil esas `@keyframes` se redefinen **con el mismo movimiento, giro 3D, escala y opacidad**, pero sin el desenfoque.

### 5. Animaciones infinitas que repintaban cada fotograma
- **Astrolabio de la hoja:** giraba un `<g>` dentro del SVG. Chrome no puede llevar eso a la GPU y lo repintaba en cada fotograma, siempre. Ahora la parte que gira es un `<svg>` propio y la anima el compositor. Se ve igual.
- **Píldora «Concentrado en…»** (y las marcas «C» de conjuros de concentración en combate): animaban `box-shadow`. Ahora el mismo resplandor está en una capa `::after` que anima solo la opacidad, sin repintar.
- **Tarjetas de la portada:** todas llevaban `will-change: transform` y una transformación 3D para la inclinación con ratón, lo que crea una capa de GPU por tarjeta. En táctil esa inclinación no existe, así que se quitan (se conserva el hundido al pulsar).

### 6. La rueda de colores de la portada recalculaba toda la portada
Cada 4,2 s la rueda cambia de tono con una transición de 1,6 s sobre variables CSS registradas (`--ln-*`) en `#landing`. Como se heredan, **cada fotograma** de la transición recalculaba los estilos de toda la portada (~1000 elementos con los personajes de prueba, unos 80 ms reales por fotograma).
- El tono de destino se aplica solo a los bloques que no tienen paleta propia (cabecera, títulos, acciones, pie y un nuevo `.l-cielo` para el degradado de fondo), no al contenedor. Las tarjetas de personaje, que ya tienen su propio color, no se tocan.
- En móvil la transición avanza en 12 saltos muy cortos (`steps(12, jump-none)`). Entre salto y salto el valor no cambia y el navegador no recalcula nada. De 56 recálculos por transición se pasa a 12.

### 7. Layout forzado en cada acción (`ui/sheet.js`)
`renderBar` medía la barra (`scrollWidth`, `getBoundingClientRect`) a mitad del render, lo que forzaba un cálculo de estilos y de layout extra, y reescribía `--appbar-h` en `:root` en cada acción aunque no hubiera cambiado. Tocar una variable de `:root` invalida los estilos de todo el documento.
- La medida va al siguiente fotograma, agrupada, y además con un `ResizeObserver` sobre la barra.
- `--appbar-h` solo se escribe si cambia.

### 8. La onda de los botones se creaba al empezar a desplazar (`ui/magia.js`)
En cada `pointerdown` la onda medía el botón y metía nodos en el DOM, justo en el instante en que arranca un desplazamiento si el dedo cae sobre un botón (algo constante en listas de conjuros). Con el dedo, ahora la onda espera un instante: si el gesto resulta ser un scroll no hace nada, y si es un toque aparece al soltar o a los 70 ms. Con ratón sigue siendo inmediata.

### 9. Partículas de los efectos (`ui/fx.js`)
- Cada chispa creaba un `createRadialGradient` nuevo en cada fotograma. Ahora el degradado se pinta una vez por color en un sprite de 64 px y se estampa con `drawImage`, con la vida en `globalAlpha`. El resultado es idéntico.
- La física dependía de la tasa de refresco: a 120 Hz las chispas iban al doble de velocidad y en un móvil lento, a cámara lenta. Ahora se escala por el tiempo real del fotograma.
- Tope de 500 partículas, resolución máxima 1,5× (antes 2×) y tamaño de pantalla guardado en lugar de leer `innerWidth` en cada fotograma.

### 10. Guardado en momentos libres (`core/store.js`)
Serializar y guardar la base de datos (medio mega con los personajes de prueba) se hace con `requestIdleCallback` después de los 200 ms de espera habituales, para no coincidir con una animación. Al pausar la app o cerrar la página se sigue guardando al instante.

### 11. Error: dos animaciones se pisaban el nombre
`creacion.css` definía `@keyframes latido` y `@keyframes llama`, que ya existían en `arcano.css` y `juego.css`. Como se carga después, sustituía a las originales en toda la app:
- el 20 natural de los dados latía en tamaño en vez de brillar;
- la línea de fuego de la barra superior en combate hacía un halo de `box-shadow` en vez de la llama que recorre la barra.

Se han renombrado a `cc-latido` y `cc-llama` y cada animación vuelve a ser la que se diseñó.

## Segunda ronda

### 12. El fondo animado se dibuja en un Worker (`ui/fondoMotor.js`, `ui/fondoWorker.js`)
Las escenas y el bucle de dibujo están en `fondoMotor.js`, sin tocar el DOM. `fondo.js` pasa el lienzo al Worker con `transferControlToOffscreen()` y solo le cuenta lo que pasa en la página: tamaño, escena, tema, si hay una ventana a pantalla completa (se comprueba al abrirse o cerrarse una, ya no en cada fotograma), si la pestaña está oculta y si se está desplazando. El hilo principal ya no dibuja partículas ni sube el lienzo en cada fotograma.
Si el navegador no admite `OffscreenCanvas` o el Worker falla, el mismo motor corre en la página como antes. En la versión de Windows (un solo HTML abierto desde disco) siempre se usa este modo.

### 13. Carga bajo demanda de los asistentes (`app/asistentes.js`)
El de crear o editar personaje (51 kB) y el de subir de nivel (24 kB) van en trozos aparte. Ya no se analizan al arrancar: se cargan en un momento libre después del arranque o, como tarde, al abrirlos.

### 14. Iconos con `JSON.parse`
`gameIcons.js` (190 kB, casi una cuarta parte del JS) se genera como `JSON.parse("…")` en lugar de un objeto literal: V8 lo analiza bastante más rápido. Lo hace `tools/iconos.mjs`.

### 15. Deshacer sin clonar toda la base de datos (`core/store.js`)
Las acciones de juego solo modifican al personaje activo y, al subir de nivel, añaden conjuros al catálogo. La instantánea para deshacer copia ese personaje y el índice del catálogo, y comparte el resto. Las ediciones siguen guardando una copia completa. Hay un test nuevo para esto.

### 16. Más animaciones infinitas pasadas a capas de opacidad o transform
- PG en crítico o a 0, 20 natural en los dados y en las tiradas: el latido de brillo es ahora un halo detrás del número que cambia de opacidad.
- Iniciativa pendiente, efectos que acaban, botón de revivir, núcleo de la portada, inspiración heroica y avisos de la creación: el resplandor está en una capa `::after`/`::before` que solo cambia de opacidad.
- Barridos de brillo (chip dorada, botón dorado de la portada, maestría en combate, competencias elegibles): una banda que se desplaza con `transform` dentro de su caja.
- Anillo de los dados: cada aro que gira es un `<svg>` propio, como el astrolabio.

### 17. `transition: all` sustituido por las propiedades que cambian en las seis reglas que lo usaban.

### 18. `:hover` solo con ratón
Un pequeño plugin de PostCSS en `web/vite.config.js` envuelve en el build cada regla con `:hover` en `@media (hover: hover)`. En el móvil el resaltado ya no se queda pegado tras tocar, y tocar no recalcula estilos de hover. Si una regla mezcla selectores con y sin `:hover`, se parte en dos para no perder los demás.

### Lo que queda, a propósito
- El destello periódico de la chip dorada (`destello`), el brillo del título de la portada (`l-brillo`) y la línea de fuego de la barra en combate (`llama`) siguen animando `box-shadow` o `background-position`. Los dos primeros solo cambian durante un 12–30 % de su ciclo; el resto del tiempo el valor no varía y no se repinta nada. La línea mide 1 px de alto. Moverlos a capas obligaría a rehacer cómo se recortan (el botón necesita `overflow: hidden` para su brillo interior).
- La entrada al combate monta toda la vista en un solo paso, tapada por la animación del velo.

## Lo que ya estaba bien
- `content-visibility: auto` en los niveles de conjuros: lo que está fuera de pantalla no se calcula.
- `patch()` compara el HTML antes de tocar el DOM, así que las secciones sin cambios no se repintan.
- Escuchas de `scroll` y `pointermove` pasivas y agrupadas con `requestAnimationFrame`.
- `touch-action: manipulation` en los botones y `overscroll-behavior: contain` en las ventanas.
- `prefers-reduced-motion` respetado en CSS y JS. El lienzo de fondo se detiene si la app pasa a segundo plano.
- Fuentes y datos locales; el lector de PDF y la importación de libros se cargan solo cuando hacen falta.

## Cómo comprobarlo en un teléfono
1. Conecta el móvil por USB con la depuración activada, abre `chrome://inspect` en el ordenador e inspecciona la WebView del Grimorio.
2. En **Rendering**, activa *Frame Rendering Stats*, *Paint flashing* y *Layer borders*. Al desplazarte no debería parpadear en verde nada más que lo que cambia de verdad.
3. En **Performance**, graba un desplazamiento largo por la hoja y la entrada al combate. Busca tareas rojas de más de 50 ms y bloques morados de *Recalculate Style*.
