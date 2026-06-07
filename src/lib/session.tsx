import { createContext, useContext, type ReactNode } from 'react'
import { useSession as useBetterAuthSession } from './auth-client'

// Better Auth expose useSession comme un hook nanostores — chaque appel
// s'abonne au store et peut declencher un fetch /api/auth/get-session au
// premier mount du subscriber. Avec 15+ consommateurs (hooks API + RequireAuth
// + AppLayout + HomeApp + LikeButton + ...), on voit autant de get-session
// dans le network tab au boot.
//
// Pour rester sur UN seul subscriber, on rend useBetterAuthSession dans un
// Provider unique en haut de l'app, puis on expose un useSession custom qui
// lit la valeur via Context. Tous les consommateurs partagent la meme valeur
// sans relancer de fetch.

type SessionState = ReturnType<typeof useBetterAuthSession>

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  // Le seul subscriber au store better-auth de toute l'app.
  const session = useBetterAuthSession()
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  )
}

// Hook a utiliser partout dans l'app a la place du useSession de better-auth.
// Throw si appele hors du Provider — defensif, revele les oublis de wrap.
// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (ctx === null) {
    throw new Error('useSession() doit etre utilise dans <SessionProvider>')
  }
  return ctx
}
