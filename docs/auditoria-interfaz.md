# Auditoría de la interfaz: accesibilidad, contraste, legibilidad y carga

Objetivo: que la app se lea bien en los dos temas y con cualquier color de clase, que funcione con lector de pantalla y teclado, y que la web cargue y se pueda instalar como app.

## Herramientas

- **Lighthouse 13**, sobre la build de producción (`PERSONAJES_PRUEBA=0 npm run build` + `vite preview`), en móvil (CPU ×4, 4G lenta simulada) y en escritorio.
- **axe-core 4**, con las reglas WCAG 2.0, 2.1 y 2.2 A/AA y las de buenas prácticas. Se recorren unas 20 vistas por combinación (78 en total): portada, tutorial, hoja, edición, combate, dados, búsqueda, historial, menú «Más», rasgos, inventario, historia, diario, bestiario, biblioteca, libros, copia de seguridad, acerca de, puntos de golpe, estados, lectura de un conjuro y creación de personaje. Cada una en tema de noche y de día, en móvil (412×915, táctil) y en PC (1366×860). Script: [`tools/auditoria-axe.mjs`](../tools/auditoria-axe.mjs).
- **Contraste medido en píxeles**, para lo que axe no puede calcular. axe dejó ~2.400 textos como «no se puede determinar el fondo» porque la app pinta degradados, velos, pseudoelementos y opacidades. El script hace dos capturas, con texto y con el texto transparente, y compara cada píxel de letra con su fondo real. Se pasó por todas las pantallas anteriores y por la hoja completa de 15 personajes de prueba de clases distintas, en los dos temas: **7.425 textos**. Script: [`tools/auditoria-contraste.mjs`](../tools/auditoria-contraste.mjs).

Para repetirlo: `npm run dev`, luego `npm i --no-save playwright-core axe-core` y lanza los dos scripts contra `http://localhost:5173/`.

## Resultados

Lighthouse, build de producción:

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil, antes | 64 | 94 | 100 | 82 |
| Móvil, ahora | **68** | **100** | 100 | **100** |
| Escritorio, antes | 98 | 94 | 100 | 82 |
| Escritorio, ahora | 98 | **100** | 100 | **100** |

axe-core: la primera pasada encontró 4 tipos de fallo en 14 elementos que se repiten en casi todas las vistas. Al ampliar la cobertura aparecieron 2 más: un campo sin etiqueta y las casillas del inventario. Ahora hay **0 fallos en las 78 vistas**.

Contraste: de 17 grupos de textos por debajo de AA a 0. Queda un único aviso, que es falso: la tarjeta de la portada se mide mientras entra animada.

## Qué se encontró y qué se ha cambiado

### 1. Botones cuyo nombre accesible no coincidía con lo que se ve (WCAG 2.5.3)
Muchos botones tenían un `aria-label` que sustituía al texto visible. Quien maneja el móvil por voz dice lo que ve («Personajes», «Furia», «d20») y el botón no respondía, porque se llamaba «Cambiar de personaje», «Leer Furia» o «Añadir 1d20».

Pasaba en la ficha del personaje de la barra superior, la tarjeta de puntos de golpe (hoja y combate), estados, las seis características, salvaciones y habilidades, rasgos en juego, conjuros, caras de los dados, historial de tiradas, casillas del inventario y casillas del menú «Más».

**Cambio:** se quitan esos `aria-label`. El texto visible da el nombre y lo que falta va en texto solo para lectores de pantalla (`.visually-hidden`), antes o después: «*Tirar* Salvación *de Destreza*», «*Leer* Furia», «Personajes*: cambiar de personaje*», «*Añadir* d20», «Mano principal*:* *vacía*». Lo decorativo que se repetía (la abreviatura FUE, el dado «?» de espera, el icono de cada tirada del historial) queda con `aria-hidden`.

### 2. ARIA mal usado
- **Tutorial:** era un `role="dialog"` sin nombre. Ahora lo nombra su título (`aria-labelledby`), que pasa de `h3` a `h2` para no saltarse niveles de encabezado.
- **Barra de espacios de conjuro:** tenía `aria-label` en un `div` sin rol, que los lectores ignoran. Ahora es `role="group"`.
- **Menú «Más»:** era `role="menu"`, pero dentro hay cabecera, interruptor de tema y rejillas, que no pueden ir en un menú. Pasa a `role="dialog"` con nombre y botones normales. El botón que lo abre lleva `aria-haspopup="dialog"`, `aria-controls` y `aria-expanded`. «Pantalla encendida» usa `aria-pressed` en lugar de `menuitemcheckbox`.
- **Copia de seguridad:** el cuadro de texto no tenía etiqueta.

