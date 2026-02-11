/**
 * Página legal (Términos + Privacidad) para dar tranquilidad al usuario.
 *
 * Relación con otros archivos:
 * - `src/App.tsx` usa navegación por hash (`#/privacy`, `#/terms`) para mostrar esta pantalla.
 * - El objetivo es mantener la app simple (sin dependencias de routing) y clara en privacidad.
 */

import './legalPage.css'

export type LegalRoute = 'privacy' | 'terms'

type Props = {
  route: LegalRoute
  onBack: () => void
}

export function LegalPage({ route, onBack }: Props) {
  const isPrivacy = route === 'privacy'

  return (
    <div className="legalShell">
      <header className="legalHeader">
        <div>
          <h1 className="legalTitle">{isPrivacy ? 'Política de Privacidad' : 'Términos y Condiciones (Políticas de uso)'}</h1>
          <p className="legalSubtitle">
            Vigencia: <strong>{new Date().toISOString().slice(0, 10)}</strong>
          </p>
        </div>
        <button type="button" className="legalBackBtn" onClick={onBack}>
          Volver al escáner
        </button>
      </header>

      <main className="legalContent">
        {isPrivacy ? <PrivacyContent /> : <TermsContent />}
      </main>
    </div>
  )
}

function PrivacyContent() {
  return (
    <section className="legalCard">
      <h2>Resumen (en simple)</h2>
      <ul>
        <li>
          Esta app procesa los archivos de Instagram <strong>en tu navegador</strong>.
        </li>
        <li>
          No pedimos tu contraseña, no hacemos login, y no usamos APIs privadas/scraping.
        </li>
        <li>
          No subimos tus archivos a un servidor (a menos que tú lo implementes/actives en el futuro).
        </li>
      </ul>

      <h2>Qué datos recopilamos</h2>
      <p>
        Por defecto, <strong>no recopilamos</strong> datos personales en un servidor. Los archivos que subes se leen localmente para extraer
        únicamente los <strong>usernames</strong> necesarios para comparar listas.
      </p>

      <h2>Qué datos guardamos</h2>
      <p>
        Actualmente, la app <strong>no necesita</strong> guardar tus listas en la nube. Si en el futuro se agrega almacenamiento local (por ejemplo,
        para recordar el último análisis), será opcional y se aclarará en la interfaz.
      </p>

      <h2>Compartición con terceros</h2>
      <p>No vendemos ni compartimos tus datos con terceros. No usamos herramientas de tracking en este repositorio por defecto.</p>

      <h2>Seguridad</h2>
      <p>
        Aunque el procesamiento es local, recuerda que subir archivos sensibles en cualquier dispositivo implica riesgos (por ejemplo, dispositivos
        compartidos). Recomendamos usar un equipo de confianza y cerrar la pestaña al terminar.
      </p>

      <h2>Afiliación</h2>
      <p>
        Esta herramienta es independiente y <strong>no está afiliada</strong> a Instagram ni a Meta.
      </p>

      <h2>Contacto</h2>
      <p>
        Creador: <strong>Cristian Cano</strong>. Canales oficiales enlazados en el footer del sitio.
      </p>
    </section>
  )
}

function TermsContent() {
  return (
    <section className="legalCard">
      <h2>1. Qué hace esta herramienta</h2>
      <p>
        “Escáner IG” te permite comparar <strong>seguidos</strong> vs <strong>seguidores</strong> usando la <strong>exportación oficial</strong> de
        Instagram (archivos JSON o HTML) y mostrar una lista de cuentas que sigues y no te siguen.
      </p>

      <h2>2. Lo que NO hace</h2>
      <ul>
        <li>No inicia sesión en tu cuenta.</li>
        <li>No automatiza dejar de seguir.</li>
        <li>No usa scraping ni APIs privadas de Instagram.</li>
      </ul>

      <h2>3. Requisitos del usuario</h2>
      <ul>
        <li>Debes obtener tus archivos desde la descarga oficial de Instagram/Meta.</li>
        <li>Eres responsable de revisar lo que haces con la lista (dejar de seguir es una acción manual en Instagram).</li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>
        Te comprometes a usar la herramienta de forma legal y respetando los términos de Instagram/Meta. Esta app solo facilita un análisis local de
        tus datos.
      </p>

      <h2>5. Limitación de responsabilidad</h2>
      <p>
        El creador no se hace responsable por cambios en la exportación de Instagram, errores de compatibilidad, o decisiones que tomes basadas en el
        resultado. La herramienta se ofrece “tal cual”.
      </p>

      <h2>6. Cambios</h2>
      <p>
        Podemos actualizar estos términos/privacidad en el futuro. La fecha de vigencia indica la versión actual.
      </p>
    </section>
  )
}

