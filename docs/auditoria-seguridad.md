# Auditoría de seguridad

Revisión de octubre de 2026 de la web, la APK de Android, la versión de Windows, el repositorio y la compilación en GitHub Actions. La pregunta era una: ¿puede alguien hacer daño a quien usa Grimorio? Este documento recoge lo que se encontró, lo que ya está arreglado y lo que solo puede hacer el dueño del repositorio.

## Resumen

| # | Gravedad | Hallazgo | Estado |
|---|---|---|---|
| 1 | Crítica | La clave de firma del APK y su contraseña estaban en el repositorio, que es público | Retirada del código y firma por secretos. **Falta un paso del dueño** (ver abajo) |
| 2 | Alta | pdf.js 5.7 permitía ejecutar código al abrir un PDF malicioso ([GHSA-hq66-cqwq-w95j](https://github.com/advisories/GHSA-hq66-cqwq-w95j)) | Actualizado a pdf.js 6.4 |
| 3 | Alta | Inyección de código (XSS) desde una copia o un personaje compartido, a través del retrato | Arreglado |
| 4 | Alta | Un id manipulado en una copia podía escribir o borrar archivos fuera de su sitio en la APK (`retrato-<id>.txt`) | Arreglado |
| 5 | Media | Otros datos importados (ids, números del equipo y del diario, marcas del bestiario) entraban sin filtrar en el HTML | Arreglado |
| 6 | Media | Sin política de seguridad del contenido (CSP): un fallo de escape habría bastado para ejecutar código | Añadida en la web y la APK |
| 7 | Media | Una copia con datos rotos dejaba la hoja en blanco o a medio cargar | Arreglado: se valida antes de tocar nada |
| 8 | Media | Si lo guardado no se podía leer, la app arrancaba vacía y el primer guardado lo pisaba | Arreglado: se aparta una copia de rescate |
| 9 | Baja | El título de un PDF importado salía sin escapar en un aviso | Arreglado |
| 10 | Baja | El FileProvider de Android exponía todo el almacenamiento externo | Reducido a la caché |
| 11 | Baja | Flujos de GitHub Actions con más permisos de los necesarios y sin revisión de dependencias | Ajustado |
| 12 | Aviso legal | Los PDF de los manuales están en el repositorio público y las APK publicadas llevan texto extraído de ellos | Decisión del dueño (ver abajo) |

Lo que ya estaba bien y se ha comprobado: no hay cuentas, ni servidores propios, ni analítica, ni conexiones a terceros; todo se guarda en el dispositivo; los PDF se leen en local; el texto que escribe el usuario se escapa al pintarse; la APK no pide más permiso que `INTERNET`, no admite tráfico sin cifrar y no deja depurar la WebView en la versión publicada; el service worker de la web solo guarda peticiones del propio sitio.

## 1. La clave de firma del APK (crítica)

`android/keystore.properties` (con la contraseña en claro) y `android/app/grimorio-release.keystore` estaban en el repositorio desde el 27 de septiembre de 2026. El repositorio es público, así que cualquiera puede descargar la clave.

**Por qué importa.** Android acepta como actualización de una app cualquier APK firmado con la misma clave. Con ella, alguien podría publicar un «Grimorio» falso que, instalado encima del bueno, heredaría todos los datos y personajes del usuario y no despertaría ninguna sospecha en el sistema.

**Qué se ha cambiado.**
- Los dos archivos dejan de estar en el repositorio y `.gitignore` impide volver a subirlos (`*.keystore`, `*.jks`, `keystore.properties`).
- `android/app/build.gradle` lee la firma de variables de entorno (`GRIMORIO_KEYSTORE_FILE`, `GRIMORIO_KEYSTORE_PASSWORD`, `GRIMORIO_KEY_ALIAS`, `GRIMORIO_KEY_PASSWORD`) o, en un ordenador propio, de un `keystore.properties` local que git ignora.
- `compilar-apk.yml` reconstruye la clave desde un secreto del repositorio, la usa y la borra del runner al terminar. Si el secreto falta, la compilación se para con un mensaje claro. Un APK firmado con otra clave no se podría instalar encima del anterior sin desinstalar (y perder los datos).

**Lo que tiene que hacer el dueño del repositorio**, en este orden:

1. **Crear los secretos** en GitHub, en *Settings → Secrets and variables → Actions*. Sin ellos la siguiente compilación de `main` falla a propósito.
   - `GRIMORIO_KEYSTORE_BASE64`: el keystore en base64. Se saca de la historia con
     `git show 1442193:android/app/grimorio-release.keystore | base64 -w0`
   - `GRIMORIO_KEYSTORE_PASSWORD` y `GRIMORIO_KEY_PASSWORD`: la contraseña que había en `keystore.properties` (`git show 1442193:android/keystore.properties`).
   - `GRIMORIO_KEY_ALIAS`: `grimorio`.
2. **Cambiar de clave.** Quitar los archivos del repositorio no la protege: sigue en la historia y ya ha sido pública. La forma de cambiarla sin que los usuarios pierdan sus datos es la rotación de clave de Android (esquema de firma v3, Android 9 o posterior):
   ```sh
   keytool -genkeypair -v -keystore grimorio-2026.keystore -alias grimorio -keyalg RSA -keysize 4096 -validity 10000
   apksigner rotate --out linaje.bin \
     --old-signer --ks grimorio-release.keystore \
     --new-signer --ks grimorio-2026.keystore
   apksigner sign --ks grimorio-release.keystore \
     --next-signer --ks grimorio-2026.keystore --lineage linaje.bin app-release.apk
   ```
   Gradle no sabe firmar con linaje, así que la compilación tendría que dejar el APK sin firmar y añadir un paso con `apksigner` (con la clave nueva, la vieja y el linaje como secretos). En Android 7 y 8 la rotación no existe: allí habría que reinstalar, después de guardar una copia de seguridad desde la app.
3. **Opcional:** borrar la clave de la historia con `git filter-repo` y forzar el envío. No sustituye al paso 2 (la clave ya se ha podido copiar) y obliga a volver a clonar.

## 2. pdf.js (alta)

La app abre los PDF que elige el usuario. La versión 5.7 de pdf.js tenía un fallo publicado que permitía ejecutar código con un PDF preparado. Se actualiza a la 6.4.299, que lo corrige. La 6 quita `PDFDocumentProxy.destroy()`, así que la app y las herramientas de `tools/` cierran ahora el documento con `loadingTask.destroy()`, y ya no hace falta `isEvalSupported` (pdf.js 6 no usa `eval`). Se ha comprobado leyendo un PDF en el navegador y en Node.

## 3, 4 y 5. Datos que llegan de fuera (alta y media)

Una copia de seguridad o un personaje exportado son archivos que la gente se pasa por WhatsApp o por correo. Antes, lo que traían se usaba tal cual:

- **El retrato** se pintaba como `<img src="…">` sin escapar. Un retrato con `x" onerror="…` ejecutaba código al abrir la portada. En la APK ese código tiene a mano los plugins nativos: archivos de la app, compartir, preferencias. Además, un enlace `https://` como retrato habría avisado a un servidor ajeno de cada vez que se abre la app.
- **Los ids** (de personajes, conjuros, objetos, efectos…) van en atributos del HTML sin escapar, y el del personaje forma el nombre de un archivo (`retrato-<id>.txt`). Un id como `../../shared_prefs/…` hacía que guardar o borrar el retrato escribiera o borrara fuera de la carpeta de la app.
- **Números y marcas** del equipo (CA de la armadura), del diario (número de sesión) y del bestiario (vulnerable, resistente…) se pintaban sin escapar porque se daban por números o por valores conocidos.

**Qué se ha cambiado** (`domain/personaje/modelo.js`, `domain/equipo/equipo.js`, `domain/criaturas/bestiario.js`):
- `normBd`, por donde pasa todo lo que se carga (lo guardado, una copia, un personaje exportado, una hoja antigua), cambia cualquier id con `< > " ' \` & / \` o caracteres de control por uno nuevo, y lo hace igual en toda la base para que las referencias sigan enlazando. Los ids que crea la app no cambian.
- El retrato solo se acepta como imagen incrustada (`data:image/png|jpeg|webp|gif;base64,…`), que es lo que guarda la app.
- Efectos activos, objetivos, historial, sesiones del diario y sus notas, criaturas del bestiario y armas y armaduras se normalizan con su tipo; los valores que acaban en clases del HTML solo pueden ser los que conoce la app.
- `esc()` escapa también la comilla simple, y el retrato se escapa al pintarse aunque ya venga validado.
- Cargar una copia (`ui/dialogs/copia.js`) prepara la base nueva aparte y solo la pone en uso si todo ha ido bien. Si el archivo está roto o manipulado, sale el aviso de siempre y no cambia nada.

## 6. Política de seguridad del contenido (media)

Es la red bajo todo lo anterior: aunque algún día se olvide escapar un texto, el navegador no ejecuta código que no sea de la propia app.

- **Web y APK** (`web/vite.config.js` la añade al compilar): `script-src 'self'`, `script-src-attr 'none'` (ningún `onerror`/`onclick` en el HTML), `connect-src 'self'` (la app no puede hablar con ningún otro sitio), `object-src 'none'`, `frame-src 'none'`, `base-uri 'none'` y `form-action 'none'`. Los estilos en línea se permiten porque la hoja los usa para colores y animaciones, y no ejecutan código. `'wasm-unsafe-eval'` es para los decodificadores de imagen de pdf.js, no permite `eval`.
- **Vercel** manda la misma política como cabecera, más `frame-ancestors 'none'`, `Strict-Transport-Security`, `Permissions-Policy` (sin cámara, micrófono, ubicación ni pagos) y `Cross-Origin-Opener-Policy`, junto a las que ya había (`nosniff`, `no-referrer`, `DENY`).
- **APK.** Capacitor mete su puente con la app nativa como script de inicio de la WebView, que la política no bloquea. Solo en WebViews muy antiguas lo inyecta dentro del HTML, y ahí sí lo bloquearía. Por eso `capacitor.config.json` pide ya una WebView 100 o más nueva: la app ya la necesitaba (se compila para Chrome 100) y, con una más vieja, Android enseña un aviso claro en vez de una app a medio cargar.
- **Windows.** El HTML único lleva todo el código dentro de la página, así que no puede llevar esta política. Para esa versión cuentan el escape y la validación de los datos.

## 7 y 8. Robustez (media)

- Una copia con un efecto o una criatura mal formados rompía el pintado de la hoja (`Cannot read properties of undefined`). Ahora se normaliza (punto 3) y la carga es atómica (punto 5).
- Si lo guardado no se podía leer, la app arrancaba con la base vacía y el siguiente guardado borraba los personajes. Ahora `cargarGuardado` lo avisa y `main.js` guarda el texto original en `grimorio-v2-rescate-<fecha>` antes de seguir.

## 10. Android

- **FileProvider** (`res/xml/file_paths.xml`): el de la plantilla de Capacitor exponía la raíz del almacenamiento externo. La app solo comparte la copia de seguridad, que escribe en su caché, así que ahora solo se expone la caché.
- **`allowBackup="true"` se mantiene a propósito.** La copia automática de Android lleva los personajes al móvil nuevo, y no hay nada sensible que proteger (ni contraseñas ni datos personales más allá de lo que el usuario escriba de su personaje).
- **Ofuscación (R8) desactivada.** El código es abierto y no hay secretos que esconder, así que no aporta seguridad. Se deja como está.

## 11. Compilación y dependencias

- `pruebas.yml` declara `permissions: contents: read` y ejecuta `npm audit --omit=dev --audit-level=high`: un pull request no pasa si algo que va dentro de la app tiene una vulnerabilidad alta conocida.
- `compilar-apk.yml` no deja que dos compilaciones de `main` publiquen a la vez (`concurrency`) y borra la clave del runner al terminar.
- `npm audit fix` ha actualizado `source-map-js` y `micromatch` (herramientas de compilación). Quedan dos avisos que no llegan al usuario: `braces` (a través de `vite-plugin-singlefile`, solo con patrones escritos por nosotros) y `uuid` (a través de `@capacitor/cli`, solo en la herramienta de iOS). Ninguno va dentro de la app.
- **Recomendado:** fijar las acciones de terceros (`softprops/action-gh-release`, `android-actions/setup-android`) a un commit concreto en vez de a `@v2`/`@v3`. Así un cambio en esas acciones no puede colarse en la compilación que tiene acceso a la clave de firma.

## 12. Aviso legal: los PDF de los manuales

`tools/resources/` guarda en Git LFS el Manual del Jugador, la Guía del DM, el Manual de Monstruos y Héroes de Faerûn, en un repositorio público. La compilación lee esos PDF y mete su texto en cada APK y en cada versión de Windows que se publica en Releases. No es un fallo de seguridad para el usuario, pero es contenido con derechos de Wizards of the Coast distribuido públicamente, y puede acabar en una retirada del repositorio por DMCA. Opciones: hacer privado el repositorio, sacar los PDF a un almacenamiento privado al que solo acceda la compilación, o dejar de incluir los libros y que cada usuario importe los suyos (como ya permite la app).

## Cómo se ha comprobado

- **Ataque simulado en un navegador real** (Chromium con Playwright). Se generó una copia con 12 personajes en la que cada texto, y en una segunda pasada también cada número, era una carga XSS con su propio identificador (unas 5.000 cargas). Un robot abrió la portada y la hoja de varios personajes y pulsó sus botones y ventanas (un recorrido parcial, no todas las pantallas). Antes de los arreglos se ejecutaron las cargas del retrato en los 12 personajes y otras desde el diario y la armadura. Después, ninguna.
- **Revisión del código de las 125 inserciones de HTML** de la interfaz, con búsquedas de todo dato del usuario o de un libro importado que se pinte sin `esc()`: atributos, avisos (`toast`), diálogos y fichas. De ahí salen los puntos 5 y 9.
- **La política, sola:** en la versión compilada se inyectó a mano un `<img onerror>` y un enlace `javascript:`, y se intentó una conexión a otro sitio. Los tres quedan bloqueados. En el servidor de desarrollo, que no lleva la política, los dos primeros se ejecutan, así que es la política la que los para.
- **PDF con trampa:** un PDF con un título que lleva HTML se importa sin ejecutar nada y se lee igual con pdf.js 6.
- **Uso normal con la política puesta:** arranque, hoja, fondo animado (worker), compendio e importación de un PDF sin ninguna violación de la política en la consola.
- **Pruebas automáticas nuevas** en `tests/seguridad/importar.test.js`: copia hostil (ids, retrato, efectos, diario, bestiario, equipo), base ilegible, escape, y configuración (clave fuera del repositorio, política en web y Vercel, FileProvider). Todo `npm test` pasa, igual que `npm run lint`, `npm run build` y `npm run build:windows`.

No se ha podido compilar ni instalar la APK en esta revisión: el entorno no tiene el SDK de Android ni la clave. La primera compilación de `main` con los secretos puestos es la prueba que falta.
