# Grimorio — app de Android

El grimorio de Theo (y de quien quieras) convertido en una app de Android independiente, hecha con Capacitor 8. Funciona sin conexión, guarda los datos en el propio teléfono y se instala encima de versiones anteriores sin perder nada.

## Qué cambia respecto a la hoja del navegador

- **Sin internet.** Las fuentes (Alegreya, Alegreya Sans y Cinzel) van dentro de la app.
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

## Novedades 2.3: progresión completa de todas las clases

- **Las 12 clases, del nivel 1 al 20.** La app conoce todos los rasgos de clase del Manual del Jugador 2024 y los de sus 48 subclases, más las 8 subclases de Héroes de Faerûn: Colegio de la luna, Dominio del conocimiento, Caminante invernal, Abanderado, Hechicería del fuego mágico, Hojacantante, Juramento de los genios nobles y Vástago de los Tres. Los nombres están revisados contra los PDF.
- **Rasgos → «Tu clase a nivel N».** Muestra:
  - los valores que escalan con el nivel: puntos de golpe medios, dados de golpe, salvaciones, daño de Furia, Ataque furtivo, Artes marciales, invocaciones, Arcanum místico, ataques por acción…;
  - los rasgos ganados nivel a nivel, con los de la subclase resaltados;
  - los conjuros siempre preparados de la clase y la subclase (dominios, juramentos, patrones, círculos…), con un botón para añadir al libro los que falten.
- **Subir de nivel lo aplica solo.** El resumen dice los rasgos exactos de ese nivel en cualquier clase, y los conjuros siempre preparados nuevos entran en el libro al confirmar.
- **Más recursos de subclase:** Arcanum místico (brujo), Venganza ardiente, Precognición divina, Restablecer equilibrio, Sobrecarga domada, Salto psiónico, Bastión de fuerza, Canción de la hoja, Sed de sangre, Recuperación grupal, Represalia escalofriante, Represalia elemental, Vástago noble… La reserva del paladín se llama ahora como en el manual: Imponer las manos.
- **Un color y un emblema por subclase.** Las 56 subclases tienen su propio tono y su propio emblema, y cada una su fondo animado. Una prueba automática comprueba que no se repite ninguno.

### Rama `development` y personajes de prueba

Los cambios se prueban primero en la rama `development` y pasan a `main` cuando están listos. `main` sigue siendo la que genera el APK y la versión de Windows, y la que publica Vercel en producción.

- **Personajes de prueba.** En cualquier compilación que no sea de `main` (la rama `development`, sus vistas previas en Vercel o `npm run dev` en local), la app crea al arrancar un personaje de **nivel 8 por cada subclase**: 56 en total. Aparecen en la portada en su propia sección, «Personajes de prueba».
  - Cada uno viene montado de forma automática según las reglas: características con la matriz estándar, el trasfondo y las mejoras de característica; especie y trasfondo, con su dote de origen; trucos, conjuros preparados y conjuros siempre preparados de clase y subclase; el libro del mago con Experto en su escuela; invocaciones y rasgos propios.
  - Llevan también objetos mágicos (uno sintonizado y una varita con cargas), una sesión de diario con todos los tipos de nota, una criatura en el bestiario y una historia con sus rasgos.
  - «Regenerar personajes de prueba», en la portada, los vuelve a crear desde cero sin tocar tus personajes (se puede deshacer).
  - Para forzarlo en cualquier rama: `PERSONAJES_PRUEBA=1 npm run build` (o `=0` para quitarlo).
- **Pruebas automáticas en cada cambio.** GitHub pasa las pruebas y compila la web y la versión de Windows en cada cambio de `development` y en cada PR (`.github/workflows/pruebas.yml`). No publica nada.

## Novedades 2.1: biblioteca, objetos mágicos y bestiario

- **Más libros.** Libros y manuales importa ahora también la **Guía del Dungeon Master (2024)** y expansiones como **Héroes de Faerûn**. De cada PDF la app lee, en tu dispositivo, lo que reconozca:
  - conjuros (con sus tablas), glosario de reglas y apartados de reglas del DM (veneno, trampas, maldiciones, persecuciones, efectos ambientales…);
  - objetos mágicos con tipo, rareza, sintonización y cargas;
  - dotes (de origen, generales, de estilo de combate y dones épicos), trasfondos y subclases con todos sus rasgos.

  Con tus PDF: Manual del Jugador (391 conjuros, 130 términos, 73 dotes, 16 trasfondos, 47 subclases), Guía del DM (343 objetos, 27 apartados de reglas) y Héroes de Faerûn (17 conjuros, 32 dotes, 16 trasfondos, 8 subclases). Cuando el título de una entrada está dentro de una ilustración y no se puede leer, la app te lo pide al importar.