### 3. Teclado
Los menús desplegables (más opciones, descansos, escuela) se recorren con las flechas, Inicio y Fin, como cualquier menú de escritorio.

### 4. Contraste
La paleta por clase ya se calcula para cumplir AA (`domain/presentacion/paleta.js`), y la medida lo confirma en las 15 clases probadas. Los fallos estaban en colores fijos y opacidades:

| Dónde | Antes | Cambio |
|---|---|---|
| Texto terciario de día (`--ink-3`: leyendas, «Sin estados ni efectos», notas) | 4,1–4,3 | `#6A5B48` → `#615241` |
| Texto terciario de noche | 3,9–4,0 en superficies elevadas | luminosidad 65 % → 69 % |
| Estrella de «fijar» sin pulsar | 2,8–4,2 | sin la transparencia del 30 % |
| ▲ ▼ de ventaja/desventaja, de día | 3,5–3,9 | verde y rojo más oscuros |
| Verde de éxito de día (`--ok`) | 4,3 | `#2E7B58` → `#236A4A` |
| Acento de clase de día (cifras doradas pequeñas) | 4,2–4,4 sobre la viñeta | objetivo de luminancia 0,085 → 0,075 |
| Dado descartado con ventaja/desventaja | 1,9–2,4 | opacidad 0,4 → 0,62 (sigue tachado) y el lector anuncia «descartado» |

### 5. Fallo: con «reducir movimiento» los dados se quedaban atenuados
Con la animación quitada, los dados nunca pasaban por el fotograma que los «posa», así que sus números se quedaban al 70 % de opacidad para siempre (contraste 2,4–2,7). Ahora `sellar()` los posa siempre (`ui/animaciones/dadosVista.js`).

### 6. Letra demasiado pequeña
Había textos de 8–9,5 px: etiquetas del combate («manteniendo», iniciativa, alcance), del inventario, la casilla de CA y las marcas de ventaja de los dados. Ahora el mínimo es 9,5–10,5 px según el caso. Lo único que queda por debajo son los puntos ●●● de los espacios, que son un símbolo y no texto.

### 7. SEO, instalación y uso sin conexión en la web
- `meta description` y `robots.txt`. Antes, la ruta comodín de Vercel devolvía el HTML de la app como `robots.txt`.
- **Manifiesto web** con iconos de 192 y 512 px, uno *maskable* y otro para iOS (`apple-touch-icon`). Así, «Añadir a pantalla de inicio» crea una app de verdad, con icono y a pantalla completa. Los iconos salen de `tools/make_icons.py`.
- **Service worker** (solo en la web por `https`, nunca en la APK ni en el HTML de Windows). Lo genera Vite en cada build con la lista exacta de ficheros. Al instalarse guarda la app, las fuentes y el compendio; el lector de PDF solo si se usa. Las páginas siempre van primero a la red y la caché solo responde sin conexión, así que nunca se queda servida una versión vieja. Al publicar otra versión, la caché anterior se borra. Así la web funciona sin conexión, como promete el README, también en iPhone.

### 8. Pantalla de arranque
Hasta que llega el JS (unos 440 kB comprimidos), la web mostraba la barra superior y el dock vacíos. Ahora aparece el emblema sobre el fondo del tema y desaparece en cuanto la app está lista, o si el arranque falla. Con JavaScript desactivado sale un aviso en su lugar.

## Lo que no se ha cambiado

- **Partir el código principal en trozos.** Lighthouse calcula unos 200 kB de JS sin usar al abrir la portada. Casi todo son ventanas (inventario, biblioteca, diario…) que se importan entre sí y desde los eventos de la hoja. Cargarlas bajo demanda obliga a rehacer cómo se abren todas, y la ganancia solo se nota en la primera visita a la web: en la APK y en las visitas siguientes (ahora con service worker) el código ya está en el dispositivo.
- **La primera pintura en móvil (3,8 s simulados).** Es casi todo descarga del JS en la 4G lenta que simula Lighthouse. Con la caché del service worker, desde la segunda visita no depende de la red.
