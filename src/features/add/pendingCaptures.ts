import type { Capture } from './CameraCapture'

// Stash local module-level pour passer un lot de captures entre les pages /add
// et /add/capture sans serializer cross-route. Pattern volontairement minimal :
// un seul transfert en attente max, consume au mount de la page destinataire.
// - Capture -> Add  : push au "Done" via setPendingCaptures.
// - Add     -> Capture : push au "Modifier" via setPendingCaptures (seed initial).
let pendingCaptures: Capture[] | null = null

export function setPendingCaptures(c: Capture[] | null): void {
  pendingCaptures = c
}

export function consumePendingCaptures(): Capture[] | null {
  const p = pendingCaptures
  pendingCaptures = null
  return p
}
