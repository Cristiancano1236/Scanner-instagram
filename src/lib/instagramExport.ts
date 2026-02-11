/**
 * Parser de exportación oficial de Instagram (Data Download).
 *
 * Este archivo se usa desde `src/App.tsx` para extraer usernames a partir
 * de los JSON de "seguidores" y "seguidos" SIN login, SIN scraping.
 *
 * Formatos comunes que soporta:
 * - followers_1.json:
 *   { "relationships_followers": [ { "string_list_data": [ { value, href, timestamp } ] }, ... ] }
 * - following.json:
 *   { "relationships_following": [ { "string_list_data": [ { value, href, timestamp } ] }, ... ] }
 *
 * Nota de privacidad:
 * - Este parser solo devuelve usernames (strings) y warnings; no guarda el JSON completo.
 */

export type InstagramRelationshipKind = 'followers' | 'following' | 'unknown'

export type InstagramExportParseResult = {
  kind: InstagramRelationshipKind
  usernames: string[]
  warnings: string[]
}

/**
 * Normaliza un username para comparación (Instagram es case-insensitive).
 * - Quita espacios
 * - Quita prefijo '@' si existe
 * - Convierte a lowercase
 */
export function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, '').toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Extrae username desde un href típico del export de Instagram.
 * Ejemplos:
 * - https://www.instagram.com/_u/thenest_games
 * - https://www.instagram.com/thenest_games/
 */
function extractUsernameFromHref(href: string): string | null {
  // Preferimos capturar el path después de /_u/ (formato común en exports).
  const uMatch = href.match(/instagram\.com\/_u\/([a-zA-Z0-9._]{1,30})\/?/)
  if (uMatch?.[1]) return uMatch[1]

  // Fallback: path normal /<username>/
  const match = href.match(/instagram\.com\/([a-zA-Z0-9._]{1,30})\/?/)
  if (match?.[1]) return match[1]

  return null
}

/**
 * Intenta extraer un username desde un "relationship entry" típico de Instagram.
 * Ejemplo de entry:
 * { "string_list_data": [ { "value": "usuario", "href": "...", "timestamp": 123 } ] }
 */
function extractUsernameFromRelationshipEntry(entry: unknown): string | null {
  if (!isRecord(entry)) return null

  const sld = entry['string_list_data']
  if (!Array.isArray(sld)) return null

  // En muchos exports, el username viene como `string_list_data[].value`.
  for (const item of sld) {
    if (!isRecord(item)) continue
    const value = toStringOrNull(item['value'])
    if (value) return value
  }

  // En algunos exports (como tu `following.json`), NO existe `value`, y el username viene en `title`.
  const title = toStringOrNull(entry['title'])
  if (title) return title

  // Fallback adicional: intentar extraer desde `href` si viene en string_list_data.
  for (const item of sld) {
    if (!isRecord(item)) continue
    const href = toStringOrNull(item['href'])
    if (!href) continue
    const fromHref = extractUsernameFromHref(href)
    if (fromHref) return fromHref
  }

  return null
}

