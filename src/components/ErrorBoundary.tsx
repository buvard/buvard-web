import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

// Boundary de dernier recours — capture les erreurs runtime React qui
// remonteraient sinon en ecran blanc. Affiche un message simple + bouton
// Recharger. Hardcode FR : c'est un fallback critique, on n'a pas le luxe
// d'attendre i18next (qui peut etre lui-meme la source du crash).
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Log crash pour Sentry futur
    console.error('[ErrorBoundary] crash', error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Oups, quelque chose a planté.
          </h1>
          <p className="text-sm text-muted-foreground">
            Une erreur inattendue est survenue. Recharger l'application devrait régler ça.
          </p>
          {this.state.error?.message && (
            <pre className="rounded-md border border-border bg-card/40 p-3 text-left text-[11px] text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Recharger
          </button>
        </div>
      </div>
    )
  }
}
