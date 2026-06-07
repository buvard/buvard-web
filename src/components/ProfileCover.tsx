// Cover photo profil — si coverUrl fourni on l'affiche, sinon dégradé bordeaux signature.
// Hauteur responsive, image cover/center.
interface Props {
  coverUrl?: string | null
  className?: string
}

export function ProfileCover({ coverUrl, className }: Props) {
  if (coverUrl) {
    return (
      <div
        className={`h-32 w-full overflow-hidden sm:h-40 ${className ?? ''}`}
        style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    )
  }
  // Fallback : dégradé bordeaux signature qui s'estompe vers le fond
  return (
    <div
      className={`h-32 w-full overflow-hidden sm:h-40 ${className ?? ''}`}
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 30% 0%, rgb(139 38 53 / 0.55), transparent 70%), radial-gradient(ellipse 100% 80% at 90% 100%, rgb(139 38 53 / 0.25), transparent 70%), linear-gradient(to bottom, rgb(40 14 18 / 0.6), transparent)',
      }}
    />
  )
}