- **Biblioteca** (Más → Biblioteca, o desde la portada). Pestañas Reglas, Objetos, Dotes, Trasfondos y Subclases, con búsqueda:
  - Objetos: filtros por rareza (cada una con su color), tipo y «sin sintonización», y orden A–Z o por rareza.
  - Subclases: los rasgos nivel a nivel, con saltos a cada nivel; los que ya tiene tu personaje se marcan.
  - Las reglas largas llevan índice de apartados.
- **Tablas** en conjuros, objetos y reglas (*Confusión*, *Bolsa de judías*, la tabla de venenos…). En las de dado, «Tirar» saca un resultado y resalta la fila.
- **Objetos del personaje** (botón «Objetos» de la hoja). Desde la ficha de un objeto, «Añadir a …». Hay tres huecos de sintonización. Si el objeto tiene cargas, aparecen en la hoja como un recurso más y se recuperan solas al amanecer con sus dados (la *Varita de bolas de fuego* recupera 1d6+1).
- **Bestiario** (Diario → Bestiario). Por personaje, anota de cada criatura:
  - tipo, amenaza, situación, CA y puntos de golpe aproximados;
  - los 13 tipos de daño (toca para marcar vulnerable, resistente o inmune), estados a los que es inmune y salvaciones débiles o fuertes;
  - qué conjuros de tu libro funcionaron o no, tácticas, notas y sesiones en las que apareció (se vinculan desde cada sesión).

  La ficha de un conjuro solo lo menciona al pie, en una línea discreta y solo si hay algo que decir: «Tu bestiario: Trol del vado *vulnerable*». Toca el nombre para abrir la criatura.
- **Menú «Más» reordenado** en grupos: personaje, biblioteca y libros, sesión y ajustes, ayuda.

Tras actualizar, vuelve a importar tus libros (Más → Libros y manuales) para que se lean las tablas y el contenido nuevo.

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
  - Paladín: Imponer las manos y Canalizar divinidad.

  Se pueden desactivar o «Personalizar» (crea una copia editable). Los rasgos propios sirven para dotes, objetos o reglas de la mesa.
- **Descanso corto.** Aparece cuando hace falta. Recupera lo que toca y ofrece usar la recuperación de espacios.
- **Historial de la sesión.** En Más → Historial de la sesión:
  - Muestra cada conjuro, espacio, recurso y descanso, con la hora.
  - «Deshacer» vuelve a justo antes de esa acción, deshaciendo también todo lo posterior. Esto solo funciona mientras la app sigue abierta.
  - El texto del historial se guarda con el personaje.
- **Buscador.** Además de texto, nivel y lista de clase, filtra por escuela, solo rituales y sin concentración.

## Novedades de uso

- **Portada.** La app se abre en una portada con tus personajes, cada uno con el color y el emblema de su clase. Toca uno para abrir su hoja. El nombre de la barra superior te devuelve a la portada, y el botón Atrás de Android también. Una instalación nueva empieza sin personajes.
- **Tema por clase y subclase.** Cada clase y cada subclase (las del manual y las de Héroes de Faerûn) tienen su propio color y su propio emblema. El adivino conserva el dorado de vela.
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

## Libros y manuales (expansiones)

Más → **Libros y manuales** → «Importar libro (PDF)» sirve para el Manual del Jugador y para cualquier expansión en español con el mismo formato de fichas de conjuro. La app recorre todo el libro en tu dispositivo y recoge cuatro cosas:

- **Descripciones** de los conjuros que ya conoce, que aparecen en la ficha de cada conjuro.
- **Conjuros nuevos** con todos sus datos técnicos. Entran en el buscador marcados con el nombre del libro, y con ellos funcionan las tiradas, el glosario y la cuadrícula de áreas.
- **El glosario de reglas**, si el libro lo tiene.
- **Subclases.** Las que detecta y no conoce se proponen para que confirmes la clase y el nombre, y pasan a las sugerencias del campo Subclase.

Además:

- Cada libro aparece en la lista con lo que aporta, y se puede **quitar** por separado.
- El campo Subclase de la ficha del personaje admite cualquier nombre, así que puedes usar una subclase nueva aunque no la hayas importado. Sus recursos se añaden en Rasgos → «Añadir rasgo propio».
- Si ya habías importado el manual con la versión anterior, se convierte solo al nuevo formato. Aun así, conviene volver a importarlo para aprovechar las mejoras del lector.
- Nada se sube a ningún sitio: los textos de los libros solo están en tu dispositivo.

