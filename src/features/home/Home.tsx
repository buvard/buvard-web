import { lazy, Suspense } from 'react'
import { isAppShell } from '@/lib/platform'

// Aiguilleur de home selon la cible d'execution :
// - navigateur web        -> HomeWeb  (landing marketing)
// - app installee (natif/Electron) -> HomeApp (acces direct / auth epuree)
//
// Les deux variantes restent lazy-loadees : un shell donne ne telecharge que la
// home qui le concerne.
const HomeWeb = lazy(async () => ({ default: (await import('./HomeWeb')).HomeWeb }))
const HomeApp = lazy(async () => ({ default: (await import('./HomeApp')).HomeApp }))

export function HomePage() {
  const Home = isAppShell() ? HomeApp : HomeWeb
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
