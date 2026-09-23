# Grimorio — app de Android

El grimorio de Theo (y de quien quieras) convertido en una app de Android independiente, hecha con Capacitor 8. Funciona sin conexión, guarda los datos en el propio teléfono y se instala encima de versiones anteriores sin perder nada.

## Qué cambia respecto a la hoja del navegador

- **Sin internet.** Las fuentes (Alegreya y Alegreya Sans) van dentro de la app.
- **Datos a prueba de limpiezas.** Se guardan en el almacenamiento nativo de Android, no en el del navegador. La copia automática de Android (Google) también los incluye.
- **Copia de seguridad en archivo.** Más → Copia de seguridad → «Guardar en archivo» abre el menú de compartir de Android: Drive, correo, WhatsApp, lo que quieras. «Abrir archivo» la recupera.
- **Botón Atrás.** Cierra el diálogo, el menú, el aviso o el modo edición, en ese orden. Si no hay nada abierto, minimiza la app.
- **Pantalla siempre encendida.** Opción en «Más», pensada para tener la hoja abierta en mesa.
- **Vibración nativa** al lanzar, gastar espacios y descansar.
- **Barras del sistema** que siguen el tema claro u oscuro de la hoja.
- **Imprimir** desaparece dentro de la app (Android no lo permite desde aquí). La hoja sigue imprimiéndose desde el navegador.

## Personajes y catálogo de conjuros

La app guarda varios personajes. Cada uno tiene su propio libro de conjuros, sus espacios gastados y su concentración. Los datos de cada conjuro (nombre, escuela, alcance…) viven en un **catálogo compartido**: si Theo tiene *Clarividencia* y otro personaje la aprende, se añade con un toque y ya viene completa. Si corriges un conjuro en modo edición, se corrige para todos los que lo tengan.

- **Personajes:** botón «Cambiar de personaje» bajo el nombre, o Más → Personajes. Desde ahí se crean, editan, duplican y borran (con Deshacer).
- **Ficha del personaje:** nombre, especie, trasfondo, clase, subclase, nivel, características, lema y campaña. Con eso la app calcula, según el Manual del Jugador de 2024, estos datos:
  - bonificador de competencia, CD y ataque de conjuro;
  - espacios de conjuro de lanzadores completos, medios y de un tercio, y la magia de pacto del brujo;
  - número de conjuros preparados y de trucos;
  - rasgos del mago (Recuperación arcana, Adepto de los rituales) y del adivino (Presagio, Adivino avezado).
- **Subir de nivel:** al cambiar el nivel, el resumen dice qué gana el personaje antes de guardar.
- **Presagio:** anota los dos d20 tras el descanso largo; al usarlos se tachan, como en el cuaderno.
- **Clases sin conjuros:** un guerrero o pícaro lanza conjuros si su subclase es Caballero arcano o Embaucador arcano. Cualquier personaje puede añadir conjuros de dotes o especie; se marcan como siempre preparados con uso gratis 1/DL.
- **Multiclase o reglas de la mesa:** en la ficha, «Espacios de conjuro a mano». También hay bonificadores extra a la CD y al ataque para objetos.

Si tenías datos de la versión anterior, se convierten solos al abrir la app. Las copias de la hoja del navegador se pueden cargar y entran como un personaje más.

## Descripciones, compendio SRD y subida de nivel

- **Ficha del conjuro.** Mantén pulsado un conjuro para leerlo entero: resumen para la mesa, datos técnicos, descripción y efecto con espacios superiores. Debajo están las opciones para lanzarlo. «Editar texto» permite escribir o corregir la descripción en español; en modo edición, el botón «Texto» de cada fila hace lo mismo.
- **Compendio SRD 5.2 dentro de la app.** Trae los 339 conjuros del System Reference Document 5.2 y funciona sin conexión.
  - Los datos técnicos ya vienen en español y en metros.
  - El texto está en inglés, salvo los conjuros de Theo, que ya están traducidos.
  - Los nombres en español son una propuesta y se pueden cambiar.
- **Añadir conjuros.** «Añadir conjuro» busca a la vez en tu catálogo y en el compendio, filtrando por la lista de tu clase y por nivel. «Ver» abre la ficha antes de añadirlo. Los conjuros de otros manuales (como *Astilla mental*) se siguen creando a mano.
- **Subir de nivel, paso a paso.** Cada paso pide solo lo que cambia:
  - qué ganas;
  - la subclase (a nivel 3);
  - la mejora de característica o la dote;
  - los 2 conjuros del libro del mago y el conjuro gratis de Experto en tu escuela (Abjurador, Adivino, Evocador o Ilusionista);
  - los nuevos preparados de otras clases y los trucos nuevos.

  Nada se guarda hasta confirmar, lo elegido se anota en «Dotes y notas» y todo se puede deshacer. La ficha del personaje sigue sirviendo para correcciones o saltos de varios niveles.

