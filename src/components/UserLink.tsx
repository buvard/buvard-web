import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

// Lien centralisé vers un profil public (/u/:username).
// Source unique de la navigation profil : si la route change, on ne touche qu'ici.
// Le username est lowercase (cohérent avec la résolution back, match exact en DB).
export function UserLink({
  username,
  className,
  children,
  onClick,
}: {
  username: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  const localizedPath = useLocalizedPath()
  return (
    <Link
      to={localizedPath(`/u/${username.toLowerCase()}`)}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
