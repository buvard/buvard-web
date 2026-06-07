import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useSession } from '@/lib/session'
import { useApi } from './useApi'
import type {
  ListQueryParams,
  MeStats,
  Paginated,
  PublicUser,
  SearchUser,
  UpdateMePayload,
  UpdatePrefsPayload,
  User,
  UserMini,
  UserPrefs,
} from '@/types'

// ============================================================
// Query keys
// ============================================================
export const userKeys = {
  me: ['user', 'me'] as const,
  prefs: ['user', 'me', 'prefs'] as const,
  stats: ['user', 'me', 'stats'] as const,
  blocks: (params?: ListQueryParams) =>
    ['user', 'me', 'blocks', params ?? {}] as const,
  public: (username: string) => ['user', 'public', username] as const,
  followers: (username: string, params?: ListQueryParams) =>
    ['user', 'public', username, 'followers', params ?? {}] as const,
  following: (username: string, params?: ListQueryParams) =>
    ['user', 'public', username, 'following', params ?? {}] as const,
  search: (q: string) => ['user', 'search', q] as const,
}

function qs(params?: object) {
  if (!params) return ''
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (entries.length === 0) return ''
  return `?${entries
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')}`
}

// ============================================================
// GET /me
// ============================================================
export function useMe(
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  const isLoaded = !isPending
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const { user } = await api<{ user: User }>('/api/v1/users/me')
      return user
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 60_000,
    retry: false,
    ...options,
  })
}

// ============================================================
// PATCH /me
// ============================================================
export function useUpdateMe() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateMePayload) => {
      const { user } = await api<{ user: User }>('/api/v1/users/me', {
        method: 'PATCH',
        body: payload,
      })
      return user
    },
    onSuccess: (user) => {
      qc.setQueryData(userKeys.me, user)
    },
  })
}

// ============================================================
// PATCH /me/grade — selection du grade d'affichage (parmi debloque)
// ============================================================
export function useSetDisplayGrade() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    // `key` = cle du grade a afficher, ou null pour revenir a l'auto.
    mutationFn: async (key: string | null) => {
      const { user } = await api<{ user: User }>('/api/v1/users/me/grade', {
        method: 'PATCH',
        body: { key },
      })
      return user
    },
    onSuccess: (user) => {
      qc.setQueryData(userKeys.me, user)
      // Stats embarque aussi gamification — invalide pour resync sur la
      // page Levels (qui lit me.gamification mais aussi via /me/stats).
      void qc.invalidateQueries({ queryKey: userKeys.stats })
    },
  })
}

// ============================================================
// DELETE /me
// ============================================================
export function useDeleteMe() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api<void>('/api/v1/users/me', { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.clear()
    },
  })
}

// ============================================================
// GET /me/prefs
// ============================================================
export function usePrefs() {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  const isLoaded = !isPending
  return useQuery({
    queryKey: userKeys.prefs,
    queryFn: async () => {
      const { prefs } = await api<{ prefs: UserPrefs }>(
        '/api/v1/users/me/prefs',
      )
      return prefs
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 60_000,
    retry: false,
  })
}

// ============================================================
// PATCH /me/prefs
// ============================================================
export function useUpdatePrefs() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdatePrefsPayload) => {
      const { prefs } = await api<{ prefs: UserPrefs }>(
        '/api/v1/users/me/prefs',
        { method: 'PATCH', body: payload },
      )
      return prefs
    },
    onSuccess: (prefs) => {
      qc.setQueryData(userKeys.prefs, prefs)
    },
  })
}

// ============================================================
// GET /me/stats
// ============================================================
export function useStats() {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  const isLoaded = !isPending
  return useQuery({
    queryKey: userKeys.stats,
    queryFn: async () => {
      const { stats } = await api<{ stats: MeStats }>(
        '/api/v1/users/me/stats',
      )
      return stats
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 30_000,
    retry: false,
  })
}

// ============================================================
// POST /me/avatar  (multipart, field "file")
// ============================================================
export function useUploadAvatar() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return await api<{ avatarUrl: string }>('/api/v1/users/me/avatar', {
        method: 'POST',
        body: fd,
      })
    },
    onSuccess: ({ avatarUrl }) => {
      // Patch optimiste sur le cache /me
      qc.setQueryData<User | undefined>(userKeys.me, (prev) =>
        prev ? { ...prev, avatarUrl } : prev,
      )
    },
  })
}

// ============================================================
// DELETE /me/avatar
// ============================================================
export function useDeleteAvatar() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api<void>('/api/v1/users/me/avatar', { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.setQueryData<User | undefined>(userKeys.me, (prev) =>
        prev ? { ...prev, avatarUrl: undefined } : prev,
      )
    },
  })
}

// ============================================================
// POST /me/cover  (multipart, field "file")
// ============================================================
export function useUploadCover() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return await api<{ coverUrl: string }>('/api/v1/users/me/cover', {
        method: 'POST',
        body: fd,
      })
    },
    onSuccess: ({ coverUrl }) => {
      qc.setQueryData<User | undefined>(userKeys.me, (prev) =>
        prev ? { ...prev, coverUrl } : prev,
      )
    },
  })
}