El material del SRD 5.2 es de Wizards of the Coast LLC, con licencia Creative Commons Attribution 4.0. La atribución completa está en Más → Acerca de y licencias. `tools/build_compendio.py` regenera `web/public/data/compendio.json` a partir de los datos técnicos del manual (`tools/manual_datos.json`, sin textos) y del SRD de Open5e.

## Rasgos, recursos e historial

- **Rasgos y recursos.** Botón «Rasgos» bajo el nombre. Cada rasgo es de uno de estos cuatro tipos:
  - **Recurso con usos:** se gasta con casillas o, si son muchos puntos, con − y +.
  - **Dados que se anotan:** como Presagio.
  - **Recuperar espacios:** como Recuperación arcana; abre una ventana para elegir qué espacios recuperas.
  - **Efecto al lanzar un conjuro:** con condición de escuela y de espacio mínimo; recupera un espacio o muestra un aviso.
- **Plantillas de clase.** Las clases traen sus rasgos de 2024 como plantillas que se ajustan solas al nivel:
  - Bárbaro: Furia.
  - Bardo: Inspiración bárdica.
  - Brujo: Astucia mágica.
  - Clérigo: Canalizar divinidad e Intervención divina.
  - Druida: Forma salvaje, y Recuperación natural en el Círculo de la tierra.
  - Explorador: Enemigo predilecto.
  - Guerrero: Nuevas energías y Oleada de acción.
  - Hechicero: Hechicería innata y puntos de hechicería.
  - Mago: Recuperación arcana. Adivino: Presagio y Adivino avezado. Evocador: Evocación potenciada.
  - Monje: puntos de concentración.
  - Paladín: Imposición de manos y Canalizar divinidad.

  Se pueden desactivar o «Personalizar» (crea una copia editable). Los rasgos propios sirven para dotes, objetos o reglas de la mesa.
- **Descanso corto.** Aparece cuando hace falta. Recupera lo que toca y ofrece usar la recuperación de espacios.
- **Historial de la sesión.** En Más → Historial de la sesión:
  - Muestra cada conjuro, espacio, recurso y descanso, con la hora.
  - «Deshacer» vuelve a justo antes de esa acción, deshaciendo también todo lo posterior. Esto solo funciona mientras la app sigue abierta.
  - El texto del historial se guarda con el personaje.
- **Buscador.** Además de texto, nivel y lista de clase, filtra por escuela, solo rituales y sin concentración.

## Novedades de uso

- **Portada.** La app se abre en una portada con tus personajes, cada uno con el color y el emblema de su clase. Toca uno para abrir su hoja. El nombre de la barra superior te devuelve a la portada, y el botón Atrás de Android también. Una instalación nueva empieza sin personajes.
- **Tema por clase y subclase.** Cada clase tiene su color y su emblema, y algunas subclases el suyo propio. El adivino conserva el dorado de vela.
- **Espacios de conjuro.** Son círculos: llenos si están libres y un anillo vacío si están gastados, con animación al cambiar. El número de cada nivel en la barra superior te lleva a sus conjuros.
- **Tiradas.** Tras lanzar un conjuro, «Tirar» abre la bandeja de dados. También desde la ficha del conjuro → Tiradas. Permite:
  - ataque con ventaja o desventaja y aviso de crítico;
  - daño o curación escalados al nivel del personaje (trucos) o al espacio usado;
  - dados dobles en crítico.

  Cada tirada queda en el historial. Los conjuros que hacen daño muestran el icono de su tipo en la lista.
- **Glosario de reglas.** Al importar tu manual se lee también el glosario (130 entradas). Los estados (apresado, hechizado, incapacitado…) aparecen enlazados en las descripciones: tócalos para leer la regla. Todo el glosario está en Más → Glosario de reglas.
- **Tutorial.** Se muestra la primera vez en la portada y en la hoja. Se repite desde Más → Ver tutorial o desde la portada.
- **Avisos propios.** Las confirmaciones, como borrar un personaje, y las preguntas usan ventanas de la propia app, no las del navegador.

Iconos temáticos: game-icons.net (CC BY 3.0). `node tools/iconos.mjs` regenera el módulo con los que usa la app.

## Manual del jugador y compendio

