import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { checkForUpdate, notifyAppReady } from '@/lib/live-update'

// Buvard démarre en dark par défaut — c'est le mood de l'app.
// L'utilisateur peut basculer via les Réglages (clair / sombre / système).
function initTheme() {
  const stored = localStorage.getItem('buvard.theme')
  const theme =
    stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'dark'
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Live updates — uniquement actif sur les plateformes natives (iOS/Android).
// notifyAppReady() doit être appelé tôt sinon Capgo rollback automatiquement.
// checkForUpdate() fait son travail en arrière-plan, sans bloquer le rendu.
void notifyAppReady()
void checkForUpdate()