// ============================================================
// DELETE /me/cover
// ============================================================
export function useDeleteCover() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api<void>('/api/v1/users/me/cover', { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.setQueryData<User | undefined>(userKeys.me, (prev) =>
        prev ? { ...prev, coverUrl: undefined } : prev,
      )
    },
  })
}

// ============================================================
// POST /me/complete-onboarding
// ============================================================
export function useCompleteOnboarding() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return await api<{ onboardingCompletedAt: string }>(
        '/api/v1/users/me/complete-onboarding',
        { method: 'POST' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.me })
    },
  })
}

// ============================================================
// POST /me/accept-terms
// ============================================================
export function useAcceptTerms() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return await api<{ acceptedTermsAt: string }>(
        '/api/v1/users/me/accept-terms',
        { method: 'POST' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.me })
    },
  })
}

// ============================================================
// POST /me/accept-privacy
// ============================================================
export function useAcceptPrivacy() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return await api<{ acceptedPrivacyAt: string }>(
        '/api/v1/users/me/accept-privacy',
        { method: 'POST' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.me })
    },
  })
}

// ============================================================
// GET /me/blocks
// ============================================================
export function useBlocks(params: ListQueryParams = {}) {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  const isLoaded = !isPending
  return useQuery({
    queryKey: userKeys.blocks(params),
    queryFn: async () => {
      return await api<Paginated<UserMini>>(
        `/api/v1/users/me/blocks${qs(params)}`,
      )
    },
    enabled: isLoaded && isSignedIn,
    retry: false,
  })
}

// ============================================================
// POST/DELETE /:username/follow
// ============================================================
export function useFollow() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      await api<void>(`/api/v1/users/${username}/follow`, { method: 'POST' })
    },
    onSuccess: (_, username) => {
      void qc.invalidateQueries({ queryKey: userKeys.public(username) })
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      void qc.invalidateQueries({
        queryKey: ['user', 'public', username, 'followers'],
      })
    },
  })
}

export function useUnfollow() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      await api<void>(`/api/v1/users/${username}/follow`, { method: 'DELETE' })
    },
    onSuccess: (_, username) => {
      void qc.invalidateQueries({ queryKey: userKeys.public(username) })
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      void qc.invalidateQueries({
        queryKey: ['user', 'public', username, 'followers'],
      })
    },
  })
}

// ============================================================
// POST/DELETE /:username/block
// ============================================================
export function useBlock() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      await api<void>(`/api/v1/users/${username}/block`, { method: 'POST' })
    },
    onSuccess: (_, username) => {
      // Block coupe le follow dans les 2 sens — on invalide large
      void qc.invalidateQueries({ queryKey: userKeys.public(username) })
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      void qc.invalidateQueries({ queryKey: ['user', 'me', 'blocks'] })
      void qc.invalidateQueries({ queryKey: ['user', 'public'] })
    },
  })
}

export function useUnblock() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      await api<void>(`/api/v1/users/${username}/block`, { method: 'DELETE' })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user', 'me', 'blocks'] })
      void qc.invalidateQueries({ queryKey: ['user', 'public'] })
    },
  })
}

// ============================================================
// GET /:username (profil public)
// ============================================================
export function usePublicUser(username: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: userKeys.public(username ?? ''),
    queryFn: async () => {
      const { user } = await api<{ user: PublicUser }>(
        `/api/v1/users/${username}`,
      )
      return user
    },
    enabled: !!username,
    staleTime: 60_000,
    retry: false,
  })
}

// ============================================================
// GET /:username/followers
// ============================================================
export function usePublicFollowers(
  username: string | undefined,
  params: ListQueryParams = {},
) {
  const api = useApi()
  return useQuery({
    queryKey: userKeys.followers(username ?? '', params),
    queryFn: async () => {
      return await api<Paginated<UserMini>>(
        `/api/v1/users/${username}/followers${qs(params)}`,
        { skipAuth: true },
      )
    },
    enabled: !!username,
    retry: false,
  })
}

// ============================================================
// GET /:username/following
// ============================================================
export function usePublicFollowing(
  username: string | undefined,
  params: ListQueryParams = {},
) {
  const api = useApi()
  return useQuery({
    queryKey: userKeys.following(username ?? '', params),
    queryFn: async () => {
      return await api<Paginated<UserMini>>(
        `/api/v1/users/${username}/following${qs(params)}`,
        { skipAuth: true },
      )
    },
    enabled: !!username,
    retry: false,
  })
}

// ============================================================
// GET /users/search?q=
// ============================================================
export function useSearchUsers(query: string) {
  const api = useApi()
  const q = query.trim()
  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: async () => {
      const res = await api<{ data: SearchUser[] }>(
        `/api/v1/users/search${qs({ q })}`,
      )
      return res.data
    },
    // On ne lance la recherche qu'à partir de 2 caractères
    enabled: q.length >= 2,
    staleTime: 30_000,
    retry: false,
  })
}
