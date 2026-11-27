// Páginas que cuentan como visita. Mantener sincronizado con las rutas de client/src/App.tsx.
// Cualquier otra ruta se ignora, así nadie puede llenar la tabla `visits` con paths inventados.
// Al añadir una sección nueva en el front, añádela también aquí.
const TRACKED_PAGES: ReadonlySet<string> = new Set(['/', '/politica-de-privacidad']);

/** Normaliza un path (sin barra final) y devuelve la página si está permitida, o null. */
export function resolveTrackedPage(rawPath: string): string | null {
  const page = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  return TRACKED_PAGES.has(page) ? page : null;
}
