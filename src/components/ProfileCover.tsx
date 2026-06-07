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
  // Fallback : degrade bordeaux signature qui s'estompe vers le fond.
  // 2 radials bordeaux semi-transparents — fonctionne sur fond clair ET sombre
  // (le 3eme calque linear-gradient sombre a ete retire car illisible en light).
  return (
    <div
      className={`h-32 w-full overflow-hidden bg-card sm:h-40 ${className ?? ''}`}
      style={{
        // backgroundImage (et pas background tout court) pour preserver le
        // bg-card de la classe Tailwind qui sert de couleur de base.
        backgroundImage:
          'radial-gradient(ellipse 120% 80% at 30% 0%, rgb(139 38 53 / 0.55), transparent 70%), radial-gradient(ellipse 100% 80% at 90% 100%, rgb(139 38 53 / 0.28), transparent 70%)',
      }}
    />
  )
}
