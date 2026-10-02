# Auditoría de objetos mágicos (Guía del Dungeon Master de 2024)

Generado por `tools/auditoria-objetos.mjs` con los 350 objetos que el lector saca del PDF de la Guía. Para cada uno:
si pide sintonización (y quién puede), las cargas y usos que pasan a la hoja como contadores con su recarga, las variantes que la app
pide elegir al añadirlo, y lo que la hoja aplica sola.

- **Automático**: la hoja aplica sus números (CA, salvaciones, características, ataque y daño, ventajas, resistencias, curación…).
- **En parte**: lleva la cuenta de cargas o usos, o automatiza una parte; el resto se consulta en el texto.
- **Se consulta**: efectos narrativos o de situación (volar, ver, invocar…): el texto está en la biblioteca.

Resumen: 171 automáticos, 78 en parte y 101 que se consultan.

## Cómo funcionan en la hoja

- **Sintonía**: hasta 3 objetos. No deja sintonizar si falta el requisito (clase, lanzador de conjuros, especie) ni con el objeto en el alijo; guardarlo en el alijo deshace la sintonía.
- **Cuándo cuenta un efecto**: el objeto tiene que ir encima (no en el alijo), sintonizado si lo pide y, si es arma o armadura, equipado. Excepciones que funcionan con solo llevarlas: Arma de advertencia, Filo de la fortuna, Hacha de los señores enanos, Espada de Kas, Martillo de rayos y Garrote grande atronador.
- **Cargas**: se crean como contador al añadir el objeto; si el libro da las cargas en dados («1d3 cargas», «1d6 + 3 cuentas») se tiran entonces. Se recargan al amanecer (descanso largo) con su tirada, todas o ninguna, y la nota dice qué pasa al gastar la última. Solo se ven en la hoja mientras el objeto se puede usar.
- **Usos diarios**: las propiedades que «no pueden volver a usarse hasta el siguiente amanecer» (o hasta un descanso) tienen su propio contador.
- **Consumibles**: pociones, pergaminos, aceites, polvos, fichas de pluma, gemas elementales, munición… se apilan y «Beber» o «Usar» gasta uno. Las dosis («1d4 + 1 dosis», «3d4 judías») se tiran al añadirlo.
- **Usos del objeto**: botones en el inventario (y al gastar su contador en la hoja) que hacen lo que dice el objeto: recuperar un espacio de conjuro (Perla de poder, Vara del pacto), curarte (Talismán de salud), tirar su daño (Bastón de impacto) o lanzar un conjuro gastando sus cargas, con la versión de nivel que pagan y la CD del objeto si la fija; la tirada del conjuro se abre sola.
- **Manuales y tomos**: «Leer» sube la característica 2 (hasta 30) y el libro pierde su magia.

## Objetos

