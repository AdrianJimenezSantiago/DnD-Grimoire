# Auditoría de clases y subclases (reglas de 2024)

Generado por `tools/auditoria-clases.mjs`. Cada rasgo, nivel a nivel, con lo que hace la app:
**Automático** (la app lo aplica, gasta o recupera sola), **En parte** (la app lleva el contador o el número y tú decides cuándo) y
**Se consulta** (rasgos narrativos o de decisión en mesa: su texto sale en «En juego» si importas el manual).

Las pruebas `tests/auditoria-*.test.js` recorren todas las clases y subclases de nivel 1 a 20 y todas las multiclases de dos clases.

Recuento: 345 automáticos, 11 en parte y 185 de consulta.

## Bárbaro

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Defensa sin armadura | Automático | CA 10 + Des + Con (bárbaro, con escudo) o + Sab (monje, sin escudo). |
| 1 | Furia | Automático | Usos por nivel (1 en descanso corto); al gastarla pone el efecto (ventaja Fue, daño por furia en ataques de Fuerza), rompe la concentración y avisa si llevas armadura pesada. |
| 1 | Maestría con armas | Automático | Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…). |
| 2 | Ataque temerario | Automático | Se activa en «En juego»: ventaja en ataques de Fuerza este turno. |
| 2 | Sentir el peligro | Automático | Ventaja en salvaciones de Destreza salvo incapacitado. |
| 3 | Conocimiento primigenio | Automático | Pide una habilidad más de la lista del bárbaro. |
| 3 | Subclase de bárbaro | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Ataque adicional | Automático | Ataques por acción en combate. |
| 5 | Movimiento rápido | Automático | +3 m sin armadura pesada. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Instinto salvaje | Automático | Ventaja en iniciativa. |
| 7 | Salto instintivo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Golpe brutal | En parte | Número del dado (1d10, 2d10 a nivel 17). |
| 10 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 11 | Furia implacable | En parte | Muestra la CD de partida (10, +5 por uso). |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Golpe brutal mejorado | En parte | Número del dado. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 15 | Furia persistente | Automático | Al tirar iniciativa recuperas todas las Furias (1 vez por descanso largo). |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Golpe brutal mejorado | En parte | Número del dado. |
| 18 | Poderío indómito | Automático | En pruebas y salvaciones de Fuerza el total no baja de tu Fuerza. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Campeón primordial | Automático | +4 Fue y Con (máx. 25) al subir a nivel 20. |

