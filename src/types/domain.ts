// Types partagés du domaine Buvard.

export type DrinkType = 'wine' | 'beer' | 'spirit' | 'cocktail' | 'other'

export interface Tasting {
  id: string
  author: {
    name: string
    avatarUrl?: string
  }
  drinkName: string
  type: DrinkType
  rating: number
  place?: string
  notes?: string
  postedAt: string
}
