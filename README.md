# Grimorio

Hoja de personaje y libro de conjuros para **Dungeons & Dragons** con las reglas del **Manual del Jugador de 2024**, pensada para llevarla a la mesa en el móvil o en el ordenador.

Creas a tu personaje (clase, subclase, especie, trasfondo, nivel y características) y la app calcula por ti lo que dicen las reglas: CD y ataque de conjuro, espacios, conjuros preparados, recursos de clase, clase de armadura, carga… Durante la partida lanzas conjuros con un toque, gastas espacios y usos, marcas la concentración y descansas. La app recupera lo que corresponde en cada descanso.

## Qué ofrece

- **Todas las clases y subclases de 2024, del nivel 1 al 20**, con multiclase y un asistente para subir de nivel que te dice qué ganas.
- **Libro de conjuros** con un compendio de conjuros del SRD, filtros, rituales, concentración y tiradas de daño y curación.
- **«En juego»:** los rasgos de tu clase, especie y dotes agrupados por cuándo se usan (acción, acción adicional, reacción…).
- **Inventario** con armas y armaduras calculadas, monedas, carga y objetos mágicos con sintonización y cargas.
- **Diario de sesiones y bestiario** para apuntar lo que pasa en la campaña y lo que sabéis de cada criatura.
- **Tus libros dentro:** importa el PDF de tu Manual del Jugador, de la Guía del Dungeon Master o de una expansión. La app lee en tu dispositivo las descripciones de conjuros, reglas, objetos mágicos, dotes, trasfondos y subclases, y nada sale de él.
- **Varios personajes**, cada uno con el color y el emblema de su clase, en tema oscuro o claro.
- **Sin conexión y sin cuentas:** los datos se guardan en el propio dispositivo, con copia de seguridad en archivo.

## Instalación

Las versiones listas para usar se publican en la sección **Releases** del repositorio.

### Android

1. Desde el móvil o la tablet, abre **Releases** y descarga el archivo `grimorio-….apk` de la última versión.
2. Ábrelo y permite que el navegador instale apps si Android lo pide.
3. Si Play Protect avisa de que es una app desconocida, elige **Instalar de todos modos**. Es normal en apps que no vienen de la Play Store.

Para actualizar, instala la versión nueva encima. Los datos se conservan.

### Windows (o cualquier ordenador)

Descarga `grimorio-windows-….html` desde **Releases**, guárdalo en una carpeta y ábrelo con doble clic en Edge o Chrome. Es un único archivo: no instala nada y no necesita conexión.

Los datos quedan guardados en ese navegador. Para actualizar, sustituye el archivo por el nuevo, con el mismo nombre y en la misma carpeta.

### Web

Si el proyecto está publicado en Vercel, basta con abrir su dirección en el navegador. También aquí los personajes se guardan solo en tu dispositivo.

## Primeros pasos

1. En la portada, pulsa **Nuevo personaje** y rellena su ficha.
2. Añade conjuros con **Editar conjuros → Añadir**, desde el catálogo o el compendio.
3. En la mesa, **toca** un conjuro para lanzarlo y **mantén pulsado** para leerlo o elegir a qué nivel lanzarlo.
4. Si quieres las descripciones oficiales, importa tus PDF desde **Más → Libros**.
5. Haz de vez en cuando una **copia de seguridad** (Más → Copia de seguridad). Sirve también para pasar tus personajes del móvil al ordenador.

La app incluye un tutorial guiado que puedes repetir desde **Más → Ver tutorial**.

## Para desarrollar

Hace falta Node 22.

```
npm install
npm run dev      # la app en local, con recarga
npm test         # pruebas
```

Cada cambio en `main` compila en GitHub el APK y la versión de Windows y los publica en **Releases**.

## Créditos

Incluye material del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, con licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). Las descripciones de los libros solo aparecen si importas tus propios PDF. Fuentes Alegreya, Alegreya Sans, Cinzel y Cinzel Decorative con licencia SIL Open Font License 1.1. Iconos de [game-icons.net](https://game-icons.net) con licencia CC BY 3.0.

Proyecto de aficionado, sin relación con Wizards of the Coast. Dungeons & Dragons es una marca de Wizards of the Coast.