### Senda del Árbol del Mundo (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Vitalidad del árbol | Automático | Al entrar en furia ganas PG temporales iguales a tu nivel. |
| 6 | Ramas del árbol | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Raíces apaleadoras | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Viajar por el árbol | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Senda del berserker (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Frenesí | Automático | Al impactar en furia: +Nd6 (N = daño por furia) una vez por turno. |
| 6 | Furia irracional | Automático | Inmune a asustado y hechizado mientras dure la furia. |
| 10 | Represalia | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Presencia intimidante | Automático | Contador; se recupera gastando una Furia. |

### Senda del corazón salvaje (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Portavoz de los animales | Automático | Conjuros como rituales, siempre preparados. |
| 3 | Furia de lo salvaje | Automático | Opción (Oso, Águila, Lobo) que se marca cada vez que te enfureces. |
| 6 | Aspecto de lo salvaje | Automático | Opción (Búho, Pantera, Salmón); se avisa en el descanso largo. |
| 10 | Hablante de la naturaleza | Automático | Comunión con la naturaleza como ritual. |
| 14 | Poder de lo salvaje | Automático | Opción (Halcón, León, Carnero) al enfurecerte. |

Conjuros siempre preparados: nivel 3: Hablar con los animales, Sentidos de la bestia; nivel 10: Comunión con la naturaleza.

### Senda del fanático (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Furia divina | Automático | Al impactar en furia: +1d6 + mitad del nivel, una vez por turno. |
| 3 | Guerrero de los dioses | Automático | Reserva de d12 (4 a 7); cada dado gastado se tira y te cura. |
| 6 | Foco fanático | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Presencia ferviente | Automático | Contador; se recupera gastando una Furia. |
| 14 | Furia de los dioses | Automático | Contador de 1 uso por descanso largo. |

## Bardo

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Inspiración bárdica | Automático | Usos = Car; dado d6→d12; descanso corto desde nivel 5; se recupera gastando un espacio (Fuente de inspiración). |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 2 | Aprendiz de mucho | Automático | Mitad de competencia a pruebas de habilidad sin competencia (no a la iniciativa, regla de 2024). |
| 2 | Pericia | Automático | Cupo de pericias por clase y nivel. |
| 3 | Subclase de bardo | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Fuente de inspiración | Automático | Recarga en descanso corto y canje por espacio. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Contraencantamiento | Se consulta | Reacción. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Pericia | Automático | Cupo de pericias por clase y nivel. |
| 10 | Secretos mágicos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 18 | Inspiración superior | Automático | Al tirar iniciativa recuperas hasta tener 2. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Palabras de creación | Automático | Palabra de poder: sanar y matar siempre preparadas. |

### Colegio de la danza (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Juego de pies deslumbrante | Automático | CA 10 + Des + Car y Daño bárdico (dado de inspiración + Des) sin armadura ni escudo. |
| 6 | Juego de pies conjunto | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Movimiento inspirador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Evasión dirigida | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Colegio del conocimiento (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Competencias adicionales | Automático | Pide 3 habilidades. |
| 3 | Palabras cortantes | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Descubrimientos mágicos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Habilidad sin parangón | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Colegio del glamour (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Magia cautivadora | Automático | Contador; canje por Inspiración bárdica. |
| 3 | Manto de inspiración | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Manto de majestad | Automático | Contador; canje por espacio de nivel 3+. |
| 14 | Majestad inquebrantable | Automático | Contador (descanso corto). |

Conjuros siempre preparados: nivel 3: Hechizar persona, Imagen múltiple; nivel 6: Orden imperiosa.

### Colegio del valor (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Entrenamiento marcial | Automático | Armadura media, escudo y armas marciales. |
| 3 | Inspiración en combate | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Ataque adicional | Automático | Ataques por acción en combate. |
| 14 | Magia de batalla | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Colegio de la luna (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conocimientos primigenios | Automático | Pide una habilidad; truco de druida. |
| 3 | Inspiración lunar | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Bendición de la luz lunar | Automático | Contador. |
| 14 | Esplendor del ocaso | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 6: Rayo de luna.

## Brujo

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Invocaciones sobrenaturales | En parte | Número de invocaciones por nivel; se eligen como dotes/notas. |
| 1 | Magia del pacto | Automático | Espacios de pacto; vuelven en el descanso corto. |
| 2 | Astucia mágica | Automático | Al gastarla recupera la mitad de los espacios de pacto (todos a nivel 20). |
| 3 | Subclase de brujo | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Contactar patrón | Automático | Contactar con otro plano siempre preparado y gratis 1/día. |
| 10 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 11 | Arcanum místico (nivel 6) | Automático | Uso gratis diario. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Arcanum místico (nivel 7) | Automático | Uso gratis diario. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 15 | Arcanum místico (nivel 8) | Automático | Uso gratis diario. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Arcanum místico (nivel 9) | Automático | Uso gratis diario. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Maestro sobrenatural | Automático | Astucia mágica recupera todos los espacios. |

### Patrón celestial (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del celestial | Automático | Conjuros siempre preparados por nivel. |
| 3 | Luz sanadora | Automático | Reserva de d6; botón «Curarme». |
| 6 | Alma radiante | Automático | Carisma a una tirada de daño radiante o de fuego. |
| 10 | Resiliencia celestial | Automático | PG temporales al terminar descansos y al usar Astucia mágica. |
| 14 | Venganza ardiente | Automático | Contador. |

Conjuros siempre preparados: nivel 3: Auxilio, Curar heridas, Llama sagrada, Luz, Restablecimiento menor, Saeta guía; nivel 5: Luz del día, Revivir; nivel 7: Guardián de la fe, Muro de fuego; nivel 9: Invocar celestial, Restablecimiento mayor.

### Patrón feérico (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del señor feérico | Automático | Conjuros siempre preparados por nivel. |
| 3 | Pasos feéricos | Automático | Paso brumoso gratis (Car usos). |
| 6 | Escape brumoso | En parte | Usa los Pasos feéricos. |
| 10 | Defensas seductoras | Automático | Inmune a hechizado; contador con canje por espacio de pacto. |
| 14 | Magia embrujadora | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Calmar emociones, Dormir, Fuego feérico, Fuerza fantasmal, Paso brumoso; nivel 5: Crecimiento vegetal, Desplazamiento; nivel 7: Dominar bestia, Invisibilidad mejorada; nivel 9: Apariencia, Dominar persona.

### Patrón infernal (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Bendición del Oscuro | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Conjuros del infernal | Automático | Conjuros siempre preparados por nivel. |
| 6 | La suerte del Oscuro | Automático | Contador (Car usos). |
| 10 | Resistencia infernal | Automático | Opción de tipo de daño; se cambia en cada descanso. |
| 14 | Arrastrar por el infierno | Automático | Contador con canje por espacio de pacto. |

Conjuros siempre preparados: nivel 3: Manos ardientes, Orden imperiosa, Rayo abrasador, Sugestión; nivel 5: Bola de fuego, Nube apestosa; nivel 7: Escudo de fuego, Muro de fuego; nivel 9: Geas, Plaga de insectos.

### Patrón primigenio (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del primigenio | Automático | Conjuros siempre preparados por nivel. |
| 3 | Conjuros psíquicos | Automático | Conjuros siempre preparados por nivel. |
| 3 | Mente iluminada | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Combatiente clarividente | Automático | Contador (descanso corto) con canje por espacio de pacto. |
| 10 | Escudo mental | Automático | Resistencia psíquica. |
| 10 | Maleficio sobrenatural | Automático | Maleficio siempre preparado; +1d6 al impactar. |
| 14 | Crear siervo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Detectar pensamientos, Fuerza fantasmal, Risa horrible de Tasha, Susurros discordantes; nivel 5: Clarividencia, Hambre de Hadar; nivel 7: Confusión, Invocar aberración; nivel 9: Alterar los recuerdos, Telequinesis; nivel 10: Maleficio.

## Clérigo

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 1 | Orden divina | Automático | Protector (armas marciales, armadura pesada) o Taumaturgo (truco + Sab a Arcanos/Religión). |
| 2 | Canalizar divinidad | Automático | Contador (recupera 1 en descanso corto, todos en largo). |
| 3 | Subclase de clérigo | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Abrasar muertos vivientes | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Golpes benditos | Automático | Variante: Golpe divino al impactar o Lanzamiento potente en trucos. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 10 | Intercesión divina | Automático | Contador diario. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Golpes benditos mejorados | Automático | 2d8 o PG temporales. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Intercesión divina mayor | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Dominio de la guerra (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del dominio de la guerra | Automático | Conjuros siempre preparados por nivel. |
| 3 | Golpe guiado | Automático | Al fallar un ataque, +10 gastando Canalizar divinidad. |
| 3 | Sacerdote guerrero | Automático | Contador (Sab, descanso corto). |
| 6 | Bendición del dios de la guerra | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Avatar de la batalla | Automático | Resistencia contundente, cortante y perforante. |

Conjuros siempre preparados: nivel 3: Arma espiritual, Arma mágica, Escudo de fe, Saeta guía; nivel 5: Espíritus guardianes, Manto del cruzado; nivel 7: Escudo de fuego, Libertad de movimiento; nivel 9: Golpe de viento acerado, Inmovilizar monstruo.

### Dominio de la luz (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del dominio de la luz | Automático | Conjuros siempre preparados por nivel. |
| 3 | Fulgor protector | Automático | Contador (Sab; descanso corto desde nivel 6). |
| 3 | Resplandor del amanecer | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Fulgor protector mejorado | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Halo de luz | Automático | Contador (Sab). |

Conjuros siempre preparados: nivel 3: Fuego feérico, Manos ardientes, Rayo abrasador, Ver invisibilidad; nivel 5: Bola de fuego, Luz del día; nivel 7: Muro de fuego, Ojo arcano; nivel 9: Escudriñar, Golpe flamígero.

### Dominio de la vida (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del dominio de la vida | Automático | Conjuros siempre preparados por nivel. |
| 3 | Discípulo de la vida | Automático | +2 + nivel del espacio a la curación de tus conjuros. |
| 3 | Preservar vida | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Sanador bendito | Automático | Tras curar a otro con un conjuro, botón para recuperar 2 + nivel del espacio. |
| 17 | Sanación suprema | Automático | Los dados de curación de tus conjuros dan su máximo. |

Conjuros siempre preparados: nivel 3: Auxilio, Bendición, Curar heridas, Restablecimiento menor; nivel 5: Palabra de curación en masa, Revivir; nivel 7: Aura de vida, Guarda contra la muerte; nivel 9: Curar heridas en masa, Restablecimiento mayor.

### Dominio del engaño (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Bendición del embaucador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Conjuros del dominio del engaño | Automático | Conjuros siempre preparados por nivel. |
| 3 | Invocar duplicidad | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Transposición del embaucador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Duplicidad mejorada | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Disfrazarse, Hechizar persona, Invisibilidad, Pasar sin rastro; nivel 5: Indetectable, Patrón hipnótico; nivel 7: Confusión, Puerta dimensional; nivel 9: Alterar los recuerdos, Dominar persona.

### Dominio del conocimiento (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Bendiciones del conocimiento | Automático | Pide 2 habilidades con pericia. |
| 3 | Conjuros del dominio del conocimiento | Automático | Conjuros siempre preparados por nivel. |
| 3 | Magia mental | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Mente ilimitada | Automático | Competencia en salvaciones de Inteligencia. |
| 17 | Precognición divina | Automático | Contador; canje por espacio de nivel 6+. |

Conjuros siempre preparados: nivel 3: Clavo mental, Detectar magia, Detectar pensamientos, Entender idiomas, Identificar, Orden imperiosa; nivel 5: Disipar magia, Don de lenguas, Indetectable; nivel 7: Confusión, Destierro, Ojo arcano; nivel 9: Conocer las leyendas, Escudriñar, Estática sináptica.

## Druida

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Druídico | Automático | Hablar con los animales siempre preparado. |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 1 | Orden primigenia | Automático | Guardián o Naturalista. |
| 2 | Compañero salvaje | Automático | Encontrar familiar gasta un uso de Forma salvaje. |
| 2 | Forma salvaje | Automático | Usos (1 en descanso corto); al transformarte ganas PG temporales = nivel (×3 en la luna) y te dice la duración. |
| 3 | Subclase de druida | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Resurgimiento salvaje | Automático | Contador y canje de espacio por Forma salvaje si no te quedan. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Furia elemental | Automático | Variante: Golpe primigenio o Lanzamiento potente. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 10 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 15 | Furia elemental mejorada | Automático | 2d8 o alcance. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 18 | Conjurar como bestia | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Archidruida | Automático | Recupera Forma salvaje al tirar iniciativa si no te quedan; mago de la naturaleza como contador. |

### Círculo de la luna (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del círculo de la luna | Automático | Conjuros siempre preparados por nivel. |
| 3 | Formas del círculo | Automático | PG temporales ×3 y CA mínima al transformarte. |
| 6 | Formas del círculo mejoradas | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Paso de la luz lunar | Automático | Contador (Sab) con canje por espacio de nivel 2+. |
| 14 | Forma lunar | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Curar heridas, Rayo de luna, Voluta estelar; nivel 5: Conjurar animales; nivel 7: Fuente de luz lunar; nivel 9: Curar heridas en masa.

### Círculo de la tierra (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del círculo de la tierra | Automático | Opción de terreno (Árido, Polar, Templado, Tropical): cambia los conjuros siempre preparados; se avisa en el descanso largo. |
| 3 | Ayuda de la tierra | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Recuperación natural | Automático | Recuperar espacios al terminar un descanso corto. |
| 10 | Protección de la naturaleza | Automático | Inmune a envenenado. |
| 14 | Santuario de la naturaleza | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Contorno borroso, Descarga de fuego, Manos ardientes; nivel 5: Bola de fuego; nivel 7: Marchitar; nivel 9: Muro de piedra.

Terrenos: Árido (Contorno borroso, Descarga de fuego, Manos ardientes, Bola de fuego, Marchitar, Muro de piedra); Polar (Inmovilizar persona, Nube de oscurecimiento, Rayo de escarcha, Tormenta de aguanieve, Tormenta de hielo, Cono de frío); Templado (Agarre electrizante, Dormir, Paso brumoso, Relámpago, Libertad de movimiento, Paso arbóreo); Tropical (Rayo nauseabundo, Salpicadura ácida, Telaraña, Nube apestosa, Polimorfar, Plaga de insectos).

### Círculo de las estrellas (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Forma estelar | Automático | Opción (Arquero, Cáliz, Dragón) al transformarte. |
| 3 | Mapa estelar | Automático | Saeta guía gratis (Sab usos). |
| 6 | Presagio cósmico | Automático | Contador. |
| 10 | Constelaciones centelleantes | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Colmado de luz estelar | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Guía, Saeta guía.

### Círculo del mar (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del círculo del mar | Automático | Conjuros siempre preparados por nivel. |
| 3 | Ira de los mares | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Afinidad acuática | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Nacido de la tempestad | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Obsequio oceánico | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Hacer añicos, Nube de oscurecimiento, Ola atronadora, Ráfaga de viento, Rayo de escarcha; nivel 5: Relámpago, Respirar bajo el agua; nivel 7: Controlar agua, Tormenta de hielo; nivel 9: Conjurar elemental, Inmovilizar monstruo.

## Explorador

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Enemigo predilecto | Automático | Marca del cazador siempre preparada y gratis (2 a 6 usos). |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 1 | Maestría con armas | Automático | Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…). |
| 2 | Estilo de combate | Automático | Se elige como dote; Defensa, Tiro con arco y Duelo suman solos; los demás salen en el ataque. |
| 2 | Explorador hábil | Automático | Pericia en una habilidad. |
| 3 | Subclase de explorador | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Ataque adicional | Automático | Ataques por acción en combate. |
| 6 | Errante | Automático | +3 m sin armadura pesada. |
| 7 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Pericia | Automático | Cupo de pericias por clase y nivel. |
| 10 | Infatigable | Automático | PG temporales 1d8 + Sab al gastarlo; baja el agotamiento en el descanso corto. |
| 11 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Cazador persistente | Automático | El daño no rompe la concentración en Marca del cazador. |
| 14 | Velo de la naturaleza | Automático | Contador (Sab). |
| 15 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Cazador preciso | Automático | Ventaja contra la criatura marcada mientras mantienes Marca del cazador. |
| 18 | Sentidos salvajes | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Azote de enemigos | Automático | Marca del cazador hace 1d10. |

### Acechador en la penumbra (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros de acechador en la penumbra | Automático | Conjuros siempre preparados por nivel. |
| 3 | Emboscador pavoroso | Automático | Sabiduría a la iniciativa; Golpe pavoroso +2d6 al impactar (Sab usos). |
| 3 | Visión en la umbra | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Mente de hierro | Automático | Competencia en salvaciones de Sabiduría. |
| 11 | Oleada del acechador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Esquiva de las sombras | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Disfrazarse; nivel 5: Truco de la cuerda; nivel 9: Terror; nivel 13: Invisibilidad mejorada; nivel 17: Apariencia.

### Cazador (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | El cazador y la presa | Automático | Opción Azote de colosos (+1d8 al impactar) o Destructor de hordas; se cambia en cada descanso. |
| 3 | Sabiduría del cazador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Tácticas defensivas | Automático | Opción; se cambia en cada descanso. |
| 11 | El cazador experto y la presa | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Defensa de cazador experto | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Errante feérico (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros de errante feérico | Automático | Conjuros siempre preparados por nivel. |
| 3 | Glamur sobrenatural | Automático | Sabiduría a las pruebas de Carisma y una habilidad. |
| 3 | Golpes pavorosos | Automático | +1d4 psíquico al impactar (1d6 a nivel 11). |
| 7 | Giro seductor | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Refuerzos feéricos | Automático | Invocar feérico gratis 1/día. |
| 15 | Errante brumoso | Automático | Paso brumoso gratis (Sab usos). |

Conjuros siempre preparados: nivel 3: Hechizar persona; nivel 5: Paso brumoso; nivel 9: Invocar feérico; nivel 13: Puerta dimensional; nivel 17: Engañar.

### Señor de las bestias (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Compañero primigenio | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Entrenamiento excepcional | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Furia bestial | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Compartir conjuros | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Caminante invernal (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros de caminante invernal | Automático | Conjuros siempre preparados por nivel. |
| 3 | Escarcha del cazador | Automático | Al lanzar Marca del cazador ganas 1d10 + nivel PG temporales. |
| 3 | Explorador gélido | Automático | Golpes polares al impactar y resistencia al frío. |
| 7 | Alma fortalecedora | Automático | Contador. |
| 11 | Represalia escalofriante | Automático | Contador. |
| 15 | Espectro congelado | Automático | Contador con canje por espacio de nivel 4+. |

Conjuros siempre preparados: nivel 3: Cuchillo de hielo; nivel 5: Inmovilizar persona; nivel 9: Levantar maldición; nivel 13: Tormenta de hielo; nivel 17: Cono de frío.

## Guerrero

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Estilo de combate | Automático | Se elige como dote; Defensa, Tiro con arco y Duelo suman solos; los demás salen en el ataque. |
| 1 | Maestría con armas | Automático | Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…). |
| 1 | Tomar aliento | Automático | Usos por nivel; al gastarlo se tira 1d10 + nivel y te cura. |
| 2 | Acción súbita (un uso) | Automático | En combate te devuelve la acción. |
| 2 | Mente táctica | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Subclase de guerrero | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Ataque adicional | Automático | Ataques por acción en combate. |
| 5 | Desplazamiento táctico | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 7 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Indómito | Automático | Contador; muestra el bono (+nivel). |
| 9 | Maestro táctico | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 11 | Dos ataques adicionales | Automático | 3 ataques por acción. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Ataques estudiados | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Indómito (dos usos) | Automático | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 15 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Acción súbita (dos usos) | Automático | 2 usos. |
| 17 | Indómito (tres usos) | Automático | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Tres ataques adicionales | Automático | 4 ataques por acción. |

### Caballero arcano (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 3 | Vínculo de guerra | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Magia de guerra | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Golpe sobrenatural | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Carga arcana | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Magia de guerra mejorada | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Campeón (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Atleta sobresaliente | Automático | Ventaja en iniciativa y Atletismo. |
| 3 | Crítico mejorado | Automático | Crítico con 19-20 en tus ataques. |
| 7 | Estilo de combate adicional | Automático | Pide un segundo estilo. |
| 10 | Guerrero heroico | Automático | Al empezar tu turno ganas inspiración heroica si no la tienes. |
| 15 | Crítico superior | Automático | Crítico con 18-20. |
| 18 | Superviviente | Automático | Ventaja en salvaciones contra muerte y +5 + Con al empezar el turno si estás maltrecho. |

### Guerrero psiónico (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Poder psiónico | Automático | Dados de energía (1 en descanso corto); Golpe psiónico al impactar. |
| 7 | Adepto telequinético | Automático | Contador con canje por dado. |
| 10 | Mente robusta | Automático | Resistencia psíquica. |
| 15 | Bastión de fuerza | Automático | Contador con canje por dado. |
| 18 | Maestro telequinético | Automático | Telequinesis siempre preparada y gratis 1/día, con Inteligencia. |

Conjuros siempre preparados: nivel 18: Telequinesis.

### Maestro del combate (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Estudioso de la guerra | Automático | Pide una habilidad. |
| 3 | Supremacía en combate | Automático | Dados de supremacía, maniobras al impactar y Ataque de precisión al fallar. |
| 7 | Conoce a tu enemigo | Automático | Contador con canje por dado de supremacía. |
| 10 | Supremacía en combate mejorada | Automático | d10. |
| 15 | Incansable | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Supremacía en combate definitiva | Automático | d12. |

### Abanderado (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Caballero emisario | Automático | Comprender idiomas y una habilidad. |
| 3 | Recuperación grupal | Automático | Contador. |
| 7 | Tácticas de equipo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Arenga súbita | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Resistencia compartida | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Comandante inspirador | Automático | Inmune a asustado y hechizado. |

Conjuros siempre preparados: nivel 3: Entender idiomas.

## Hechicero

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Hechicería innata | Automático | 2 usos; al gastarla: +1 a la CD de hechicero y ventaja en ataques de conjuro durante 1 minuto. |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 2 | Fuente de magia | Automático | Puntos de hechicería; convertir espacio ↔ puntos desde «En juego». |
| 2 | Metamagia | En parte | Número de opciones. |
| 3 | Subclase de hechicero | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Recuperación mágica | Automático | Al gastarla recuperas hasta la mitad de tu nivel en puntos. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Encarnación mágica | Automático | Hechicería innata se recupera con 2 puntos si no te quedan usos. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 10 | Metamagia | En parte | Número de opciones. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Metamagia | En parte | Número de opciones. |
| 18 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Apoteosis arcana | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Hechicería aberrante (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros psiónicos | Automático | Conjuros siempre preparados por nivel. |
| 3 | Habla telepática | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Defensas psíquicas | Automático | Resistencia psíquica y ventaja contra asustado o hechizado. |
| 6 | Hechicería psiónica | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Revelación en carne | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Implosión deformadora | Automático | Contador con canje por 5 puntos. |

Conjuros siempre preparados: nivel 3: Brazos de Hadar, Calmar emociones, Detectar pensamientos, Fragmento mental, Susurros discordantes; nivel 5: Hambre de Hadar, Recado; nivel 7: Invocar aberración, Tentáculos negros de Evard; nivel 9: Enlace telepático de Rary, Telequinesis.

### Hechicería de magia salvaje (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Mareas del caos | Automático | Contador; se restablece al lanzar un conjuro de hechicero con espacio y te avisa de la sobrecarga. |
| 3 | Sobrecarga de magia salvaje | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Doblegar la suerte | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Caos controlado | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Sobrecarga domada | Automático | Contador. |

### Hechicería dracónica (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros dracónicos | Automático | Conjuros siempre preparados por nivel. |
| 3 | Resistencia dracónica | Automático | PG +1 por nivel y CA 10 + Des + Car. |
| 6 | Afinidad elemental | Automático | Opción de tipo; Carisma a una tirada de daño de ese tipo. |
| 14 | Alas de dragón | Automático | Contador con canje por 3 puntos. |
| 18 | Compañero dragón | Automático | Invocar dragón gratis 1/día. |

Conjuros siempre preparados: nivel 3: Aliento de dragón, Alterar el propio aspecto, Orbe cromático, Orden imperiosa; nivel 5: Terror, Volar; nivel 7: Hechizar monstruo, Ojo arcano; nivel 9: Conocer las leyendas, Invocar dragón.

### Hechicería mecánica (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros mecánicos | Automático | Conjuros siempre preparados por nivel. |
| 3 | Restablecer equilibrio | Automático | Contador (Car). |
| 6 | Bastión de la ley | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Trance de orden | Automático | Contador con canje por 5 puntos. |
| 18 | Cabalgata mecánica | Automático | Contador con canje por 7 puntos. |

Conjuros siempre preparados: nivel 3: Alarma, Auxilio, Protección contra el bien y el mal, Restablecimiento menor; nivel 5: Disipar magia, Protección contra energía; nivel 7: Invocar autómata, Libertad de movimiento; nivel 9: Muro de fuerza, Restablecimiento mayor.

### Hechicería del fuego mágico (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del fuego mágico | Automático | Conjuros siempre preparados por nivel. |
| 3 | Ráfaga de fuego mágico | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Absorber conjuros | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Fuego mágico perfeccionado | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 18 | Corona de fuego mágico | Automático | Contador con canje por 5 puntos. |

Conjuros siempre preparados: nivel 3: Curar heridas, Rayo abrasador, Restablecimiento menor, Saeta guía; nivel 5: Aura de vitalidad, Disipar magia; nivel 6: Contrahechizo; nivel 7: Escudo de fuego, Muro de fuego; nivel 9: Golpe flamígero, Restablecimiento mayor.

## Mago

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Adepto en rituales | Automático | Rituales del libro sin prepararlos. |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 1 | Recuperación arcana | Automático | Recuperar espacios tras el descanso corto (mitad del nivel, hasta nivel 5). |
| 2 | Académico | Automático | Pericia en una habilidad. |
| 3 | Subclase de mago | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Memorizar conjuro | Automático | Aviso en el descanso corto. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 10 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 18 | Maestría sobre conjuros | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Conjuros característicos | Automático | Contador (descanso corto). |

### Abjurador (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Experto en abjuración | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Salvaguarda arcana | Automático | Reserva de PG; se recarga sola al lanzar abjuración con espacio o gastando un espacio; absorbe daño con un botón al recibirlo. |
| 6 | Salvaguarda proyectada | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Rompeconjuros | Automático | Contrahechizo y Disipar magia siempre preparados. |
| 14 | Resistencia a conjuros | Automático | Ventaja en salvaciones contra conjuros. |

Conjuros siempre preparados: nivel 10: Contrahechizo, Disipar magia.

### Adivino (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Experto en adivinación | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Presagio | Automático | Dados d20 anotados tras el descanso largo. |
| 6 | Adivino avezado | Automático | Al lanzar adivinación de nivel 2+ ofrece recuperar un espacio. |
| 10 | El tercer ojo | Automático | Contador (descanso corto). |
| 14 | Presagio mayor | Automático | 3 dados. |

### Evocador (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Experto en evocación | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Truco potente | Automático | Tus trucos de salvación hacen la mitad de daño a quien la supere. |
| 6 | Esculpir conjuros | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Evocación potenciada | Automático | Inteligencia a una tirada de daño de evocación. |
| 14 | Sobrecanalizar | Automático | Contador. |

### Ilusionista (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Experto en ilusionismo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Ilusiones mejoradas | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Criaturas fantasmales | Automático | Invocar bestia/feérico siempre preparados y gratis. |
| 10 | Yo ilusorio | Automático | Contador con canje por espacio de nivel 2+. |
| 14 | Realidad ilusoria | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Ilusión menor; nivel 6: Invocar bestia, Invocar feérico.

### Hojacantante (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Canción de la hoja | Automático | Contador; al gastarla: +Int a CA, +3 m, ataques con Int y + Int a la concentración. |
| 3 | Entrenarse en la guerra y la canción | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Ataque adicional | Automático | Ataques por acción en combate. |
| 10 | Canción de defensa | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Canción de la victoria | Se consulta | Tras lanzar un conjuro de acción, un ataque como acción adicional. |

## Monje

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Artes marciales | Automático | Dado de artes marciales en golpes y armas de monje, con Des. |
| 1 | Defensa sin armadura | Automático | CA 10 + Des + Con (bárbaro, con escudo) o + Sab (monje, sin escudo). |
| 2 | Concentración de monje | Automático | Puntos (descanso corto) y su CD. |
| 2 | Metabolismo asombroso | Automático | Al tirar iniciativa recuperas los puntos y te curas nivel + dado (1/día). |
| 2 | Movimiento sin armadura | Automático | Velocidad extra sin armadura ni escudo. |
| 3 | Desviar ataques | Automático | Botón al recibir daño: resta 1d10 + Des + nivel. |
| 3 | Subclase de monje | Automático | Se elige en la subida de nivel. |
| 4 | Caída lenta | En parte | Número de reducción. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Ataque adicional | Automático | Ataques por acción en combate. |
| 5 | Golpe aturdidor | Automático | Al impactar gasta 1 punto y da la CD. |
| 6 | Golpes potenciados | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 7 | Evasión | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Movimiento acrobático | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Autorrestablecimiento | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Concentración agudizada | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Desviar energía | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 14 | Superviviente disciplinado | Automático | Competencia en todas las salvaciones. |
| 15 | Concentración perfecta | Automático | Al tirar iniciativa sube a 4 puntos si no usas Metabolismo. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 18 | Defensa superior | Automático | Se activa en «En juego» gastando 3 puntos. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Cuerpo y mente | Automático | +4 Des y Sab al subir a nivel 20. |

### Guerrero de la mano abierta (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Técnica de la mano abierta | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Plenitud de cuerpo | Automático | Contador; al gastarlo te cura dado + Sab. |
| 11 | Paso veloz | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Palma estremecedora | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Guerrero de la misericordia (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Instrumentos de misericordia | Automático | Perspicacia y Medicina. |
| 3 | Mano de aflicción | Automático | Al impactar sin armas: 1 punto, + dado + Sab necrótico. |
| 3 | Mano de curación | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Toque de galeno | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Ráfaga de curación y aflicción | Automático | Contador (Sab). |
| 17 | Mano de misericordia suprema | Automático | Contador. |

### Guerrero de la sombra (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Artes sombrías | Automático | Oscuridad cuesta 1 punto; Ilusión menor; CD con Sabiduría. |
| 6 | Paso entre sombras | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Paso entre sombras mejorado | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Capa de sombras | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Ilusión menor, Oscuridad.

### Guerrero de los elementos (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Armonía con los elementos | Automático | Elementalismo; CD con Sabiduría. |
| 3 | Manipular los elementos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 6 | Explosión elemental | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 11 | Paso de los elementos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Paradigma elemental | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Elementalismo.

## Paladín

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Imponer las manos | Automático | Reserva de 5 × nivel; botón «Curarme». |
| 1 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 1 | Maestría con armas | Automático | Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…). |
| 2 | Castigo de paladín | Automático | Castigo divino siempre preparado, gratis 1/día y al impactar. |
| 2 | Estilo de combate | Automático | Se elige como dote; Defensa, Tiro con arco y Duelo suman solos; los demás salen en el ataque. |
| 3 | Canalizar divinidad | Automático | Contador (recupera 1 en descanso corto, todos en largo). |
| 3 | Subclase de paladín | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Ataque adicional | Automático | Ataques por acción en combate. |
| 5 | Corcel fiel | Automático | Hallar corcel siempre preparado y gratis. |
| 6 | Aura de protección | Automático | +Car a tus salvaciones salvo incapacitado. |
| 7 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Abjurar de los enemigos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 10 | Aura de coraje | Automático | Inmune a asustado. |
| 11 | Golpes radiantes | Automático | +1d8 radiante en cada impacto cuerpo a cuerpo. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 14 | Toque reparador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 18 | Expansión de aura | Automático | 9 m. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |

### Juramento de entrega (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Arma sagrada | Automático | Se activa en «En juego» (gasta Canalizar divinidad): +Car al ataque. |
| 3 | Conjuros del juramento de entrega | Automático | Conjuros siempre preparados por nivel. |
| 7 | Aura de entrega | Automático | Inmune a hechizado. |
| 15 | Castigo protector | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 20 | Halo sagrado | Automático | Contador con canje por espacio de nivel 5. |

Conjuros siempre preparados: nivel 3: Escudo de fe, Protección contra el bien y el mal; nivel 5: Auxilio, Zona de la verdad; nivel 9: Disipar magia, Señal de esperanza; nivel 13: Guardián de la fe, Libertad de movimiento; nivel 17: Comunión, Golpe flamígero.

### Juramento de gloria (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Atleta sin parangón | Automático | Se activa en «En juego»: ventaja en Atletismo y Acrobacias. |
| 3 | Castigo inspirador | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Conjuros del juramento de gloria | Automático | Conjuros siempre preparados por nivel. |
| 7 | Aura de celeridad | Automático | +3 m de velocidad. |
| 15 | Defensa gloriosa | Automático | Contador (Car). |
| 20 | Leyenda viviente | Automático | Contador con canje por espacio de nivel 5. |

Conjuros siempre preparados: nivel 3: Heroísmo, Saeta guía; nivel 5: Arma mágica, Potenciar característica; nivel 9: Acelerar, Protección contra energía; nivel 13: Compulsión, Libertad de movimiento; nivel 17: Conocer las leyendas, Presencia regia de Yolande.

### Juramento de los antiguos (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del juramento de los antiguos | Automático | Conjuros siempre preparados por nivel. |
| 3 | Ira de la naturaleza | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Aura de salvaguarda | Automático | Resistencia a necrótico, psíquico y radiante en la lista de resistencias. |
| 15 | Centinela imperecedero | Automático | Contador. |
| 20 | Campeón ancestral | Automático | Contador con canje por espacio de nivel 5. |

Conjuros siempre preparados: nivel 3: Golpe apresador, Hablar con los animales; nivel 5: Paso brumoso, Rayo de luna; nivel 9: Crecimiento vegetal, Protección contra energía; nivel 13: Piel pétrea, Tormenta de hielo; nivel 17: Comunión con la naturaleza, Paso arbóreo.

### Juramento de venganza (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Conjuros del juramento de venganza | Automático | Conjuros siempre preparados por nivel. |
| 3 | Voto de enemistad | Automático | Se activa en «En juego»: ventaja contra la criatura. |
| 7 | Vengador implacable | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Espíritu vengativo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 20 | Ángel vengador | Automático | Contador con canje por espacio de nivel 5. |

Conjuros siempre preparados: nivel 3: Marca del cazador, Perdición; nivel 5: Inmovilizar persona, Paso brumoso; nivel 9: Acelerar, Protección contra energía; nivel 13: Destierro, Puerta dimensional; nivel 17: Escudriñar, Inmovilizar monstruo.

### Juramento de los genios nobles (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Castigo elemental | Automático | Furia del ifrit al impactar (gasta Canalizar divinidad). |
| 3 | Conjuros de genio | Automático | Conjuros siempre preparados por nivel. |
| 3 | Esplendor del genio | Automático | CA 10 + Des + Con sin armadura y una habilidad. |
| 7 | Aura de escudo elemental | Automático | Opción de tipo de daño en cada turno. |
| 15 | Represalia elemental | Automático | Contador (Car). |
| 20 | Vástago noble | Automático | Contador con canje por espacio de nivel 5. |

Conjuros siempre preparados: nivel 3: Castigo atronador, Elementalismo, Orbe cromático; nivel 5: Fuerza fantasmal, Imagen múltiple; nivel 9: Forma gaseosa, Volar; nivel 13: Conjurar elementales menores, Invocar elemental; nivel 17: Castigo desterrador, Contactar con otro plano.

## Pícaro

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 1 | Ataque furtivo | Automático | Al impactar con arma sutil o a distancia, una vez por turno. |
| 1 | Jerga de ladrones | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 1 | Maestría con armas | Automático | Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…). |
| 1 | Pericia | Automático | Cupo de pericias por clase y nivel. |
| 2 | Acción astuta | Automático | Correr, Destrabarse y Esconderse como acción adicional. |
| 3 | Puntería certera | Automático | Se activa en «En juego»: ventaja y velocidad 0. |
| 3 | Subclase de pícaro | Automático | Se elige en la subida de nivel. |
| 4 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 5 | Esquiva asombrosa | Automático | Botón al recibir daño: la mitad. |
| 5 | Golpe astuto | En parte | Muestra la CD. |
| 6 | Pericia | Automático | Cupo de pericias por clase y nivel. |
| 7 | Evasión | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 7 | Talentos fiables | Automático | En pruebas con competencia, un 9 o menos cuenta como 10. |
| 8 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 9 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 10 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 11 | Golpe astuto mejorado | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 12 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 13 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 14 | Golpes taimados | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 15 | Mente escurridiza | Automático | Competencia en salvaciones de Sabiduría y Carisma. |
| 16 | Mejora de característica | Automático | Asistente de subida de nivel: +2/+1 o dote. |
| 17 | Rasgo de subclase | Automático | Se elige en la subida de nivel. |
| 18 | Elusivo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 19 | Don épico | Automático | Asistente de subida de nivel. |
| 20 | Golpe de suerte | Automático | Contador (descanso corto). |

### Asesino (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Asesinar | Automático | Ventaja en iniciativa; en el primer asalto, Golpes sorprendentes suma tu nivel al Ataque furtivo. |
| 3 | Herramientas de asesino | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 9 | Pericia en infiltrarse | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Envenenar armas | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Golpe mortal | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Embaucador arcano (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Lanzamiento de conjuros | Automático | Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida). |
| 3 | Destreza con mano de mago | Automático | Mano de mago siempre preparada. |
| 9 | Emboscada mágica | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Embaucador versátil | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Ladrón de conjuros | Automático | Contador. |

Conjuros siempre preparados: nivel 3: Mano de mago.

### Ladrón (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Balconero | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 3 | Manos rápidas | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 9 | Sigilo supremo | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Usar objetos mágicos | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Reflejos de ladrón | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

### Rebanaalmas (Manual del Jugador)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Cuchillas psíquicas | Automático | Dados de energía psiónica. |
| 3 | Poder psiónico | Automático | Dados de energía (1 en descanso corto); Golpe psiónico al impactar. |
| 9 | Cuchillas del alma | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Velo psíquico | Automático | Contador con canje por dado. |
| 17 | Desgarro mental | Automático | Contador con canje por 3 dados. |

### Vástago de los Tres (Héroes de Faerûn)

| Nivel | Rasgo | Estado | Cómo lo aplica la app |
|---|---|---|---|
| 3 | Lealtad aterradora | Automático | Opción de dios (Bhaal, Myrkul, Perdición): cambia el truco siempre preparado y se avisa en el descanso largo. |
| 3 | Sed de sangre | Automático | Contador. |
| 9 | Golpe terrorífico | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 13 | Aura de maldad | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |
| 17 | Encarnación del terror | Se consulta | La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano. |

Conjuros siempre preparados: nivel 3: Guardia de cuchillas.
