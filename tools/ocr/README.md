# Medición y corrección del OCR de los manuales

Los PDF de `tools/resources` ya traen una capa de texto hecha por OCR. La app la lee con pdf.js, la pasa por el
corrector (`web/src/domain/corrector.js`) y luego por los lectores de conjuros, dotes, objetos…

## Páginas de referencia

`paginas.json` lista 60 páginas variadas (22 del Manual del Jugador, 22 de la Guía del DM y 16 de Héroes de Faerûn):
conjuros, rasgos de clase, dotes, trasfondos, perfiles, tablas, objetos mágicos y texto narrativo.
`referencia/` tiene el texto correcto de cada una, revisado a mano contra la imagen de la página y en el mismo orden de
líneas y columnas que la app. El texto que lee la app y el correcto solo difieren en los errores de carácter.

- `desarrollo` (41 páginas): las que se miran para ajustar el corrector.
- `prueba` (19 páginas): no se miran al ajustarlo. Sirven para comprobar que el corrector generaliza.

El Manual de Monstruos no tiene capa de texto (son imágenes), así que la app no puede leerlo y no hay páginas suyas.

## Herramientas

```sh
node tools/ocr/medir.mjs                       # errores del OCR tal cual
node tools/ocr/medir.mjs --corregir            # errores tras el corrector
node tools/ocr/medir.mjs --corregir --traza    # cada cambio del corrector, con la regla que lo hizo
node tools/ocr/medir.mjs --errores 50          # las confusiones más frecuentes que quedan
node tools/ocr/medir.mjs --conjunto prueba     # solo un conjunto
node tools/ocr/diferencias.mjs phb 182         # líneas que cambia el corrector en una página
node tools/ocr/extraer.mjs --imagenes /tmp/x   # borradores de referencias nuevas y la imagen de cada página
node tools/ocr/vocabulario.mjs                 # regenera web/public/data/vocabulario.json
```

CER: caracteres mal / caracteres de la referencia. WER: lo mismo con palabras.

## Resultados

| Conjunto | CER sin corregir | CER corregido | WER sin corregir | WER corregido |
|---|---|---|---|---|
| desarrollo | 0,74 % | 0,53 % | 2,36 % | 1,30 % |
| prueba | 1,25 % | 0,94 % | 4,43 % | 2,90 % |

Parte del error que queda no es de caracteres: texto de las ilustraciones, celdas de tablas desordenadas o números que el
OCR leyó como otros números (705 en vez de 105). Arreglar eso queda para un OCR nuevo (paso 3).
