// Types miroir du backend Buvard — source de vérité : /api/v1/users.

export const TASTING_TYPES = [
  'wine',
  'beer',
  'spirit',
  'cocktail',
  'other',
] as const
export type TastingType = (typeof TASTING_TYPES)[number]

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'fr' | 'en'
export type Units = 'metric' | 'imperial'
export type Currency = 'EUR' | 'USD' | 'GBP'

export type UserRole = 'user' | 'moderator' | 'admin'
export type UserStatus = 'active' | 'suspended' | 'banned'

export interface UserLocation {
  country?: string
  city?: string
}

export interface UserPrefs {
  theme: Theme
  language: Language
  units: Units
  currency: Currency
  notifications: {
    push: boolean
    email: boolean
    friendActivity: boolean
    newFollower: boolean
    tastingLiked: boolean
    tastingCommented: boolean
  }
  privacy: {
    profilePublic: boolean
    showRatings: boolean
    searchable: boolean
    showLocation: boolean
  }
}

export interface Gamification {
  xp: number
  level: number
  streak: {
    current: number
    longest: number
    lastActiveAt: string | null
  }
}

export interface UserStatsFull {
  tastingsCount: number
  tastingsByCategory: Record<TastingType, number>
  followersCount: number
  followingCount: number
}

// GET /me/stats — réponse étendue (versus stats embarqués dans User)
export interface MeStats extends UserStatsFull {
  gamification: Gamification
  joinDate: string
}

export interface User {
  id: string
  clerkId: string
  username: string
  displayName?: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  location?: UserLocation
  birthYear?: number
  favoriteCategories: TastingType[]
  role: UserRole
  status: UserStatus
  suspendedUntil: string | null
  verified: boolean
  verifiedAt: string | null
  lastSeenAt: string
  onboardingCompletedAt: string | null
  gamification: Gamification
  stats: UserStatsFull
  prefs: UserPrefs
  acceptedTermsAt: string | null
  acceptedPrivacyAt: string | null
  reportsReceivedCount: number
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  // location absente si showLocation === false côté backend
  location?: UserLocation
  favoriteCategories: TastingType[]
  verified: boolean
  role: UserRole
  stats: {
    tastingsCount: number
    followersCount: number
    followingCount: number
  }
  gamification: {
    level: number
    xp: number
  }
  joinDate: string
  // Relation du viewer connecté (présents seulement si authentifié & pas soi-même)
  isFollowing?: boolean
  isBlocked?: boolean
}

export interface UserMini {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

// Résultat de GET /users/search
export interface SearchUser {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  verified: boolean
}

// ---- Pagination ----
export interface Paginated<T> {
  data: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// ---- DTO de mise à jour ----

export interface UpdateMePayload {
  username?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  location?: UserLocation
  birthYear?: number
  favoriteCategories?: TastingType[]
}

export interface UpdatePrefsPayload {
  theme?: Theme
  language?: Language
  units?: Units
  currency?: Currency
  notifications?: Partial<UserPrefs['notifications']>
  privacy?: Partial<UserPrefs['privacy']>
}

export interface ListQueryParams {
  page?: number
  limit?: number
}
