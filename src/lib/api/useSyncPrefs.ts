import { useEffect } from 'react'
import { usePrefs } from './user'
import { useTheme } from '@/lib/theme'

const LOCAL_THEME_KEY = 'buvard.theme'

// Synchronise les prefs backend vers le thème local.
// Stratégie : si l'utilisateur n'a jamais touché au thème localement (pas de clé),
// on applique celui du backend. Sinon on respecte le choix local
// (le user a choisi explicitement sur ce device, on ne le surcharge pas).
export function useSyncPrefs() {
  const prefs = usePrefs()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (!prefs.data) return
    const hasLocal = !!localStorage.getItem(LOCAL_THEME_KEY)
    if (!hasLocal) {
      setTheme(prefs.data.theme)
    }
  }, [prefs.data, setTheme])
}
