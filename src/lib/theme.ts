import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'buvard.theme'

function getStored(): Theme {
  if (typeof localStorage === 'undefined') return 'dark'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark'
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function apply(theme: Theme) {
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

// Hook simple : light / dark / system avec persistance localStorage.
// On suit aussi le système quand le mode est "system".
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStored)

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => apply('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function setTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
