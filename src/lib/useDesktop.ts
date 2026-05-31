import { useEffect, useState } from 'react'

// Hook media query : retourne true si le viewport est >= breakpoint lg Tailwind (1024px).
// Sert a switcher l'UX entre mobile (route fullscreen) et desktop (modal/popup).
// Mis a jour en live quand l'utilisateur resize la window.
export function useDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(min-width: 1024px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}