| Objeto | Tipo | Rareza | Sintonía | Cargas y usos | Variantes | Estado | Qué hace la app |
|---|---|---|---|---|---|---|---|
| Abalorio de nutrición | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Abalorio de refrigerio | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Abanico del viento | Objeto maravilloso | Infrecuente | — | — | — | Automático | usos: Ráfaga de viento CD 13 [a voluntad] |
| Aceite de afilado | Poción | Muy raro | — | — | — | En parte | Consumible: «Usar» gasta uno; el efecto se consulta en el texto. |
| Aceite de etereidad | Poción | Raro | — | — | — | En parte | Consumible: «Usar» gasta uno; el efecto se consulta en el texto. |
| Aceite escurridizo | Poción | Infrecuente | — | — | — | En parte | Consumible: «Usar» gasta uno; el efecto se consulta en el texto. |
| Agujero portátil | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Alas de vuelo | Objeto maravilloso | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Alfombra voladora | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Amuleto a prueba de detección y localización | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Amuleto de la esquirla oscura | Objeto maravilloso | Común | Sí (un brujo; se comprueba) | — | — | Se consulta | Texto en la biblioteca. |
| Amuleto de los planos | Objeto maravilloso | Muy raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Amuleto de relojería | Objeto maravilloso | Común | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Amuleto de salud | Objeto maravilloso | Raro | Sí | — | — | Automático | Constitución 19 |
| Anillo de almacenamiento de conjuros | Anillo | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de caída de pluma | Anillo | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de calidez | Anillo | Infrecuente | Sí | — | — | Se consulta | Reduce en 2d8 el daño de frío: se aplica a mano. |
| Anillo de caminar sobre las aguas | Anillo | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de comandar elementales | Anillo | Legendario | Sí | cargas: 5, recupera 1d4+1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Anillo de escudo mental | Anillo | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de estrellas fugaces | Anillo | Muy raro | Sí | cargas: 6, recupera 1d6 al amanecer | — | Automático | usos: Luces danzantes [a voluntad], Luz [a voluntad], Fuego feérico [1 c.] |
| Anillo de evasión | Anillo | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Anillo de influencia animal | Anillo | Raro | — | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Encantar animal CD 13 [1 c.], Hablar con los animales [1 c.], Terror CD 13 [1 c.] |
| Anillo de invisibilidad | Anillo | Legendario | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de invocar djinns | Anillo | Legendario | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de libertad de acción | Anillo | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de los tres deseos | Anillo | Legendario | — | cargas: 3, no se recarga | — | Automático | usos: Deseo [1 c.] |
| Anillo de natación | Anillo | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Anillo de protección | Anillo | Raro | Sí | — | — | Automático | +1 CA; +1 a salvaciones |
| Anillo de regeneración | Anillo | Muy raro | Sí | — | — | Automático | usos: Regenerar 1d6 PG [a voluntad] |
| Anillo de resistencia | Anillo | Raro | — | — | Tipo de daño: 10 | Automático | resistencia: ácido; resistencia: frío; resistencia: fuego; resistencia: fuerza; resistencia: necrótico; resistencia: psíquico; resistencia: radiante; resistencia: relámpago; resistencia: trueno; resistencia: veneno |
| Anillo de retorno de conjuros | Anillo | Legendario | Sí | — | — | Automático | ventaja en salvaciones contra conjuros |
| Anillo de salto | Anillo | Infrecuente | Sí | — | — | Automático | usos: Salto [a voluntad] |
| Anillo de telequinesis | Anillo | Muy raro | Sí | — | — | Automático | usos: Telequinesis [a voluntad] |
| Anillo de visión de rayos X | Anillo | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Anillo del carnero | Anillo | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Cabeza de carnero [1–3 cargas] |
| Anteojos de encantamiento | Objeto maravilloso | Infrecuente | Sí | cargas: 3, descanso largo | — | Automático | usos: Hechizar persona CD 13 [1–3 cargas] |
| Anteojos de la noche | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Anteojos de visión minuciosa | Objeto maravilloso | Infrecuente | — | — | — | Automático | ventaja en Investigación si depende de la vista, a 30 cm o menos |
| Anteojos de vista de águila | Objeto maravilloso | Infrecuente | — | — | — | Automático | ventaja en Percepción si depende de la vista |
| Aparato de Kwalish | Objeto maravilloso | Legendario | — | — | — | Se consulta | Texto en la biblioteca. |
| Arco de energía | Arma (arco corto o largo) | Muy raro | Sí | — | Arma de base: 2 | Automático | arma (Arco corto +1): ataque y daño en combate |
| Arco juramentado | Arma (arco corto o largo) | Muy raro | Sí | — | Arma de base: 2 | Automático | arma (Arco corto): ataque y daño en combate; daño adicional anotado junto al ataque |
| Arma +1, +2 o +3 | Arma (cualquiera sencilla o marcial) | Varía | — | — | Arma de base: 38, Bonificador: 3 | Automático | arma (Bastón +1): ataque y daño en combate |
| Arma adamantina | Arma (cualquier arma cuerpo a cuerpo o munición) | Infrecuente | — | — | Arma de base: 34 | Automático | arma (Bastón): ataque y daño en combate |
| Arma de advertencia | Arma (cualquiera sencilla o marcial) | Infrecuente | Sí | — | Arma de base: 38 | Automático | arma (Bastón): ataque y daño en combate; ventaja en iniciativa |
| Arma de plata | Arma (cualquiera sencilla o marcial) | Común | — | — | Arma de base: 38 | Automático | arma (Bastón): ataque y daño en combate |
| Arma feroz | Arma (cualquiera sencilla o marcial) | Raro | — | — | Arma de base: 38 | Automático | arma (Bastón): ataque y daño en combate |
| Arma lanzaconjuro | Arma (cualquiera sencilla o marcial) | Varía | Sí | cargas: 6, recupera 1d6 al amanecer | Arma de base: 38, Nivel del conjuro: 9 | Automático | arma (Bastón): ataque y daño en combate |
| Armadura +1, +2 o +3 | Armadura (ligera, media o pesada) | Varía | — | — | Armadura de base: 12, Bonificador: 3 | Automático | CA de armadura +1 (Armadura acolchada +1 12, Des +0) |
| Armadura adamantina | Armadura (cualquier armadura media o pesada, salvo armadura depieles) | Infrecuente | — | — | Armadura de base: 8 | Automático | CA de armadura (Armadura adamantina (camisote de mallas) 13, Des +0) |
| Armadura de invulnerabilidad | Armadura (armadura de placas) | Legendario | Sí | Armazón de metal: 1, descanso largo | — | Automático | CA de armadura (Armadura de invulnerabilidad 18); resistencia: contundente, cortante, perforante |
| Armadura de marinero | Armadura (ligera, media o pesada) | Infrecuente | — | — | Armadura de base: 12 | Automático | CA de armadura (Armadura de marinero (armadura acolchada) 11, Des +0); usos: Recuperar 1d4 PG [1/día] |
| Armadura de mithral | Armadura (cualquier armadura media o pesada, salvo armadura de pieles) | Infrecuente | — | — | Armadura de base: 8 | Automático | CA de armadura (Armadura de mithral (camisote de mallas) 13, Des +0) |
| Armadura de placas de etereidad | Armadura (armadura de placas o media armadura) | Legendario | Sí | Armadura de placas de etereidad: 1, descanso largo | Armadura de base: 2 | Automático | CA de armadura (Armadura de placas de etereidad (armadura de placas) 18) |
| Armadura de placas enana | Armadura (media armadura o armadura de placas) | Muy raro | — | — | Armadura de base: 2 | Automático | CA de armadura +2 (Armadura de placas enana (media armadura) 17, Des +0) |
| Armadura de quita y pon | Armadura (ligera, media o pesada) | Común | — | — | Armadura de base: 12 | Automático | CA de armadura (Armadura de quita y pon (armadura acolchada) 11, Des +0) |
| Armadura de rescoldos | Armadura (ligera, media o pesada) | Común | — | — | Armadura de base: 12 | Automático | CA de armadura (Armadura de rescoldos (armadura acolchada) 11, Des +0) |
| Armadura de resistencia | Armadura (ligera, media o pesada) | Raro | Sí | — | Armadura de base: 12, Tipo de daño: 10 | Automático | CA de armadura (Armadura de resistencia (armadura acolchada, ácido) 11, Des +0); resistencia: ácido; resistencia: frío; resistencia: fuego; resistencia: fuerza; resistencia: necrótico; resistencia: psíquico; resistencia: radiante; resistencia: relámpago; resistencia: trueno; resistencia: veneno |
| Armadura de vulnerabilidad | Armadura (ligera, media o pesada) | Raro | Sí | — | Armadura de base: 12 | En parte | CA de armadura (Armadura de vulnerabilidad (armadura acolchada) 11, Des +0). La resistencia y la vulnerabilidad dependen del tipo elegido: se consultan. |
| Armadura demoníaca | Armadura (ligera, media o pesada) | Muy raro | Sí | — | Armadura de base: 12 | Automático | CA de armadura +1 (Armadura demoníaca (armadura acolchada) 12, Des +0) |
| Armadura lanzaconjuro | Armadura (ligera, media o pesada) | Varía | Sí | cargas: 6, recupera 1d6 al amanecer | Armadura de base: 12, Nivel del conjuro: 9 | Automático | CA de armadura (Armadura lanzaconjuro (armadura acolchada, truco) 11, Des +0) |
| Armadura resplandeciente | Armadura (ligera, media o pesada) | Común | — | — | Armadura de base: 12 | Automático | CA de armadura (Armadura resplandeciente (armadura acolchada) 11, Des +0) |
| Babuchas de trepar cual arácnido | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Bandas de hierro de Bilarro | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Baraja de ilusiones | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Baraja de múltiples cosas | Objeto maravilloso | Legendario | — | — | — | Se consulta | Cada carta se resuelve a mano. |
| Bastón de acróbata | Arma (bastón) | Muy raro | Sí | Desviar ataque: 1, descanso corto o largo | — | Automático | arma (Bastón +2): ataque y daño en combate; ventaja en Acrobacias |
| Bastón de curación | Bastón | Raro | Sí (un bardo, clérigo o druida; se comprueba) | cargas: 10, recupera 1d6+4 al amanecer | — | Automático | usos: Curar heridas [1 carga/nivel], Curar heridas en masa [5 c.], Restablecimiento menor [2 c.] |
| Bastón de enjambre de insectos | Bastón | Raro | Sí (un bardo, brujo, clérigo, druida, hechicero o mago; se comprueba) | cargas: 10, recupera 1d6+4 al amanecer | — | Automático | usos: Insecto gigante [4 c.], Plaga de insectos [5 c.] |
| Bastón de escarcha | Bastón | Muy raro | Sí (un brujo, druida, hechicero o mago; se comprueba) | cargas: 10, recupera 1d6+4 al amanecer | — | Automático | resistencia: frío; usos: Cono de frío [5 c.], Muro de hielo [4 c.], Nube de oscurecimiento [1 c.], Tormenta de hielo [4 c.] |
| Bastón de fuego | Bastón | Muy raro | Sí (un brujo, druida, hechicero o mago; se comprueba) | cargas: 10, recupera 1d6+4 al amanecer | — | Automático | resistencia: fuego; usos: Bola de fuego [3 c.], Manos ardientes [1 c.], Muro de fuego [4 c.] |
| Bastón de impacto | Bastón | Muy raro | Sí | cargas: 10, recupera 1d6+4 al amanecer | — | Automático | arma (Bastón +3): ataque y daño en combate; daño adicional anotado junto al ataque; usos: Golpe de impacto [1–3 cargas] |
| Bastón de la pitón | Bastón | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Bastón de la víbora | Bastón | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Bastón de las flores | Bastón | Común | — | cargas: 10, recupera 1d6+4 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Bastón de llamada de ave | Bastón | Común | — | cargas: 10, recupera 1d6+4 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Bastón de los bosques | Bastón | Raro | Sí | cargas: 6, recupera 1d6 al amanecer | — | Automático | arma (Bastón +2): ataque y daño en combate; +2 a ataque de conjuro; usos: Despertar [5 c.], Encantar animal [1 c.], Hablar con las plantas [3 c.], Hablar con los animales [1 c.], Localizar animales o plantas [2 c.], Muro de espinas [6 c.], Pasar sin rastro [2 c.], Piel robliza [2 c.] |
| Bastón de los magos | Bastón | Legendario | Sí (un brujo, hechicero o mago; se comprueba) | cargas: 50, recupera 4d6+2 al amanecer | — | En parte | arma (Bastón +2): ataque y daño en combate; +2 a ataque de conjuro; ventaja en salvaciones contra conjuros; usos: Abrir [2 c.], Agrandar/reducir [a voluntad], Bola de fuego (7) [7 c.], Cerradura arcana [a voluntad], Conjurar elemental [7 c.], Desplazamiento entre planos [7 c.], Detectar magia [a voluntad], Disipar magia [3 c.], Esfera de llamas [2 c.], Invisibilidad [2 c.], Luz [a voluntad], Mano de mago [a voluntad], Muro de fuego [4 c.], Pasamuros [5 c.], Protección contra el bien y el mal [a voluntad], Relámpago (7) [7 c.], Telaraña [2 c.], Telequinesis [5 c.], Tormenta de hielo [4 c.]. +2 al ataque de conjuro y ventaja contra conjuros mientras lo empuñas. |
| Bastón de marchitamiento | Bastón | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Marchitar [1 c.] |
| Bastón de poder | Bastón | Muy raro | Sí (un brujo, hechicero o mago; se comprueba) | cargas: 20, recupera 2d8+4 al amanecer | — | En parte | arma (Bastón +2): ataque y daño en combate; +2 CA; +2 a salvaciones; +2 a ataque de conjuro; usos: Bola de fuego (5) [5 c.], Cono de frío [5 c.], Globo de invulnerabilidad [6 c.], Inmovilizar monstruo [5 c.], Levitar [2 c.], Muro de fuerza [5 c.], Proyectil mágico [1 c.], Rayo debilitador [1 c.], Relámpago (5) [5 c.]. +2 a la CA, salvaciones y ataque de conjuro mientras lo empuñas (equipado). |
| Bastón de truenos y relámpagos | Bastón | Muy raro | Sí | — | — | Automático | arma (Bastón +2): ataque y daño en combate |
| Bastón del adorno | Bastón | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Bastón del cautivador | Bastón | Raro | Sí (un bardo, brujo, clérigo, druida, hechicero o mago; se comprueba) | cargas: 10, recupera 1d8+2 al amanecer; Resistir encantamiento: 1, descanso largo | — | Automático | usos: Entender idiomas [1 c.], Hechizar persona [1 c.], Orden imperiosa [1 c.] |
| Bastón lanzaconjuro | Bastón | Varía | Sí (un lanzador de conjuros; se comprueba) | cargas: 6, recupera 1d6 al amanecer | Nivel del conjuro: 9 | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Bola de cristal | Objeto maravilloso | Muy raro | Sí | — | — | Automático | usos: Escudriñar CD 17 [a voluntad] |
| Bola de cristal de leer mentes | Objeto maravilloso | Legendario | Sí | — | — | Automático | usos: Escudriñar CD 17 [a voluntad] |
| Bola de cristal de telepatía | Objeto maravilloso | Legendario | Sí | — | — | Automático | usos: Escudriñar CD 17 [a voluntad] |
| Bola de cristal de visión veraz | Objeto maravilloso | Legendario | Sí | — | — | Automático | usos: Escudriñar CD 17 [a voluntad] |
| Bolsa de contención | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Bolsa de judías | Objeto maravilloso | Raro | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Bolsa de trucos | Objeto maravilloso | Infrecuente | — | — | Color: 3 | Se consulta | Texto en la biblioteca. |
| Bolsa devoradora | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Botas aladas | Objeto maravilloso | Infrecuente | Sí | cargas: 4, recupera 1d4 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Botas de las tierras invernales | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | resistencia: frío |
| Botas de levitación | Objeto maravilloso | Raro | Sí | — | — | Automático | usos: Levitar [a voluntad] |
| Botas de pista falsa | Objeto maravilloso | Común | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Botas de velocidad | Objeto maravilloso | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Botas de zancadas y brincos | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | velocidad mínima 9 m |
| Botas élficas | Objeto maravilloso | Infrecuente | — | — | — | Automático | ventaja en Sigilo |
| Bote plegable | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Botella de ifrit | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Botella siemprehumeante | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Brasero para controlar elementales de fuego | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Brazales de arquería | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | +2 al daño con arcos |
| Brazales de defensa | Objeto maravilloso | Raro | Sí | — | — | Automático | +2 CA sin armadura ni escudo |
| Broche escudo | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | resistencia: fuerza |
| Caldero de renacimiento | Objeto maravilloso | Muy raro | Sí (un druida o un brujo; se comprueba) | — | — | Se consulta | Texto en la biblioteca. |
| Canica de fuerza | Objeto maravilloso | Raro | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Capa arácnida | Objeto maravilloso | Muy raro | Sí | Telaraña: 1, descanso largo | — | Automático | resistencia: veneno |
| Capa de desplazamiento | Objeto maravilloso | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Capa de invisibilidad | Objeto maravilloso | Legendario | Sí | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Capa de la mantarraya | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Capa de muchas modas | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Capa de murciélago | Objeto maravilloso | Raro | Sí | uso: 1, descanso largo | — | Automático | ventaja en Sigilo |
| Capa de protección | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | +1 CA; +1 a salvaciones |
| Capa del charlatán | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | Automático | usos: Puerta dimensional [1/día] |
| Capa élfica | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | ventaja en Sigilo |
| Capa ondulante | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Carcaj de Ehlonna | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Carillón de apertura | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Cayado del veterano | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Cerradura engañosa | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Cetro de mando | Vara | Raro | Sí | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Cetro de poder señorial | Vara | Legendario | Sí | Aterrorizar: 1, descanso largo; Drenar vida: 1, descanso largo; Paralizar: 1, descanso largo | — | Automático | arma (Maza +3): ataque y daño en combate; daño adicional anotado junto al ataque |
| Cimitarra de velocidad | Arma (cimitarra) | Muy raro | Sí | — | — | Automático | arma (Cimitarra +2): ataque y daño en combate |
| Cinturón de fuerza de gigante | Objeto maravilloso | Varía | Sí | — | Gigante: 6 | Automático | Fuerza 21; Fuerza 23; Fuerza 25; Fuerza 27; Fuerza 29 |
| Cinturón enano | Objeto maravilloso | Raro | Sí | — | — | Automático | +2 Constitución (máx. 20); ventaja en salvaciones contra el estado de envenenado; ventaja en Persuasión al tratar con enanos y duergars; resistencia: veneno |
| Colgante de inmunidad al veneno | Objeto maravilloso | Raro | Sí | — | — | Automático | inmunidad: veneno |
| Collar de adaptación | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | ventaja en salvaciones contra el estado de envenenado |
| Collar de bolas de fuego | Objeto maravilloso | Raro | — | cuentas: 1d6+3, no se recarga | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Collar de plegarias | Objeto maravilloso | Raro | Sí (un clérigo, druida o paladín; se comprueba) | cuentas: 1d4+2, descanso largo | — | Automático | usos: Castigo brillante [1 c.], Curar heridas (2) [1 c.], Bendición [1 c.], Viajar con el viento [1 c.], Restablecimiento mayor [1 c.], Guardián de la fe [1 c.] |
| Cota de escamas de dragón | Armadura (cota de escamas) | Muy raro | Sí | — | Dragón: 10 | Automático | CA de armadura +1 (Cota de escamas de dragón (azul) 15, Des +0); ventaja en salvaciones contra los ataques de aliento de los dragones; resistencia: relámpago; resistencia: frío; resistencia: ácido; resistencia: fuego; resistencia: veneno |
| Cubo de fuerza | Objeto maravilloso | Raro | Sí | cargas: 10, recupera 1d6 al amanecer | — | Automático | usos: Armadura de mago CD 17 [1 c.], Escudo CD 17 [1 c.], Pequeña choza de Leomund CD 17 [3 c.], Esfera elástica de Otiluke CD 17 [4 c.], Sanctasanctórum privado de Mordenkainen CD 17 [4 c.], Muro de fuerza CD 17 [5 c.] |
| Cubo de invocación | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Cuenco para controlar elementales de agua | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Cuerda de escalada | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Cuerda enredadora | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Cuerda reparadora | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Cuerno de alarma silenciosa | Objeto maravilloso | Común | — | cargas: 4, recupera 1d4 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Cuerno de estallido | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Cuerno del Valhalla | Objeto maravilloso | Varía | — | — | Metal: 4 | Se consulta | Texto en la biblioteca. |
| Cuero tachonado encantado | Armadura (armadura de cuero tachonado) | Raro | — | — | — | Automático | CA de armadura +1 (Cuero tachonado encantado 13, Des +0) |
| Dado del embustero | Objeto maravilloso | Común | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Daga de la ponzoña | Arma (daga) | Raro | — | uso: 1, descanso largo | — | Automático | arma (Daga +1): ataque y daño en combate |
| Decantador de agua interminable | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Defensora | Arma (cualquier arma cuerpo a cuerpo) | Legendario | Sí | — | Arma de base: 29 | En parte | arma (Bastón +3): ataque y daño en combate. Pasar el bonificador del arma a la CA se anota a mano. |
| Demonomicón de Iggwilv | Objeto maravilloso | Artefacto | Sí | cargas: 8, recupera 1d8 al amanecer; Contención: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Diadema de estallidos | Objeto maravilloso | Infrecuente | — | — | — | Automático | usos: Rayo abrasador [1/día] |
| Diadema de intelecto | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | Inteligencia 19 |
| Disolvente universal | Objeto maravilloso | Legendario | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Elixir de salud | Poción | Raro | — | — | — | Automático | «Beber»: curas las enfermedades mágicas y dejas de estar cegado, ensordecido, envenenado y paralizado. |
| Escarabajo protector | Objeto maravilloso | Legendario | Sí | cargas: 12, no se recarga | — | Automático | +1 CA; ventaja en salvaciones contra conjuros |
| Escoba danzante de Baba Yaga | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Escoba voladora | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Escudo +1, +2 o +3 | Armadura (escudo) | Varía | — | — | Bonificador: 3 | Automático | CA de escudo +1 (10 + Des, escudo) |
| Escudo animado | Armadura (escudo) | Muy raro | Sí | — | — | Automático | CA de escudo (10 + Des, escudo) |
| Escudo atrapaflechas | Armadura (escudo) | Raro | Sí | — | — | En parte | CA de escudo (10 + Des, escudo). +2 a la CA solo contra ataques a distancia: se consulta. |
| Escudo centinela | Armadura (escudo) | Infrecuente | — | — | — | Automático | CA de escudo (10 + Des, escudo); ventaja en iniciativa; ventaja en Percepción |
| Escudo de atraer proyectiles | Armadura (escudo) | Raro | Sí | — | — | Automático | CA de escudo (10 + Des, escudo) |
| Escudo de caballero | Armadura (escudo) | Muy raro | Sí | Campo protector: 1, descanso largo | — | Automático | CA de escudo +2 (10 + Des, escudo) |
| Escudo de guarda contra conjuros | Armadura (escudo) | Muy raro | Sí | — | — | Automático | CA de escudo (10 + Des, escudo); ventaja en salvaciones contra conjuros y otros efectos mágicos |
| Escudo expresivo | Armadura (escudo) | Común | — | — | — | Automático | CA de escudo (10 + Des, escudo) |
| Esfera de aniquilación | Objeto maravilloso | Legendario | — | — | — | Se consulta | Texto en la biblioteca. |
| Espada danzarina | Arma (cimitarra, espada corta, espada larga, espadón o estoque) | Muy raro | Sí | — | Arma de base: 5 | Automático | arma (Cimitarra): ataque y daño en combate |
| Espada de hoja afilada | Arma (cimitarra, espada larga, espadón o guja) | Muy raro | Sí | — | Arma de base: 4 | Automático | arma (Cimitarra): ataque y daño en combate |
| Espada de Kas | Arma (espada larga) | Artefacto | Sí | — | — | Automático | arma (Espada larga +3): ataque y daño en combate; resistencia: necrótico; daño adicional anotado junto al ataque |
| Espada de la respuesta | Arma (espada larga) | Legendario | Sí | — | — | Automático | arma (Espada larga +3): ataque y daño en combate |
| Espada de la venganza | Arma (cimitarra, espada corta, espada larga, espadón, estoque o guja) | Infrecuente | Sí | — | Arma de base: 6 | Automático | arma (Cimitarra +1): ataque y daño en combate |
| Espada hiriente | Arma (cimitarra, espada corta, espada larga, espadón, estoque o guja) | Raro | Sí | — | Arma de base: 6 | Automático | arma (Cimitarra): ataque y daño en combate |
| Espada ladrona de vida | Arma (cimitarra, espada corta, espada larga, espadón, estoque o guja) | Raro | Sí | — | Arma de base: 6 | Automático | arma (Cimitarra): ataque y daño en combate |
| Espada solar | Arma (espada larga) | Raro | Sí | — | — | Automático | arma (Espada larga +2): ataque y daño en combate; daño adicional anotado junto al ataque |
| Espada tocada por la luna | Arma (cimitarra, espada corta, espada larga, espadón, estoque o guja) | Común | — | — | Arma de base: 6 | Automático | arma (Cimitarra): ataque y daño en combate |
| Espada vorpal | Arma (cimitarra, espada larga, espadón o guja) | Legendario | Sí | — | Arma de base: 4 | Automático | arma (Cimitarra +3): ataque y daño en combate |
| Espejo atrapavidas | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Estatuilla de poder maravilloso | Objeto maravilloso | Varía | — | — | Tipo: 9 | Se consulta | Texto en la biblioteca. |
| Ficha de pluma de Quaal | Objeto maravilloso | Varía | — | — | Tipo: 6 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Filo de la fortuna | Arma (cimitarra, espada corta, espada larga, espadón, estoque, guja u hoz) | Legendario | Sí | cargas: 1d3, no se recarga; Deseo: 1, descanso largo; Fortuna: 1, descanso largo | Arma de base: 5 | Automático | arma (Cimitarra +1): ataque y daño en combate; +1 a salvaciones; usos: Deseo [1 c.] |
| Filtro de amor | Poción | Infrecuente | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Flauta de la aparición | Objeto maravilloso | Infrecuente | — | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Flauta de las cloacas | Objeto maravilloso | Infrecuente | Sí | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Fortaleza instantánea de Daern | Objeto maravilloso | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Frasco de hierro | Objeto maravilloso | Legendario | — | — | — | Se consulta | Texto en la biblioteca. |
| Garra silvana | Arma (cimitarra, daga, espada corta, estoque, hoz o lanza) | Común | Sí | Mensaje secreto: 1, descanso largo | Arma de base: 6 | Automático | arma (Cimitarra): ataque y daño en combate |
| Garrote grande atronador | Arma (garrote grande) | Muy raro | Sí | Terremoto: 1, descanso largo | — | Automático | arma (Garrote grande): ataque y daño en combate; Fuerza 20; daño adicional anotado junto al ataque |
| Gema de visión | Objeto maravilloso | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Visión veraz [1 c.] |
| Gema del resplandor | Objeto maravilloso | Infrecuente | — | cargas: 50, no se recarga | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Gema elemental | Objeto maravilloso | Infrecuente | — | — | Gema: 4 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Globo flotante | Objeto maravilloso | Infrecuente | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Gorro de respirar bajo el agua | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Grilletes dimensionales | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Guanteletes de fuerza de ogro | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | Fuerza 19 |
| Guantes atrapaflechas | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Guantes de ladrón | Objeto maravilloso | Infrecuente | — | — | — | Automático | +5 a Juego de manos |
| Guantes de natación y escalada | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | +5 en Atletismo para nadar o trepar |
| Hacha berserker | Arma (alabarda, hacha a dos manos o hacha de guerra) | Raro | Sí | — | Arma de base: 3 | Automático | arma (Alabarda +1): ataque y daño en combate |
| Hacha de los señores enanos | Arma (hacha de guerra) | Artefacto | Sí | Conjurar elemental de tierra: 1, descanso largo | — | Automático | arma (Hacha de batalla +3): ataque y daño en combate; +2 Constitución (máx. 20); resistencia: fuego; inmunidad: veneno; daño adicional anotado junto al ataque |
| Hacha de verdugo | Arma (alabarda, hacha a dos manos, hacha de guerra o hacha de mano) | Muy raro | — | — | Arma de base: 4 | Automático | arma (Alabarda +1): ataque y daño en combate; daño adicional anotado junto al ataque |
| Herraduras de velocidad | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Herraduras del céfiro | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Hierro de escarcha | Arma (cimitarra, espada corta, espada larga, espadón, estoque o guja) | Muy raro | Sí | — | Arma de base: 6 | Automático | arma (Cimitarra): ataque y daño en combate |
| Hoja lunar | Arma (cimitarra, espada corta, espada larga, espadón o estoque) | Legendario | Sí (una criatura a elección del arma; se comprueba) | Hoja lunar: 1, descanso corto o largo | Arma de base: 5 | En parte | arma (Cimitarra +1): ataque y daño en combate; daño adicional anotado junto al ataque. Las runas adicionales se anotan a mano (la primera da +1). |
| Incensario de controlar elementales de aire | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Instrumento de ilusiones | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Instrumento de los bardos | Objeto maravilloso | Varía | Sí (un bardo; se comprueba) | — | Instrumento: 7 | Se consulta | Texto en la biblioteca. |
| Instrumento de transcripción | Objeto maravilloso | Común | — | cargas: 3, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Jabalina del relámpago | Arma (jabalina) | Infrecuente | — | Relámpago: 1, descanso largo | — | Automático | arma (Jabalina): ataque y daño en combate |
| Jarra de sobriedad | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Ladrona de nueve vidas | Arma (cualquiera sencilla o marcial) | Muy raro | Sí | cargas: 1d8+1, no se recarga | Arma de base: 38 | Automático | arma (Bastón +2): ataque y daño en combate |
| Laúd de acometida atronadora | Arma (garrote) | Muy raro | — | — | — | Automático | arma (Garrote): ataque y daño en combate; daño adicional anotado junto al ataque |
| Lengua de fuego | Arma (cualquier arma cuerpo a cuerpo) | Raro | Sí | — | Arma de base: 29 | Automático | arma (Bastón): ataque y daño en combate; daño adicional anotado junto al ataque |
| Libro de conjuros imperecedero | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Libro de la oscuridad vil | Objeto maravilloso | Artefacto | Sí | — | — | Se consulta | El aumento de característica se anota a mano. |
| Libro de las obras elevadas | Objeto maravilloso | Artefacto | Sí | — | — | Se consulta | El aumento de Sabiduría se anota a mano. |
| Linterna de revelación | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Llave misteriosa | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Maceta del despertar | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Malla de ifrit | Armadura (camisa de malla o cota de malla) | Legendario | Sí | — | Armadura de base: 2 | Automático | CA de armadura +3 (Malla de ifrit (camisote de mallas) 16, Des +0); inmunidad: fuego |
| Malla élfica | Armadura (camisa de malla o cota de malla) | Raro | — | — | Armadura de base: 2 | Automático | CA de armadura +1 (Malla élfica (camisote de mallas) 14, Des +0) |
| Manto de la naturaleza | Objeto maravilloso | Infrecuente | Sí (un druida o un explorador; se comprueba) | — | — | Se consulta | Texto en la biblioteca. |
| Manto de resistencia a conjuros | Objeto maravilloso | Raro | Sí | — | — | Automático | ventaja en salvaciones contra conjuros |
| Manual de gólems | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Manual de la salud corporal | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Constitución) permanente (máx. 30) |
| Manual de rapidez de acción | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Destreza) permanente (máx. 30) |
| Manual del ejercicio beneficioso | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Fuerza) permanente (máx. 30) |
| Maravillosos pigmentos de Nolzur | Objeto maravilloso | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Martillo arrojadizo enano | Arma (martillo de guerra) | Muy raro | Sí | — | — | Automático | arma (Martillo de guerra +3): ataque y daño en combate; daño adicional anotado junto al ataque |
| Martillo de rayos | Arma (martillo de guerra o maza a dos manos) | Legendario | Sí | cargas: 5, recupera 1d4+1 al amanecer | Arma de base: 2 | En parte | arma (Martillo de guerra +1): ataque y daño en combate; +4 a la Fuerza del cinturón o los guanteletes (máx. 30). Suma 4 a la Fuerza que dan el cinturón de fuerza de gigante o los guanteletes (hasta 30). |
| Matadragones | Arma (cualquiera sencilla o marcial) | Raro | — | — | Arma de base: 38 | Automático | arma (Bastón +1): ataque y daño en combate |
| Matagigantes | Arma (cualquiera sencilla o marcial) | Raro | — | — | Arma de base: 38 | Automático | arma (Bastón +1): ataque y daño en combate |
| Maza castigadora | Arma (maza) | Raro | — | — | — | Automático | arma (Maza +1): ataque y daño en combate |
| Maza del terror | Arma (maza) | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | arma (Maza): ataque y daño en combate |
| Maza disruptiva | Arma (maza) | Raro | Sí | — | — | Automático | arma (Maza): ataque y daño en combate; daño adicional anotado junto al ataque |
| Medallón de los pensamientos | Objeto maravilloso | Infrecuente | Sí | cargas: 5, recupera 1d4 al amanecer | — | Automático | usos: Detectar pensamientos CD 13 [1 c.] |
| Moneda de rivalidad | Objeto maravilloso | Común | — | cargas: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Morral práctico de Heward | Objeto maravilloso | Raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Munición +1, +2 o +3 | Arma (cualquier munición) | Varía | — | — | Munición: 5, Bonificador: 3 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Munición asesina | Arma (cualquier munición) | Muy raro | — | — | Munición: 5 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Munición poderosa | Arma (cualquier munición) | Común | — | — | Munición: 5 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Muñeca parlante | Objeto maravilloso | Común | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Negrarma | Arma (espadón) | Artefacto | Sí | — | — | Automático | arma (Espadón +3): ataque y daño en combate |
| Ojo de bruja | Objeto maravilloso | Infrecuente | — | cargas: 3, descanso largo | — | Automático | usos: Ver invisibilidad [1 c.], Visión en la oscuridad [1 c.] |
| Ojo de imitación | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Ojo y mano de Vecna | Objeto maravilloso | Artefacto | Sí | cargas: 8, recupera 1d4+4 al amanecer | — | En parte | La Fuerza 20 de la mano y los conjuros del ojo se consultan. |
| Oleaje | Arma (tridente) | Artefacto | Sí | cargas: 3, recupera 1d3 al amanecer; Globo de invulnerabilidad: 1, descanso largo | — | Automático | arma (Tridente +3): ataque y daño en combate; usos: Dominar bestia CD 20 [1 c.] |
| Orbe de la dirección | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Orbe de los dragones | Objeto maravilloso | Artefacto | Sí | cargas: 7, recupera 1d4+3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Orbe del tiempo | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Pegamento soberano | Objeto maravilloso | Legendario | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Perfume embelesador | Objeto maravilloso | Común | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Pergamino de conjuro | Pergamino | Varía | — | — | Nivel del conjuro: 10 | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Pergamino de invocar titán | Pergamino | Legendario | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Pergamino de protección | Pergamino | Raro | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Perla de poder | Objeto maravilloso | Infrecuente | Sí (un lanzador de conjuros; se comprueba) | uso: 1, descanso largo | — | Automático | usos: Recuperar un espacio de conjuro (nivel 3 o inferior) [1/día] |
| Pértiga contraíble | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Pértiga de pescar | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Piedra de controlar elementales de tierra | Objeto maravilloso | Raro | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Piedra de la buena fortuna | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | +1 a salvaciones; +1 a pruebas |
| Piedra ioun | Objeto maravilloso | Varía | Sí | — | Tipo: 14 | En parte | +2 Destreza (máx. 20); ventaja en iniciativa; ventaja en Percepción; +2 Constitución (máx. 20); +2 Fuerza (máx. 20); +2 Inteligencia (máx. 20); +2 Carisma (máx. 20); +2 Sabiduría (máx. 20); +1 CA. Maestría (+1 a la competencia), Regeneración, Reserva, Sustento y Absorción se consultan; las de característica, Protección y Consciencia son automáticas. |
| Piedras mensajeras | Objeto maravilloso | Infrecuente | — | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Pipa de monstruos de humo | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Poción de aliento de fuego | Poción | Infrecuente | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de amistad animal | Poción | Infrecuente | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de clarividencia | Poción | Raro | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de crecimiento | Poción | Infrecuente | — | — | — | Automático | «Beber»: agrandar durante 10 minutos, sin concentración. |
| Poción de curación | Poción | Varía | — | — | Potencia: 4 | Automático | «Beber (2d4+2)»: cura 2d4+2 |
| Poción de encoger | Poción | Raro | — | — | — | Automático | «Beber»: reducir durante 1d4 horas, sin concentración. |
| Poción de entendimiento | Poción | Común | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de forma gaseosa | Poción | Raro | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de fuerza de gigante | Poción | Varía | — | — | Gigante: 6 | Automático | «Beber»: tu Fuerza cambia durante 1 hora. |
| Poción de heroísmo | Poción | Raro | — | — | — | Automático | «Beber»: 10 PG temporales y Bendición durante 1 hora, sin concentración. |
| Poción de invisibilidad | Poción | Raro | — | — | — | Automático | «Beber»: invisible durante 1 hora o hasta que ataques, hagas daño o lances un conjuro. |
| Poción de invisibilidad mejorada | Poción | Muy raro | — | — | — | Automático | «Beber»: invisible durante 1 hora, aunque ataques o lances conjuros. |
| Poción de invulnerabilidad | Poción | Raro | — | — | — | Automático | «Beber»: resistencia a todo el daño durante 1 minuto. |
| Poción de leer mentes | Poción | Raro | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de longevidad | Poción | Muy raro | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de pugilismo | Poción | Infrecuente | — | — | — | Automático | «Beber»: +1d6 de daño de fuerza con los golpes sin armas durante 10 minutos. |
| Poción de resistencia | Poción | Infrecuente | — | — | Tipo de daño: 10 | Automático | «Beber»: resistencia al tipo de daño de la poción durante 1 hora. |
| Poción de respirar bajo el agua | Poción | Infrecuente | — | — | — | En parte | Consumible: «Beber» gasta uno; el efecto se consulta en el texto. |
| Poción de trepar | Poción | Común | — | — | — | Automático | «Beber»: velocidad trepando y ventaja en Atletismo para trepar durante 1 hora. |
| Poción de velocidad | Poción | Muy raro | — | — | — | Automático | «Beber»: acelerar durante 1 minuto, sin concentración ni somnolencia al acabar. |
| Poción de veneno | Poción | Infrecuente | — | — | — | Automático | «Beber»: era veneno: haz una salvación de Constitución CD 13 o quedas envenenado 1 hora. |
| Poción de vitalidad | Poción | Muy raro | — | — | — | Automático | «Beber»: sin cansancio ni veneno; 24 horas recuperando el máximo de cada dado de golpe que gastes. |
| Poción de vuelo | Poción | Muy raro | — | — | — | Automático | «Beber»: velocidad volando igual a tu velocidad durante 1 hora. |
| Polvo de desaparición | Objeto maravilloso | Infrecuente | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Polvo de estornudar y atragantarse | Objeto maravilloso | Infrecuente | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Polvo de sequedad | Objeto maravilloso | Infrecuente | — | — | — | En parte | Consumible: «Usar uno» gasta uno; el efecto se consulta en el texto. |
| Portal cúbico | Objeto maravilloso | Legendario | — | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Desplazamiento entre planos [1 c.], Portal [1 c.] |
| Pozo de los muchos mundos | Objeto maravilloso | Legendario | — | — | — | Se consulta | Texto en la biblioteca. |
| Prótesis de extremidad | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Ropas de remiendo | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Rotundo | Arma (martillo de guerra) | Artefacto | Sí | Onda sísmica: 1, descanso largo | — | Automático | arma (Martillo de guerra +3): ataque y daño en combate; daño adicional anotado junto al ataque |
| Rubí del mago de guerra | Objeto maravilloso | Común | Sí (un lanzador de conjuros; se comprueba) | — | — | Se consulta | Texto en la biblioteca. |
| Silla de monta del caballero | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Sombrero de disfraz | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | usos: Disfrazarse [a voluntad] |
| Sombrero de hechicería | Objeto maravilloso | Común | Sí (un mago; se comprueba) | Conjuro desconocido: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Sombrero de las alimañas | Objeto maravilloso | Común | — | cargas: 3, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Sombrero de múltiples conjuros | Objeto maravilloso | Muy raro | Sí (un mago; se comprueba) | Conjuro desconocido: 1, descanso corto o largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Tablero de espiritismo | Objeto maravilloso | Muy raro | — | cargas: 3, recupera 1d1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Talismán de cerrar heridas | Objeto maravilloso | Infrecuente | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Talismán de la esfera | Objeto maravilloso | Legendario | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Talismán de salud | Objeto maravilloso | Infrecuente | Sí | uso: 1, descanso largo | — | Automático | ventaja en salvaciones contra el estado de envenenado; usos: Recuperar 2d4 + 2 PG [1/día] |
| Talismán del bien puro | Objeto maravilloso | Legendario | Sí (un clérigo o paladín; se comprueba) | cargas: 7, no se recarga | — | En parte | +2 a ataque de conjuro. El +2 al ataque de conjuro es automático; el daño a los malvados al tocarlo, no. |
| Talismán del mal definitivo | Objeto maravilloso | Legendario | Sí | cargas: 6, no se recarga | — | En parte | +2 a ataque de conjuro. El +2 al ataque de conjuro es automático; el daño a los buenos al tocarlo, no. |
| Tomo de entendimiento | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Sabiduría) permanente (máx. 30) |
| Tomo de la lengua detenida | Objeto maravilloso | Legendario | Sí (un mago; se comprueba) | uso: 1, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Tomo de liderazgo e influencia | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Carisma) permanente (máx. 30) |
| Tomo de pensamiento claro | Objeto maravilloso | Muy raro | — | — | — | Automático | Leer (+2 Inteligencia) permanente (máx. 30) |
| Tridente de comandar peces | Arma (tridente) | Infrecuente | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | arma (Tridente): ataque y daño en combate; usos: Dominar bestia CD 15 [1 c.] |
| Trompetilla de escucha | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Túnica de colores hipnóticos | Objeto maravilloso | Muy raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Túnica de las estrellas | Objeto maravilloso | Muy raro | Sí | — | — | Automático | +1 a salvaciones |
| Túnica de los ojos | Objeto maravilloso | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Túnica de objetos útiles | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Túnica del archimago | Objeto maravilloso | Legendario | Sí (un brujo, hechicero o mago; se comprueba) | — | — | Automático | CA 15 + Des sin armadura; +2 a CD y ataque de conjuro; ventaja en salvaciones contra conjuros y otros efectos mágicos |
| Ungüento de Keoghtom | Objeto maravilloso | Infrecuente | — | — | — | Automático | «Aplicar (2d8+2)»: cura 2d8+2; Dejas de estar envenenado. |
| Útil bolsita de especias de Heward | Objeto maravilloso | Común | — | cargas: 10, recupera 1d6+4 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Vara de la absorción | Vara | Muy raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Vara de la alerta | Vara | Muy raro | Sí | uso: 1, descanso largo | — | Automático | ventaja en iniciativa; ventaja en Percepción |
| Vara de la resurrección | Vara | Legendario | Sí | cargas: 5, recupera 1d1 al amanecer | — | Automático | usos: Curar [1 c.], Resurrección [5 c.] |
| Vara de la seguridad | Vara | Muy raro | — | — | — | Se consulta | Texto en la biblioteca. |
| Vara de tentáculos | Vara | Raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Vara del pacto | Vara | Varía | Sí (un brujo; se comprueba) | Vara del pacto: 1, descanso largo | Bonificador: 3 | En parte | +1 a CD y ataque de conjuro; +2 a CD y ataque de conjuro; +3 a CD y ataque de conjuro; usos: Recuperar un espacio de conjuro [1/descanso largo]. Suma a la CD y al ataque de todos tus conjuros (la Guía lo limita a los de brujo). |
| Vara inamovible | Vara | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Varita de atadura | Varita | Raro | Sí | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Inmovilizar monstruo CD 17 [5 c.], Inmovilizar persona CD 17 [2 c.] |
| Varita de bolas de fuego | Varita | Raro | Sí (un lanzador de conjuros; se comprueba) | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Bola de fuego CD 15 [1–3 cargas] |
| Varita de detección mágica | Varita | Infrecuente | — | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Detectar magia [1 c.] |
| Varita de detectar enemigos | Varita | Raro | Sí | cargas: 7, recupera 1d6+1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de dirección | Varita | Común | — | cargas: 3, descanso largo | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de las maravillas | Varita | Raro | Sí | cargas: 7, recupera 1d6+1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de Orcus | Varita | Artefacto | Sí | cargas: 7, recupera 1d4+3 al amanecer; Llamar a los muertos vivientes: 1, descanso largo | — | Automático | arma (Maza +3): ataque y daño en combate; +3 CA |
| Varita de parálisis | Varita | Raro | Sí (un lanzador de conjuros; se comprueba) | cargas: 7, recupera 1d6+1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de pirotecnia | Varita | Común | — | cargas: 7, recupera 1d6+1 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de polimorfar | Varita | Muy raro | Sí (un lanzador de conjuros; se comprueba) | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Polimorfar CD 15 [1 c.] |
| Varita de proyectiles mágicos | Varita | Infrecuente | — | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Proyectil mágico [1–3 cargas] |
| Varita de relámpagos | Varita | Raro | Sí (un lanzador de conjuros; se comprueba) | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Relámpago CD 15 [1–3 cargas] |
| Varita de secretos | Varita | Infrecuente | — | cargas: 3, recupera 1d3 al amanecer | — | En parte | Contadores en la hoja; el efecto se consulta en el texto. |
| Varita de telaraña | Varita | Infrecuente | Sí (un lanzador de conjuros; se comprueba) | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Telaraña CD 13 [1 c.] |
| Varita del mago de guerra +1, +2 o +3 | Varita | Varía | Sí (un lanzador de conjuros; se comprueba) | — | Bonificador: 3 | Automático | +1 a ataque de conjuro; +2 a ataque de conjuro; +3 a ataque de conjuro |
| Varita del terror | Varita | Raro | Sí | cargas: 7, recupera 1d6+1 al amanecer | — | Automático | usos: Orden imperiosa CD 15 [1 c.], Terror CD 15 [3 c.] |
| Vasija alquímica | Objeto maravilloso | Infrecuente | — | — | — | Se consulta | Texto en la biblioteca. |
| Vela de invocación | Objeto maravilloso | Muy raro | Sí | — | — | Se consulta | Texto en la biblioteca. |
| Vela de la profundidad | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
| Vendas de poder sin armas | Objeto maravilloso | Varía | — | — | Bonificador: 3 | Automático | +1 al ataque y daño sin armas; +2 al ataque y daño sin armas; +3 al ataque y daño sin armas |
| Vengadora sagrada | Arma (cualquiera sencilla o marcial) | Legendario | Sí (un paladín; se comprueba) | — | Arma de base: 38 | Automático | arma (Bastón +3): ataque y daño en combate; daño adicional anotado junto al ataque |
| Yelmo de entender idiomas | Objeto maravilloso | Infrecuente | — | — | — | Automático | usos: Entender idiomas [a voluntad] |
| Yelmo de fulgor | Objeto maravilloso | Muy raro | Sí | — | — | Automático | resistencia: fuego |
| Yelmo de telepatía | Objeto maravilloso | Infrecuente | Sí | — | — | Automático | usos: Detectar pensamientos CD 13 [1/día], Sugestión CD 13 [1/día] |
| Yelmo de teletransporte | Objeto maravilloso | Raro | Sí | cargas: 3, recupera 1d3 al amanecer | — | Automático | usos: Teletransporte [1 c.] |
| Yelmo temible | Objeto maravilloso | Común | — | — | — | Se consulta | Texto en la biblioteca. |
