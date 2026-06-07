import { useEffect, useState } from 'react'

// Detecte si le user a scrolle plus que `threshold` px depuis le haut de la page.
// Sert a basculer la navbar marketing de transparente -> solide une fois qu'on a
// commence a scroller. Listener passive pour ne pas bloquer le scroll.
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.scrollY > threshold
  })

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