Sobre la calidad de lectura del Manual del Jugador: la app se ha comparado conjuro a conjuro con un segundo lector de PDF independiente, y el 92 % de los conjuros coinciden palabra por palabra. Las diferencias restantes están casi todas en tablas (el perfil de las criaturas invocadas, *Teletransporte*, *Controlar el clima*), que el PDF guarda desordenadas; consúltalas en el libro si hace falta.

## Flujo de los conjuros

- **Al lanzar** un conjuro con tiradas se abre directamente la bandeja de dados. En los trucos no hay aviso previo.
- **Salvación:** la bandeja pregunta qué ha sacado el objetivo (ha fallado, ha superado o varios objetivos) y muestra el efecto de cada caso.
  - El daño se aplica completo, a la mitad o nada, según diga el conjuro. Con varios objetivos, una sola tirada da el total para quien falle y la mitad para quien supere.
- **Ataque:** ventaja o desventaja. El crítico (dados dobles) solo existe en los conjuros de ataque, y se marca solo con un 20 natural.
- **Daños automáticos:** los que no dependen de ataque ni salvación (las telarañas en llamas de *Telaraña*) se tiran directamente y nunca son críticos.
- **Alternativas y dados extra:** las alternativas se muestran con su condición (*Tañido por los muertos*: 1d12 si al objetivo le faltan puntos de golpe). Los dados que no son daño, como el 1d4 de *Fragmento mental*, tienen su propio botón.
- **Ficha del conjuro:** resalta dados, tipos de daño (con su icono y color), salvaciones, ataques y distancias. Enlaza al glosario los estados y también la visión ciega, la visión verdadera, la iluminación («muy oscura», luz tenue…), el terreno difícil, la cobertura, maltrecho y las formas de área.
- **Ver área en la cuadrícula:** en los conjuros con área (esfera, cubo, cono, línea, emanación o cilindro) muestra una cuadrícula de casillas de 1,5 m con el lanzador y las casillas afectadas (las cubiertas al menos a la mitad).
  - Se puede girar, acercar y mostrar el alcance, con el área colocada en su punto más lejano.
- **Recursos propios con recarga por dados**, como una varita que recupera 1d3 cargas al amanecer, y consumibles que no se recargan. Las tiradas de recarga aparecen al descansar y quedan en el historial.

**Tras actualizar, vuelve a importar el manual** (Más → Manual del jugador). Así se aplican las mejoras del lector, como la errata del pie de foto en *Disipar magia*.

## Retrato, historia y diario

- **Retrato.** Toca el círculo junto al nombre en la hoja (o «Añadir retrato» en Editar personaje) y elige una imagen. Arrastra para encuadrar y acerca con el deslizador, la rueda o pellizcando. Puedes volver a encuadrarla, cambiarla o quitarla cuando quieras.
  - Aparece en la portada, en la barra superior, en la cabecera de la hoja, en la lista de personajes, en la historia y en el diario.
  - La miniatura va con el personaje y en las copias de seguridad. El original se guarda aparte en el dispositivo, para reencuadrar sin perder calidad.
- **Historia.** Botón «Historia» de la hoja. Trae índice de capítulos, búsqueda con resaltado (por ejemplo, «Iliana») y tiempo de lectura.
  - Se escribe o se pega con un formato sencillo: `## Capítulo`, `### Apartado`, `---` para un cambio de escena y `>` para una cita.
  - También se importa desde un PDF, un TXT o un Markdown: la app quita las cabeceras repetidas y detecta capítulos y párrafos.
  - Para Theo tienes el archivo `Theo - Historia.md`, preparado a partir de su trasfondo: impórtalo desde Historia → Importar.
- **Diario de sesión.** Botón «Diario». Cada sesión tiene título, fecha, notas rápidas y una crónica libre, y se guarda mientras escribes.
  - Las notas pueden ser de cuatro tipos: nombre, suceso, pendiente o nota.
  - Como en el cuaderno de Theo: **S** subraya lo que no quieres olvidar y **T** tacha lo que ya está resuelto.
  - Lo subrayado y los pendientes sin tachar aparecen en la hoja, en «Para recordar», al empezar la siguiente sesión. Se pueden tachar desde ahí mismo.
  - El diario tiene búsqueda en todas las sesiones.

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

La estética es la de un grimorio iluminado. Cada personaje tiñe la app con el color de su clase: el acento, el papel, los ornamentos y el fondo. Hay dos temas:

- **Noche:** tinta profunda con el tono de la clase, luz de vela y viñeta.
- **Día:** vitela cálida con un leve grano de papel.

