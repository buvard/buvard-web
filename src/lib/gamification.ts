// Miroir des constantes / formules de gamification du back (user.service.ts).
// Garder synchro a la main : si le back change ces valeurs, mettre a jour ici.

// Base et bonus a la creation d'une degustation
export const XP_PER_TASTING = 10
export const XP_BONUS_PLACE = 5
export const XP_BONUS_LONG_NOTES = 5
export const XP_BONUS_AROMAS = 3
export const XP_PER_PHOTO_ADDITIONAL = 2
// Engagement recu (passif)
export const XP_PER_LIKE_RECEIVED = 1
export const XP_PER_FOLLOWER = 5
// Milestones one-shot
export const XP_FIRST_TASTING = 25
export const XP_FIRST_FOLLOWER = 20
export const XP_ONBOARDING = 50
export const XP_PROFILE_COMPLETE = 25
export const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  30: 200,
  100: 1000,
}

// --- Grades par tranche de niveau ---
// Les grades sont desormais fetched depuis le back via `useGrades` (hook
// react-query). Cf src/lib/api/grade.ts pour le hook et findGradeForLevel
// pour le helper de lookup. On garde juste MAX_LEVEL ici car constant et
// pratique pour les helpers purs (xpProgress edge cases).
export const MAX_LEVEL = 100

// Threshold d'XP pour atteindre `level` (level 1 commence a 0 XP).
// Formule back : level = floor(sqrt(xp / 100)) + 1
// => XP requis pour level L = (L - 1)² × 100
export function xpThresholdForLevel(level: number): number {
  return Math.max(0, (level - 1) ** 2 * 100)
}

// Progression dans le level courant.
// inLevel : XP acquise dans le palier en cours
// span    : XP totale necessaire pour passer au level suivant
// progress: ratio 0..1 (utile pour piloter une barre)
export function xpProgress(
  xp: number,
  level: number,
): { inLevel: number; span: number; nextThreshold: number; progress: number } {
  const currentThreshold = xpThresholdForLevel(level)
  const nextThreshold = xpThresholdForLevel(level + 1)
  const inLevel = Math.max(0, xp - currentThreshold)
  const span = Math.max(1, nextThreshold - currentThreshold)
  return {
    inLevel,
    span,
    nextThreshold,
    progress: Math.min(1, inLevel / span),
  }
}