- **Compendio.** La app trae los **391 conjuros del Manual del Jugador 2024** con su nombre oficial en español y sus datos técnicos: nivel, escuela, clases, tiempo, alcance, componentes, duración, ritual y concentración. De los que están en el SRD 5.2 incluye además su texto en inglés (licencia CC-BY 4.0).
- **Descripciones completas en español.** En Más → Manual del jugador → «Elegir PDF» escoges tu propio PDF del manual. La app lee el capítulo de conjuros en el dispositivo (unos segundos) y guarda las descripciones solo ahí: no se suben a ningún sitio ni van en las copias de seguridad. Desde ese momento, la ficha de cada conjuro muestra el texto del manual con su apartado de nivel superior o de mejora de truco. Si escribiste un texto propio, se sigue mostrando el tuyo.
- **Nombres oficiales.** Al importar (o con «Solo nombres oficiales») puedes pasar tus conjuros a los nombres y datos técnicos del manual: «Contraconjuro» pasa a «Contrahechizo», «Astilla mental» a «Fragmento mental». Tus resúmenes y textos no se tocan, y se puede deshacer.
- **Clases.** Las subclases, especies y trasfondos usan los nombres oficiales, y los recursos de cada clase y subclase están revisados contra el manual. Algunos ejemplos:
  - Tomar aliento, Acción súbita e Indómito.
  - Dados de supremacía y dados de energía psiónica.
  - Castigo de paladín y Corcel fiel.
  - Suerte del Oscuro y Luz sanadora.
  - Metabolismo asombroso.
  - Recuperación mágica.

## Diseño

La estética parte del mundo del personaje: el cuaderno de un adivino de noche. Hay dos temas:

- **Noche:** tinta profunda, luz de vela dorada y un astrolabio que gira muy despacio tras el nombre.
- **Día:** papel azulado y tinta.

Los elementos visuales llevan información:

- **Velas:** son los espacios de conjuro. Encendida es libre, apagada es gastada.
- **Color de escuela:** cada escuela de magia tiene el suyo, en la barra lateral de cada conjuro y en las chispas al lanzarlo.
- **Dorado:** marca lo que activa un rasgo al lanzar, los usos gratis y lo siempre preparado.

Movimiento: las llamas parpadean, se apagan con humo al gastar un espacio y se encienden al recuperarlo. Además:

- Al lanzar un conjuro saltan chispas del color de su escuela.
- El descanso largo trae un amanecer.
- Al subir de nivel hay un estallido de luz dorada.
- El nombre se subraya al abrir un personaje.
- Las hojas suben desde abajo en el móvil.

Todo respeta la opción del sistema «Reducir movimiento». En el móvil, las acciones principales van en un dock inferior al alcance del pulgar. En tableta horizontal y escritorio, la lista pasa a tabla. Imprimir sigue dando una hoja limpia.

## Arquitectura

```
web/                     código fuente (Vite)
  index.html             esqueleto de la página
  public/data/           compendio SRD 5.2
  src/
    core/                store (estado único, historial y deshacer, guardado) y utilidades
    domain/              reglas 2024, rasgos, modelo y migraciones, catálogo, subida de nivel, lector del manual (sin DOM)
    platform/            adaptador de Capacitor (almacenamiento, vibración, compartir…)
    app/                 casos de uso (lanzar, descansar…) y controlador de eventos
    ui/                  hoja, diálogos, efectos visuales, iconos
    styles/              tokens de diseño, base, hoja, diálogos, movimiento e impresión
tests/                   pruebas de reglas, rasgos y store (node:test)
www/                     resultado de la compilación (no se sube: lo genera GitHub)
```

Patrones principales:

- **Store y Command:** toda mutación pasa por `act()` (se anota y se puede deshacer) o `edit()`.
- **Adapter:** para la plataforma.
- **Despachador de órdenes (`data-cmd`):** lo comparten el dock, la barra y los menús.
- **Pintado por secciones:** solo se reconstruye lo que cambia (unos 10 ms por toque).
- **Carga diferida:** los plugins nativos y el compendio se cargan solo cuando hacen falta.

Comandos:

```
npm install
npm run dev        # servidor local con recarga
npm test           # pruebas (30)
npm run build      # compila web/ en www/ (Android)
npm run build:windows  # un solo HTML para Windows en dist-windows/
npm run sync       # compila y copia al proyecto Android
```

## Compilar el APK sin instalar nada (GitHub)

GitHub compila la app en sus servidores, gratis. Es más cómodo hacerlo desde un ordenador.

1. Crea una cuenta en github.com si no la tienes.
2. Pulsa **New repository**. Nombre: `grimorio`. Márcalo como **Private** (importante, ver «Seguridad» abajo). Créalo vacío.
3. En el repositorio nuevo, pulsa **uploading an existing file**. Arrastra **todo el contenido** de esta carpeta (no la carpeta en sí, sino lo que hay dentro) y pulsa **Commit changes**. GitHub admite 100 archivos por subida; si protesta, súbelo en dos veces (por ejemplo, primero `android` y después el resto).
4. Comprueba que se ha subido la carpeta `.github`. Algunos navegadores no suben carpetas que empiezan por punto. Si no aparece: **Add file → Create new file**, escribe como nombre `.github/workflows/compilar-apk.yml`, pega dentro el contenido de ese archivo y guarda.
5. Ve a la pestaña **Actions**. Verás «Compilar APK» en marcha. Tarda unos 5 minutos la primera vez.
6. Cuando termine en verde, el APK aparece en la portada del repositorio, a la derecha, en **Releases**.

