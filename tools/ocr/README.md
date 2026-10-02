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
node tools/ocr/reocr.mjs --nombre tess-fast    # otro OCR (Tesseract) de las páginas de referencia, para medirlo
node tools/ocr/medir.mjs --motor tess-fast     # ese OCR por sí solo
node tools/ocr/medir.mjs --corregir --fusionar tess-fast   # capa del PDF + corrector + fusión con ese OCR
node tools/ocr/segunda-lectura.mjs phb dmg faerun          # segunda lectura de los libros enteros (lecturas/, ~1 h)
```

CER: caracteres mal / caracteres de la referencia. WER: lo mismo con palabras.

## Segunda lectura y fusión

Las imágenes del Manual del Jugador y de la Guía están a 96 ppp y su capa de texto la hizo Tesseract sobre el escaneo
original, así que volver a pasar OCR no la mejora por sí solo. En Faerûn el texto está en una capa de 1 bit a 600 ppp
comprimida con JBIG2, que a veces cambia unas letras por otras dentro de la propia imagen.

Aun así, Tesseract (5.3, español, 300 ppp) se equivoca en sitios distintos que la capa original. `web/src/domain/fusion.js`
toma la capa del PDF como base y, donde sus palabras no son palabras y las de la otra lectura sí (y se parecen), usa las
de la otra lectura. `tools/ocr/lecturas/` guarda esa segunda lectura de los tres libros (con la huella del PDF), y
`preparar-libros.mjs` la usa al generar los libros incluidos. El modelo «best» de Tesseract, los 600 ppp o fusionar
dos lecturas no mejoran lo bastante para compensar el tiempo.

PaddleOCR también está probado (`reocr.mjs --motor paddle`, con el modelo PP-OCRv4 que trae `rapidocr_onnxruntime`; los
modelos latinos y Surya necesitan Hugging Face o los servidores de Paddle, cerrados en el entorno donde se probó). Ese
modelo está entrenado para chino e inglés: quita todas las tildes y pega palabras («Encontrarinformacion»). Solo tiene un
43 % de palabras mal, y fusionado empeora el resultado (1,70 % frente a 1,59 % con Tesseract).

## Resultados (WER, palabras mal)

| | PDF tal cual | Tesseract solo | PDF + corrector | PDF + corrector + fusión |
|---|---|---|---|---|
| Manual del Jugador | 1,79 % | 3,92 % | 0,75 % | 0,72 % |
| Guía del DM | 2,21 % | 2,91 % | 1,74 % | 1,70 % |
| Héroes de Faerûn | 5,50 % | 4,61 % | 3,12 % | 2,59 % |
| Desarrollo (41 págs.) | 2,36 % | 2,64 % | 1,30 % | 1,15 % |
| Prueba (19 págs.) | 4,43 % | 6,45 % | 2,90 % | 2,68 % |

Parte del error que queda no es de caracteres: texto de las ilustraciones, celdas de tablas desordenadas o números que el
OCR leyó como otros números (705 en vez de 105), que ninguna de las dos lecturas tiene bien.
