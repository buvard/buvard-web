import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { isAppShell } from '@/lib/platform'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { WebNavbar } from './WebNavbar'
import { WebFooter } from './WebFooter'

// Layout pour les pages publiques marketing (Features, Download, About, Legal).
// - Bloque l'acces depuis le shell app (Capacitor/Electron) en redirigeant vers
//   la home : ces pages n'existent que cote web marketing.
// - Garantit la presence de la WebNavbar + WebFooter quel que soit l'etat
//   d'authentification (un user connecte peut consulter /features depuis le web).
export function MarketingLayout() {
  const localizedPath = useLocalizedPath()
  if (isAppShell()) return <Navigate to={localizedPath('/')} replace />

  return (
    <div className="flex min-h-full flex-col">
      <WebNavbar />
      <main className="flex-1 px-5">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <WebFooter />
    </div>
  )
}