Cada vez que subas un cambio, se compila una versión nueva con un número mayor. También puedes lanzarla a mano desde Actions → Compilar APK → **Run workflow**.

## Versión web en Vercel (opcional)

El proyecto incluye `vercel.json`, así que Vercel sabe cómo compilarlo:

1. Entra en vercel.com con tu cuenta de GitHub.
2. Pulsa **Add New → Project** y elige este repositorio. Si no aparece, da permiso a Vercel para verlo con «Adjust GitHub App Permissions».
3. No cambies nada de la configuración y pulsa **Deploy**.

Tendrás una dirección `…vercel.app` que se actualiza sola con cada cambio que subas a `main`. Si alguna prueba falla, no se publica.

Tus personajes nunca se suben a Vercel: se guardan en el navegador de cada dispositivo, como en el móvil. Lo que sí es visible para quien tenga el enlace es la propia app con la hoja de ejemplo de Theo. Si quieres restringirla, mira Settings → Deployment Protection en Vercel; lo que se puede proteger depende del plan.

## Versión para Windows (un solo archivo)

Cada compilación genera también `grimorio-windows-1.0.N.html`, en **Releases** junto al APK. Es la misma app en un único archivo de unos 2,5 MB:

- **Abrirla:** descárgalo, guárdalo donde quieras (por ejemplo, en Documentos) y ábrelo con doble clic en Edge o Chrome.
- **Sin instalación:** no instala nada, no necesita conexión y no hace ninguna petición a internet.
- **Tus datos:** se guardan en ese navegador y en ese PC. Si cambias de navegador o de carpeta, puede parecer vacía; vuelve a abrirlo desde el mismo sitio o carga una copia.
- **Pasar datos entre móvil y PC:** Más → Copia de seguridad → «Guardar en archivo» en uno, y «Abrir archivo» en el otro.
- **Manual del jugador:** se importa igual, desde Más → Manual del jugador. En el PC tarda unos segundos, y las descripciones quedan en ese navegador.
- **Imprimir** funciona aquí (en Android no), y da la hoja limpia en A4 apaisado.
- **Actualizar:** descarga el archivo nuevo y sustituye al anterior con el mismo nombre y en la misma carpeta, y tus datos seguirán ahí. Por si acaso, haz antes una copia de seguridad.

Para generarlo en tu ordenador: `npm run build:windows` deja el archivo en `dist-windows/grimorio.html`.

## Instalar en el móvil o la tablet

1. Desde el dispositivo, entra en el repositorio (con tu sesión de GitHub iniciada), abre **Releases** y descarga el `.apk` de la última versión.
2. Ábrelo. Android pedirá permiso para que el navegador instale apps: concédelo.
3. Si Play Protect avisa de que es una app desconocida, elige **Instalar de todos modos**. Es normal en apps que no vienen de la Play Store.

Para actualizar, instala el APK nuevo encima. Los datos se conservan.

## Pasar tus datos desde la hoja del navegador

1. En la hoja antigua: Más → Copia de seguridad. Copia todo el texto.
2. En la app: Más → Copia de seguridad. Borra el texto que hay, pega el tuyo y pulsa **Cargar copia**.

Si te equivocas, el aviso que aparece tiene **Deshacer**.

## Seguridad

La clave de firma (`android/app/grimorio-release.keystore` y `android/keystore.properties`) va dentro del proyecto para que GitHub pueda firmar siempre igual. Por eso el repositorio debe ser privado.

No la pierdas ni la cambies: si la app se firma con otra clave, Android obligará a desinstalar la anterior y se perderán los datos. Antes de cualquier cambio grande, haz una copia de seguridad en archivo.

## Modificar la hoja

El código está en `web/src/`. Súbelo al repositorio y GitHub pasará las pruebas, compilará la web y generará el APK. Para probar en el ordenador: `npm install` y `npm run dev`.

## Compilar en tu ordenador (opcional)

Con Node 22, JDK 21 y Android Studio instalados:

```
npm install
npm run sync
cd android
./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/`. También puedes abrir la carpeta `android` en Android Studio.

## Estructura

```
web/                 la app (código fuente, ver «Arquitectura»)
android/             proyecto Android (icono, colores, firma)
.github/workflows/   compilación automática en GitHub
tools/make_icons.py  regenera el icono y la pantalla de carga
tools/build_compendio.py  regenera el compendio (datos del manual + SRD)
capacitor.config.json
vercel.json          cómo compila Vercel la versión web
```

Fuentes Alegreya y Alegreya Sans bajo licencia SIL Open Font License 1.1 (ver `www/fonts`).
