import type { Currency, TastingPlace, TastingType, Visibility } from '@/types'

// Snapshot du form Add — preserve la saisie quand l'utilisateur quitte /add
// temporairement (ex: "Modifier les photos" -> /add/capture -> /add) ou ferme
// l'onglet par accident.
//
// Persiste en localStorage avec un TTL de 24h. On considere qu'au-dela,
// l'utilisateur a abandonne et on prefere repartir d'un form propre que
// proposer un brouillon vieux d'une semaine.
//
// Reset au submit success uniquement.

export interface AddFormStash {
  type: TastingType
  name: string
  producer: string
  year: string
  rating: number
  price: string
  currency: Currency
  aromas: string[]
  place: TastingPlace | undefined
  notes: string
  visibility: Visibility
}

interface Wrapped {
  v: 1
  savedAt: number
  data: AddFormStash
}

const STORAGE_KEY = 'buvard.add-form-stash'
const TTL_MS = 24 * 60 * 60 * 1000 // 24h

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function getStashedAddForm(): AddFormStash | null {
  if (!isStorageAvailable()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Wrapped
    if (parsed.v !== 1) return null
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

export function setStashedAddForm(next: AddFormStash | null): void {
  if (!isStorageAvailable()) return
  try {
    if (next === null) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    const wrapped: Wrapped = { v: 1, savedAt: Date.now(), data: next }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapped))
  } catch {
    // Storage plein / quota — on ignore silencieusement.
  }
}

export function clearStashedAddForm(): void {
  setStashedAddForm(null)
}
