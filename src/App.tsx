import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { parseInstagramRelationshipJson } from './lib/instagramExport'
import { parseInstagramRelationshipHtml } from './lib/instagramExportHtml'
import { LegalPage, type LegalRoute } from './pages/LegalPage'

function App() {
  function getLegalRouteFromHash(hash: string): LegalRoute | null {
    if (hash.startsWith('#/privacy')) return 'privacy'
    if (hash.startsWith('#/terms')) return 'terms'
    return null
  }

  // Navegación mínima por hash para páginas legales.
  // - #/privacy => política de privacidad
  // - #/terms   => términos y condiciones
  // Esto evita instalar un router y mantiene la app simple.
  const [legalRoute, setLegalRoute] = useState<LegalRoute | null>(() => getLegalRouteFromHash(window.location.hash || ''))

  // Guardamos SOLO usernames (no guardamos el JSON completo) por privacidad.
  const [followers, setFollowers] = useState<string[] | null>(null)
  const [following, setFollowing] = useState<string[] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // IMPORTANTE (React hooks):
  // Este useMemo debe ejecutarse SIEMPRE, incluso cuando estemos en `#/privacy` o `#/terms`.
  // Si hacemos `return` antes de llegar a este hook, React lanza:
  // "Rendered fewer hooks than expected..."
  const notFollowingBack = useMemo(() => {
    if (!followers || !following) return null
    const followersSet = new Set(followers)
    return following.filter((u) => !followersSet.has(u))
  }, [followers, following])

  useEffect(() => {
    const apply = () => setLegalRoute(getLegalRouteFromHash(window.location.hash || ''))

    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  if (legalRoute) {
    return (
      <LegalPage
        route={legalRoute}
        onBack={() => {
          window.location.hash = '#/'
        }}
      />
    )
  }

  async function handleFiles(
    files: FileList | null,
    setList: (value: string[] | null) => void,
    expected: 'followers' | 'following',
  ) {
    setError(null)
    setWarnings([])

    if (!files || files.length === 0) {
      setList(null)
      return
    }

    // Importante: Instagram a veces parte los datos en varios archivos (followers_1, followers_2, ...).
    // Por eso soportamos múltiples archivos y combinamos usernames.
    const combined = new Set<string>()
    const combinedWarnings: string[] = []

    for (const file of Array.from(files)) {
      try {
        const text = await file.text()

        // Instagram puede entregar el export en JSON o HTML (según lo que el usuario eligió al pedir la descarga).
        // Soportamos ambos.
        const looksLikeHtml = /^\s*</.test(text)
        const isHtmlByName = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')
        if (looksLikeHtml || isHtmlByName) {
          const result = parseInstagramRelationshipHtml(text)
          if (result.usernames.length === 0) {
            combinedWarnings.push(...result.warnings.map((w: string) => `"${file.name}": ${w}`))
            continue
          }

          // Heurística: si el nombre del archivo sugiere otra cosa, avisamos (sin bloquear).
          const lower = file.name.toLowerCase()
          if (expected === 'followers' && lower.includes('following')) {
            combinedWarnings.push(`"${file.name}": el nombre sugiere "following" pero lo cargaste como seguidores.`)
          } else if (expected === 'following' && lower.includes('followers')) {
            combinedWarnings.push(`"${file.name}": el nombre sugiere "followers" pero lo cargaste como seguidos.`)
          }

          for (const u of result.usernames) combined.add(u)
          combinedWarnings.push(...result.warnings.map((w: string) => `"${file.name}": ${w}`))
          continue
        }

        const json = JSON.parse(text) as unknown
        const result = parseInstagramRelationshipJson(json)

        if (result.usernames.length === 0) {
          combinedWarnings.push(`En "${file.name}" no pude extraer usernames.`)
          continue
        }

        // Si el parser detecta un "kind" distinto al esperado, avisamos pero igual usamos lo extraído.
        if (result.kind !== 'unknown' && result.kind !== expected) {
          combinedWarnings.push(
            `El archivo "${file.name}" parece ser "${result.kind}" pero lo cargaste como "${expected}". Aun así, pude extraer usernames.`,
          )
        }

        for (const u of result.usernames) combined.add(u)
        combinedWarnings.push(...result.warnings.map((w) => `"${file.name}": ${w}`))
      } catch {
        combinedWarnings.push(`"${file.name}": no pude parsearlo como JSON. Asegúrate de subir el *.json original del ZIP.`)
      }
    }

    const usernames = Array.from(combined).sort((a, b) => a.localeCompare(b))
    if (usernames.length === 0) {
      setWarnings(combinedWarnings)
      setError(
        'No pude obtener usernames. Sube los archivos de la descarga de Instagram (JSON o HTML): followers_* y following.',
      )
      setList(null)
      return
    }

    if (combinedWarnings.length > 0) setWarnings(combinedWarnings)
    setList(usernames)
  }

  async function copyList() {
    if (!notFollowingBack || notFollowingBack.length === 0) return
    const text = notFollowingBack.map((u) => `@${u}`).join('\n')
    await navigator.clipboard.writeText(text)
  }

  function resetAll() {
    setFollowers(null)
    setFollowing(null)
    setWarnings([])
    setError(null)
  }

  return (
    <div className="appShell">
      <header className="header">
      <div>
          <div className="brandRow">
            <span className="brandDot" aria-hidden="true" />
            <h1>Escáner IG</h1>
          </div>
          <p className="subtitle">
            Compara <strong>seguidos</strong> vs <strong>seguidores</strong> usando la <strong>exportación oficial</strong> de Instagram.
          </p>
          <div className="badges" aria-label="Características del producto">
            <span className="badge">Sin login</span>
            <span className="badge">Sin scraping</span>
            <span className="badge">JSON / HTML</span>
            <span className="badge">Privacidad: se procesa local</span>
          </div>
      </div>
        <button className="secondary" onClick={resetAll} type="button">
          Limpiar
        </button>
      </header>

      <main className="content">
        <section className="card">
          <h2>1) Cargar archivos</h2>

          <div className="grid2">
            <label className="field">
              <span className="label">Seguidores (ej: followers_1.json o followers_1.html)</span>
              <input
                type="file"
                accept="application/json,.json,text/plain,text/html,.html,.htm"
                multiple
                onChange={(e) => void handleFiles(e.target.files, setFollowers, 'followers')}
              />
              <span className="hint">{followers ? `Cargados: ${followers.length}` : 'Aún no cargado'}</span>
            </label>

            <label className="field">
              <span className="label">Seguidos (ej: following.json o following.html)</span>
              <input
                type="file"
                accept="application/json,.json,text/plain,text/html,.html,.htm"
                multiple
                onChange={(e) => void handleFiles(e.target.files, setFollowing, 'following')}
              />
              <span className="hint">{following ? `Cargados: ${following.length}` : 'Aún no cargado'}</span>
            </label>
          </div>

          <details className="help">
            <summary>¿Dónde consigo estos archivos en Instagram?</summary>
            <div className="helpBody">
              <p className="hint">
                Importante: Instagram cambia los menús según versión/idioma. Si no ves “Centro de cuentas”, usa el <strong>buscador</strong> en
                Configuración o entra desde el navegador al Centro de cuentas.
              </p>
              <p className="hint">
                Nota (Windows): aunque el explorador muestre “Tipo: Chrome HTML Document”, puedes subirlo: esta app soporta export en{' '}
                <code>.html</code> y <code>.json</code>.
              </p>

              <ol>
                <li>
                  Instagram → tu perfil → menú ☰ → <strong>Configuración y actividad</strong> (o “Configuración y privacidad”).
                </li>
                <li>
                  En el buscador de Configuración escribe: <code>descargar</code> / <code>información</code> / <code>datos</code>.
                </li>
                <li>
                  Entra a <strong>Descargar tu información</strong> y selecciona <strong>Seguidores y seguidos</strong>.
                </li>
                <li>
                  Si no lo encuentras en la app, prueba desde el navegador: <code>accountscenter.meta.com</code> → “Tu información y permisos” →
                  “Descargar tu información”.
                </li>
                <li>Descarga el <strong>.zip</strong>, descomprímelo y busca archivos como:</li>
              </ol>
              <ul>
                <li>
                  <code>followers_1.json</code> o <code>followers_1.html</code> (a veces también <code>followers_2.*</code>, etc.)
                </li>
                <li>
                  <code>following.json</code> o <code>following.html</code>
                </li>
              </ul>
              <p className="hint">
                Tip: la ruta típica dentro del zip suele ser <code>connections/followers_and_following/</code>.
        </p>
      </div>
          </details>

          {error ? <p className="error">{error}</p> : null}
          {warnings.length > 0 ? (
            <div className="warnings">
              <p className="warningsTitle">Avisos:</p>
              <ul>
                {warnings.map((w, i) => (
                  <li key={`${w}-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="cardHeaderRow">
            <h2>2) Resultado: personas que sigues y NO te siguen</h2>
            <button
              onClick={() => void copyList()}
              type="button"
              disabled={!notFollowingBack || notFollowingBack.length === 0}
              title="Copia @usernames al portapapeles"
            >
              Copiar lista
            </button>
          </div>

          {!notFollowingBack ? (
            <p className="hint">Carga ambos archivos para ver el resultado.</p>
          ) : notFollowingBack.length === 0 ? (
            <p className="ok">No hay nadie en “seguidos” que no te siga (según los archivos cargados).</p>
          ) : (
            <>
              <p className="hint">
                Total: <strong>{notFollowingBack.length}</strong>
              </p>
              <div className="list">
                {notFollowingBack.map((u) => (
                  <div key={u} className="listRow">
                    <div className="username">@{u}</div>
                    <div className="actions">
                      <a className="linkBtn" href={`https://www.instagram.com/${u}/`} target="_blank" rel="noreferrer">
                        Abrir perfil
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="footnote">
            Nota: esta app no hace “dejar de seguir” automático; solo te ayuda a identificar y abrir perfiles para que lo hagas manualmente.
          </p>
        </section>
      </main>

      <footer className="footer" aria-label="Créditos y redes">
        <div className="footerTop">
          <div className="footerTitle">Creado por Cristian Cano</div>
          <nav className="footerLinks" aria-label="Redes sociales">
            <a className="footerLink" href="https://ciscodedev.netlify.app/" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm7.93 9h-3.17a14.9 14.9 0 0 0-1.24-5.02A8.02 8.02 0 0 1 19.93 11ZM12 4.07c.92 1.25 1.66 3.4 2.03 5.93H9.97C10.34 7.47 11.08 5.32 12 4.07ZM4.07 13h3.17a14.9 14.9 0 0 0 1.24 5.02A8.02 8.02 0 0 1 4.07 13Zm3.17-2H4.07a8.02 8.02 0 0 1 4.41-5.02A14.9 14.9 0 0 0 7.24 11ZM12 19.93c-.92-1.25-1.66-3.4-2.03-5.93h4.06c-.37 2.53-1.11 4.68-2.03 5.93ZM14.24 13H9.76a18.2 18.2 0 0 1 0-2h4.48a18.2 18.2 0 0 1 0 2Zm1.28 5.02A14.9 14.9 0 0 0 16.76 13h3.17a8.02 8.02 0 0 1-4.41 5.02ZM16.76 11a14.9 14.9 0 0 0-1.24-5.02A8.02 8.02 0 0 1 19.93 11Z"
                />
              </svg>
              Web / Portafolio
            </a>
            <a className="footerLink" href="https://github.com/Cristiancano1236" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.35-1.17-3.35-1.17a2.64 2.64 0 0 0-1.1-1.46c-.9-.62.07-.61.07-.61a2.1 2.1 0 0 1 1.53 1.03a2.13 2.13 0 0 0 2.91.83a2.13 2.13 0 0 1 .64-1.34c-2.21-.25-4.53-1.1-4.53-4.9a3.84 3.84 0 0 1 1.02-2.66a3.56 3.56 0 0 1 .1-2.62s.84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02a3.56 3.56 0 0 1 .1 2.62a3.84 3.84 0 0 1 1.02 2.66c0 3.81-2.32 4.65-4.54 4.9a2.38 2.38 0 0 1 .68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2Z"
                />
              </svg>
              GitHub
            </a>
            <a className="footerLink" href="https://www.instagram.com/cristiancano1236/" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.5A5.5 5.5 0 1 1 6.5 13A5.51 5.51 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13A3.5 3.5 0 0 0 12 9.5ZM18 6.75a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 18 6.75Z"
                />
              </svg>
              Instagram
            </a>
            <a className="footerLink" href="https://www.youtube.com/@Ciscodedev" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.6A3 3 0 0 0 2.4 7.2A31.3 31.3 0 0 0 2 12a31.3 31.3 0 0 0 .4 4.8a3 3 0 0 0 2.1 2.1c1.8.6 7.5.6 7.5.6s5.7 0 7.5-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 22 12a31.3 31.3 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5Z"
                />
              </svg>
              YouTube
            </a>
            <a
              className="footerLink"
              href="https://www.paypal.com/donate/?hosted_button_id=8HMKJZY4E29RY"
              target="_blank"
              rel="noreferrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M7.2 20.5H4.6a.8.8 0 0 1-.79-.93l2.1-13A.8.8 0 0 1 6.7 6h6.76c3.7 0 6.16 2.02 5.55 5.65c-.57 3.4-3.23 5.35-6.86 5.35H9.6l-.78 4.81a.8.8 0 0 1-.79.69H7.2Zm3.02-5.5h1.5c2.18 0 3.72-1.02 4.08-3.13c.33-1.92-.9-2.87-2.93-2.87H9.4l-.72 6Z"
                />
              </svg>
              Donaciones (PayPal)
            </a>
          </nav>
        </div>
        <p className="footerNote">Si esta herramienta te ahorra tiempo, considera apoyar su desarrollo con una donación.</p>
        <div className="footerLegalLinks" aria-label="Enlaces legales">
          <a className="footerLegalLink" href="#/privacy">
            Política de Privacidad
          </a>
          <span className="footerLegalSep" aria-hidden="true">
            ·
          </span>
          <a className="footerLegalLink" href="#/terms">
            Términos y Condiciones
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