**Tipografía.** Cinzel para nombres y títulos, Cinzel Decorative solo para el título de la portada, Alegreya para leer y Alegreya Sans para los controles. Todas van dentro de la app y funcionan sin conexión.

**Fondo vivo por clase y subclase** (`ui/fondo.js`). Un único lienzo detrás de la hoja pinta una escena distinta para cada una:

| Escena | Clases y subclases | Qué se ve |
|---|---|---|
| Astral | Adivino, Mago, Estrellas, Luna | estrellas, constelaciones que se trazan y alguna fugaz |
| Ascuas | Evocador, Hechicero, Dracónica, Bárbaro, Infernal | brasas que suben |
| Vacío | Brujo, Aberrante, Sombra, Pícaro | niebla lenta y motas |
| Halo | Clérigo, Paladín, Luz, Vida, Celestial | rayos de luz y polvo dorado |
| Arboleda | Druida, Explorador, Tierra, Feérico | luciérnagas y hojas |
| Canción | Bardo | notas sobre un pentagrama ondulante |
| Calma | Monje | ondas de tinta y pétalos |
| Forja | Guerrero, Mecánica | chispas del yunque |
| Guarda | Abjurador | retícula hexagonal que late |
| Prisma | Ilusionista, Salvaje | pompas irisadas |

El fondo pinta a unos 30 fotogramas por segundo y se detiene con la app en segundo plano o con una hoja a pantalla completa en el móvil.

**Ornamentos.** Diálogos, menús, tarjetas de personaje, recursos y listas de conjuros llevan esquinas de filigrana propias:

- La ficha de un conjuro se enmarca con el color de su escuela.
- Las confirmaciones llevan un sello de lacre y los avisos son un pergamino.
- El círculo rúnico es el motivo común: está en la portada y alrededor del retrato, y aparece al lanzar y al subir de nivel.

**Menú «Más» compacto.** El botón es una hamburguesa que se convierte en una X. Dentro hay:

- una cabecera con el personaje y un interruptor de día o noche;
- una rejilla con las secciones;
- las utilidades en pequeño.

**Los elementos visuales llevan información:**

- Velas: son los espacios de conjuro. Encendida es libre y respira; apagada es gastada.
- Color de escuela: está en la barra lateral de cada conjuro, en su brillo al pasar el ratón y en las chispas y el círculo al lanzarlo.
- Dorado: marca lo que activa un rasgo al lanzar, los usos gratis y lo siempre preparado.

**Movimiento.** Solo hay animación cuando la persona hace algo:

- Al pulsar un botón sale una onda de luz desde el punto del toque.
- Al abrir un grimorio desde la portada se abre un portal circular.
- Las tarjetas de la portada se inclinan con el ratón.
- Los diálogos se despliegan como una página. En el móvil suben desde abajo.
- Al lanzar un conjuro aparece un círculo rúnico con chispas de su escuela.
- Al subir de nivel hay un doble círculo y un estallido de luz. El descanso largo trae un amanecer.
- En el diario, las notas nuevas se escriben con la pluma. Subrayar y tachar se trazan, y borrar quema la nota.
- En las tiradas el dado gira al salir, y el crítico late.

Todo respeta la opción del sistema «Reducir movimiento»: el fondo queda quieto y no hay ondas, sellos ni portal. En el móvil, las acciones principales van en un dock inferior al alcance del pulgar. En tableta horizontal y escritorio, la lista pasa a tabla. Imprimir sigue dando una hoja limpia, sin fondo ni ornamentos.

Los ornamentos, runas y sellos están dibujados para esta app. No usa logotipos ni símbolos de marcas registradas.

## Arquitectura

```
web/                     código fuente (Vite)
  index.html             esqueleto de la página
  public/data/           compendio SRD 5.2
  src/
    core/                store (estado único, historial y deshacer, guardado) y utilidades
    domain/              reglas 2024, progresión de clases y subclases (clases2024), rasgos, modelo y migraciones, catálogo,
                         subida de nivel, personajes de prueba (pruebas), lectores de libros
                         (conjuros, tablas, objetos, dotes, trasfondos, subclases, reglas), equipo y bestiario (sin DOM)
    platform/            adaptador de Capacitor (almacenamiento, vibración, compartir…)
    app/                 casos de uso (lanzar, descansar…) y controlador de eventos
    ui/                  hoja, diálogos, efectos visuales (fx, fondo vivo, magia), iconos
    styles/              tokens de diseño, base, hoja, diálogos, movimiento, impresión y capa «arcano»
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
npm test           # pruebas (58)
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

Fuentes Alegreya, Alegreya Sans, Cinzel y Cinzel Decorative bajo licencia SIL Open Font License 1.1.
