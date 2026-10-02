# Auditoría del compendio de reglas (Manual del Jugador de 2024)

Revisión de las reglas y términos de consulta rápida que usa la app: el glosario importado del manual, los resúmenes propios
(acciones, economía del turno, estados, propiedades y maestrías de armas) y cómo se enlazan entre sí.

## De dónde sale cada texto

| Fuente | Qué contiene | Cuándo se ve |
|---|---|---|
| Glosario importado (`domain/glosario.js`) | Las definiciones del apéndice del Manual del Jugador y las herramientas de la Guía del DM | Biblioteca → Reglas, y cada término subrayado en un texto |
| `domain/referencia.js` | Acción, acción adicional, reacción, movimiento, propiedades y maestrías de armas | Al tocar la economía del turno, la velocidad o un arma |
| `domain/combate.js` (`ACCIONES_COMUNES`) | Correr, Destrabarse, Esquivar, Ayudar, Esconderse, Buscar, Estudiar, Influir, Preparar, Usar un objeto, Ataque de oportunidad | Vista de combate |
| `domain/vida.js` (`ESTADOS`) y `domain/efectos.js` (`REGLAS_ESTADO`) | Resumen de los 14 estados y lo que la hoja aplica sola | Estados, tiradas y la ficha de cada estado |

Con el manual importado, la regla completa siempre manda; los resúmenes de la app aparecen encima como «En resumen».

## Errores corregidos

| Dónde | Antes | Ahora (2024) |
|---|---|---|
| Acción adicional → Conjuros | «Ese turno solo puedes lanzar además un truco de 1 acción» (regla de 2014) | En un turno solo puedes gastar **un** espacio de conjuro |
| Acción adicional | — | Añadido **Beber una poción** (en 2024 es acción adicional) |
| Usar un objeto | «Como beber una poción o activar un objeto mágico» | Objetos **no mágicos**; los mágicos van por la acción de Magia y las pociones son acción adicional. Se busca también como «Utilizar» en el glosario |
| Ayudar | Aliado a 1,5 m, cualquier prueba | Prueba con una habilidad o herramienta **en la que tengas competencia**, o ataque contra un enemigo a 1,5 m de ti; también estabiliza (Medicina CD 10) |
| Esconderse | «Fuera de la vista y tras cobertura» | Muy oscurecido o cobertura de **tres cuartos o total**; tu total es la CD para encontrarte; termina al hacer ruido, atacar o lanzar con componente verbal |
| Esquivar (economía) | Sin la condición de pérdida | Se pierde si quedas incapacitado o con velocidad 0 |
| Atacar / Magia | — | Desenvainar o envainar con cada ataque; Magia incluye rasgos mágicos |
| Saltar | En pies | En metros: largo 30 cm por punto de Fuerza, alto 90 cm + 30 cm por punto de modificador; la ficha de velocidad calcula los tuyos |
| Maestría de la **Maza** | Irritar | **Debilitar** |
| Maestría de la **Lanza** | Derribar | **Debilitar** (también en las mazas y lanzas que ya estaban en un inventario) |
| Propiedad **Distancia** | No existía; la ficha del arma solo mostraba las cifras | Explicada (normal / larga, desventaja más allá de la normal) |
| Maestría Derribar | «CD 8 + el modificador del ataque + tu competencia» (ambiguo) | CD 8 + el modificador **de característica** del ataque + tu bonificador por competencia |
| Incapacitado | Faltaba que no puedes hablar y la desventaja en iniciativa | Completo |
| Inconsciente, Paralizado, Aturdido | Faltaba «ataques contra ti con ventaja» | Completo |
| Petrificado | «Inmune a veneno» (2014) | Inmune al **estado envenenado**, ataques contra ti con ventaja, fallas Fue y Des; la hoja ya aplica la inmunidad |
| Encantado | Solo «no puedes atacar» | Tampoco dañarlo con rasgos o efectos mágicos |
| Aturdido, Paralizado, Inconsciente, Petrificado | No aplicaban la desventaja en la iniciativa del estado incapacitado que incluyen | La hoja la aplica (sin duplicarla) |
| Enlaces del glosario | «desventaja» abría siempre la entrada de «ventaja» | Abre la suya si el manual la trae |

Comprobado sin cambios: propiedades Alcance, Arrojadiza, Carga, Dos manos, Ligera, Munición, Pesada, Sutil y Versátil; las ocho
maestrías (salvo la redacción de Derribar); las 36 armas restantes de la tabla; Buscar, Estudiar, Influir, Preparar, Correr,
Destrabarse, Ataque de oportunidad; agotamiento (−2 por nivel a las pruebas d20, −1,5 m de velocidad por nivel, muerte a 6).

## Cómo se ve ahora

- **Lista de reglas**: tarjetas con la primera frase de cada regla, filtro por categoría y color propio por categoría
  (estados en rojo, acciones en azul, áreas en violeta, peligros en naranja, actitudes en verde, herramientas del DM en turquesa).
  Al buscar, primero lo que coincide por nombre (resaltado) y después «También lo mencionan».
- **Ficha de una regla**: cabecera con el color de su categoría; «En resumen» con el resumen de la app; «Lo que hace la hoja»
  para los estados; botón para poner o quitar el estado al personaje; la regla completa con capitular; «Ver también» con los
  términos que cita; y **Volver** para regresar a la ficha anterior al saltar de un término a otro.
- **Realce del texto** (reglas y conjuros), siempre con el mismo significado:
  **CD** en negrita · ventaja en verde y desventaja en rojo · *cuándo y cuántas veces* en cursiva ·
  ACCIÓN ADICIONAL y REACCIÓN en versalitas · términos del glosario subrayados con puntos · dados y tipos de daño como antes.
- **Economía del turno y velocidad**: cada acción enlaza a su regla del manual si está importado, y la ficha añade lo propio del
  personaje (cuántos ataques da su acción de Atacar, qué puede hacer como acción adicional, cuánto salta).