function uniqueSorted(usernames: string[]): string[] {
  // Usamos normalización para deduplicar, pero devolvemos la versión normalizada,
  // que es la más útil para construir URLs / comparación.
  const set = new Set<string>()
  for (const u of usernames) {
    const nu = normalizeUsername(u)
    if (nu) set.add(nu)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

/**
 * Parsea el JSON cargado y devuelve usernames + el "tipo" detectado.
 * - Si detecta `relationships_followers` => kind = 'followers'
 * - Si detecta `relationships_following` => kind = 'following'
 * - En otro caso intenta parsear si es array de entries => kind = 'unknown'
 */
export function parseInstagramRelationshipJson(json: unknown): InstagramExportParseResult {
  const warnings: string[] = []

  // Detectar formato "objeto con clave relationships_*"
  if (isRecord(json)) {
    const followers = json['relationships_followers']
    if (Array.isArray(followers)) {
      const usernames = followers
        .map(extractUsernameFromRelationshipEntry)
        .filter((u): u is string => Boolean(u))
      if (usernames.length === 0) warnings.push('Se detectó followers, pero no se pudieron extraer usernames.')
      return { kind: 'followers', usernames: uniqueSorted(usernames), warnings }
    }

    const following = json['relationships_following']
    if (Array.isArray(following)) {
      const usernames = following
        .map(extractUsernameFromRelationshipEntry)
        .filter((u): u is string => Boolean(u))
      if (usernames.length === 0) warnings.push('Se detectó following, pero no se pudieron extraer usernames.')
      return { kind: 'following', usernames: uniqueSorted(usernames), warnings }
    }

    // Algunos exports pueden venir como `relationships_follow_requests_sent`, etc.
    // Intentamos extraer de la primera lista "parecida".
    for (const [key, value] of Object.entries(json)) {
      if (!key.startsWith('relationships_')) continue
      if (!Array.isArray(value)) continue
      const usernames = value
        .map(extractUsernameFromRelationshipEntry)
        .filter((u): u is string => Boolean(u))
      if (usernames.length > 0) {
        warnings.push(`Formato no estándar: se extrajo desde "${key}".`)
        return { kind: 'unknown', usernames: uniqueSorted(usernames), warnings }
      }
    }
  }

  // Detectar formato "array directo"
  if (Array.isArray(json)) {
    const usernames = json
      .map(extractUsernameFromRelationshipEntry)
      .filter((u): u is string => Boolean(u))
    if (usernames.length === 0) warnings.push('El JSON es un array, pero no se pudieron extraer usernames.')
    return { kind: 'unknown', usernames: uniqueSorted(usernames), warnings }
  }

  warnings.push('Formato de JSON no reconocido para seguidores/seguidos.')
  return { kind: 'unknown', usernames: [], warnings }
}

/**
 * Parser heurístico para exportación oficial de Instagram en **HTML**.
 *
 * En algunas descargas, Instagram permite escoger formato (JSON/HTML).
 * Si el usuario descargó en HTML, encontrará archivos como:
 * - followers_1.html
 * - following.html
 *
 * Este parser NO intenta ejecutar scripts: solo extrae posibles usernames desde:
 * - URLs tipo https://www.instagram.com/<username>/
 * - Texto tipo @username
 * - Ocurrencias tipo "value":"username" (a veces embebidas en el HTML)
 *
 * Se usa desde `src/App.tsx` cuando el archivo parece HTML.
 */
export function parseInstagramRelationshipHtml(htmlText: string): InstagramExportParseResult {
  const warnings: string[] = ['Se importó un archivo HTML (export de Instagram en formato HTML).']

  const candidates: string[] = []

  // 1) Extraer usernames desde URLs de Instagram presentes en el HTML
  // Captura el segmento inmediato después del dominio.
  const urlRe = /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?/g
  for (const match of htmlText.matchAll(urlRe)) {
    if (match[1]) candidates.push(match[1])
  }

  // 2) Extraer usernames desde texto tipo @username
  const atRe = /@([a-zA-Z0-9._]{1,30})/g
  for (const match of htmlText.matchAll(atRe)) {
    if (match[1]) candidates.push(match[1])
  }

  // 3) Extraer desde fragmentos tipo "value":"username" (común en exports)
  const valueRe = /"value"\s*:\s*"([^"]{1,64})"/g
  for (const match of htmlText.matchAll(valueRe)) {
    if (match[1]) candidates.push(match[1])
  }

  // 4) Si existe DOMParser (navegador), hacer un pase extra por anchors.
  // Esto mejora casos donde el HTML no contiene URLs completas en texto plano.
  try {
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(htmlText, 'text/html')
      const anchors = Array.from(doc.querySelectorAll('a'))
      for (const a of anchors) {
        const href = a.getAttribute('href') ?? ''
        const text = a.textContent ?? ''

        const hrefMatch = href.match(/instagram\.com\/([a-zA-Z0-9._]{1,30})\/?/)
        if (hrefMatch?.[1]) candidates.push(hrefMatch[1])

        const textMatch = text.match(/@?([a-zA-Z0-9._]{1,30})/)
        if (textMatch?.[1]) candidates.push(textMatch[1])
      }
    }
  } catch {
    // Silencioso: seguimos con el resultado por regex.
  }

  // Filtrado final: quedarnos con lo que parece username válido.
  const plausible = candidates.filter((raw) => /^[a-zA-Z0-9._]{1,30}$/.test(raw))

  if (plausible.length === 0) {
    warnings.push('No se pudieron extraer usernames desde el HTML. Intenta descargar en formato JSON si Instagram te da esa opción.')
  }

  return { kind: 'unknown', usernames: uniqueSorted(plausible), warnings }
}
