/**
 * Parser de exportación oficial de Instagram en formato **HTML**.
 *
 * Relación con otros archivos:
 * - Se usa desde `src/App.tsx` cuando el usuario sube `followers_*.html` / `following.html`.
 * - Comparte el tipo `InstagramExportParseResult` con `src/lib/instagramExport.ts`.
 *
 * Nota:
 * - Instagram a veces deja elegir el formato al pedir la descarga (JSON o HTML).
 * - Este parser es heurístico (regex/DOMParser) para extraer usernames sin ejecutar scripts.
 */

import type { InstagramExportParseResult } from './instagramExport'
import { normalizeUsername } from './instagramExport'

function uniqueSorted(usernames: string[]): string[] {
  // Dedupe por normalización (Instagram es case-insensitive) y devolvemos la forma normalizada.
  const set = new Set<string>()
  for (const u of usernames) {
    const nu = normalizeUsername(u)
    if (nu) set.add(nu)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function parseInstagramRelationshipHtml(htmlText: string): InstagramExportParseResult {
  const warnings: string[] = ['Se importó un archivo HTML (export de Instagram en formato HTML).']

  const candidates: string[] = []

  // 1) Extraer usernames desde URLs de Instagram presentes en el HTML
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

  // 4) Si existe DOMParser (navegador), pase extra por anchors.
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
  const usernames = uniqueSorted(plausible)

  if (usernames.length === 0) {
    warnings.push('No se pudieron extraer usernames desde el HTML. Si Instagram te deja elegir formato, prueba con JSON.')
  }

  return { kind: 'unknown', usernames, warnings }
}

