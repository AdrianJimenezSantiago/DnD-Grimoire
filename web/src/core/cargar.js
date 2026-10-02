// Carga perezosa de módulos con import(): reintenta una vez y, si la pestaña sigue con una versión vieja de la app
// (los trozos ya no existen en el servidor), lanza un error que lo explica.
const FALLO = /dynamically imported module|importing a module script failed|error loading dynamically|failed to fetch|disallowed mime type/i;
export const esVersionVieja = e => !!e?.versionVieja;

export async function cargar(importar) {
  try { return await importar(); } catch (e) {
    if (!FALLO.test(String(e?.message || e))) throw e;
    try { return await importar(); } catch {
      const err = new Error('Se ha publicado una versión nueva del grimorio y esta pestaña sigue con la anterior. Recarga la página y vuelve a intentarlo: tus personajes y libros no se pierden.');
      err.versionVieja = true; throw err;
    }
  }
}
export function recargar() { location.reload(); }
