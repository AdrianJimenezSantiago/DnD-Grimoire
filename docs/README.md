<div align="center">

# 📚 Notas técnicas

Cómo está hecha Grimorio, cómo se ha contrastado con las reglas y cómo se ha medido.<br>
No hacen falta para usar la app: para eso está el [README principal](../README.md).

<img src="img/hoja.webp" alt="Hoja de personaje" width="200">
&nbsp;
<img src="img/conjuro.webp" alt="Ficha de un conjuro" width="200">
&nbsp;
<img src="img/combate.webp" alt="Modo combate" width="200">

</div>

## 🧭 Por dónde empezar

| | Documento | Qué cuenta |
|---|---|---|
| 🏛️ | **[Arquitectura](arquitectura.md)** | Capas, carpetas, patrones y pruebas: por dónde empezar a tocar el código. |
| 🔤 | [OCR de los manuales](../tools/ocr/README.md) | Cómo se mide y se corrige el texto que la app saca de los PDF. |

## ⚖️ Contraste con las reglas de 2024

Los cuatro primeros se generan con los scripts de [`tools/auditorias/`](../tools/auditorias): si cambian las reglas, se vuelven a generar en vez de editarlos a mano.

| | Documento | Qué cubre | En cifras |
|---|---|---|---|
| ⚔️ | [Clases y subclases](auditoria-clases.md) | Cada rasgo, nivel a nivel, comparado con el Manual del Jugador | 345 automáticos · 11 en parte · 185 de consulta |
| ✨ | [Conjuros](auditoria-conjuros.md) | Tiradas, dados, escalado y efectos de cada conjuro | 246 de 391 con tirada o efecto |
| 🧝 | [Especies y dotes](auditoria-origen.md) | Especies, linajes, trasfondos y dotes de origen | Manual del Jugador y Faerûn |
| 💍 | [Objetos mágicos](auditoria-objetos.md) | Sintonía, cargas, variantes y efectos de la Guía del DM | 171 automáticos de 350 |
| 📖 | [Compendio de reglas](auditoria-reglas.md) | Glosario, acciones, estados, propiedades y maestrías | 17 correcciones frente al manual |

## 🔬 Calidad

| | Documento | Qué cubre | Resultado |
|---|---|---|---|
| ♿ | [Interfaz](auditoria-interfaz.md) | Accesibilidad, contraste en los dos temas, legibilidad, SEO y uso sin conexión | Lighthouse 100 en accesibilidad · 0 fallos de axe en 78 vistas |
| 📱 | [Rendimiento en móvil](rendimiento-movil.md) | Fluidez con CPU ×4 y calidad de efectos según el dispositivo | Hoja y combate de 16–28 fps a 55–60 fps |
| 🔐 | [Seguridad](auditoria-seguridad.md) | Firma del APK, dependencias, datos importados, CSP, Android y compilación | 12 hallazgos: 10 arreglados, 2 a decidir por el dueño |

## 📸 Capturas

Las imágenes de [`img/`](img) salen de la app real con [`tools/capturas.mjs`](../tools/capturas.mjs):

```bash
PERSONAJES_PRUEBA=0 npm run build
npx vite preview --config web/vite.config.js --port 4173 &
npm i --no-save playwright-core
node tools/capturas.mjs http://localhost:4173/
```
