/**
 * Error boundary simple para evitar "pantalla en blanco" ante errores runtime.
 *
 * Relación con otros archivos:
 * - Se usa desde `src/main.tsx` envolviendo `<App />`.
 *
 * Nota:
 * - En producción conviene mostrar un mensaje amable y una acción para volver al inicio.
 */

import type { ReactNode } from 'react'
import { Component } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return { hasError: true, message: msg }
  }

  componentDidCatch(error: unknown) {
    // Evitamos logs con datos sensibles: esto solo reporta el error técnico.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturó un error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ margin: 0 }}>Ups, algo salió mal</h1>
          <p style={{ opacity: 0.85 }}>
            Si estabas abriendo “Privacidad” o “Términos”, recarga la página. Si persiste, avísanos al creador.
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {this.state.message}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                window.location.reload()
              }}
            >
              Recargar
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

