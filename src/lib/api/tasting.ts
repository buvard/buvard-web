import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useSession } from '@/lib/session'
import { useApi } from './useApi'
import { userKeys } from './user'
import type {
  CreateTastingPayload,
  DiscoveredPlace,
  ListDiscoverPlacesParams,
  ListTastingsParams,
  Paginated,
  Tasting,
  UpdateTastingPayload,
} from '@/types'

// ============================================================
// Query keys
// ============================================================
export const tastingKeys = {
  all: ['tasting'] as const,
  feed: (params?: ListTastingsParams) =>
    ['tasting', 'feed', params ?? {}] as const,
  discover: (params?: ListTastingsParams) =>
    ['tasting', 'discover', params ?? {}] as const,
  discoverPlaces: (params?: ListDiscoverPlacesParams) =>
    ['tasting', 'discover', 'places', params ?? {}] as const,
  mine: (params?: ListTastingsParams) =>
    ['tasting', 'mine', params ?? {}] as const,
  byUsername: (username: string, params?: ListTastingsParams) =>
    ['tasting', 'user', username, params ?? {}] as const,
  detail: (id: string) => ['tasting', 'detail', id] as const,
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
// GET /tastings/feed — feed des comptes suivis (auth requise)
// ============================================================
export function useFeed(params: ListTastingsParams = {}) {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  return useInfiniteQuery({
    queryKey: tastingKeys.feed(params),
    queryFn: async ({ pageParam }) => {
      return await api<Paginated<Tasting>>(
        `/api/v1/tastings/feed${qs({ ...params, page: pageParam })}`,
      )
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !isPending && isSignedIn,
    retry: false,
  })
}

// ============================================================
// GET /tastings/discover — exploration (auth optionnelle)
// ============================================================
export function useDiscover(params: ListTastingsParams = {}) {
  const api = useApi()
  return useInfiniteQuery({
    queryKey: tastingKeys.discover(params),
    queryFn: async ({ pageParam }) => {
      return await api<Paginated<Tasting>>(
        `/api/v1/tastings/discover${qs({ ...params, page: pageParam })}`,
      )
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    retry: false,
  })
}

// ============================================================
// GET /tastings/discover/places — lieux pre-agreges (auth requise)
// Onglet "Decouvrir" de la page Map : la grille de cards est rendue a partir
// de cette reponse, plus besoin de grouper en JS.
// ============================================================
export function useDiscoverPlaces(params: ListDiscoverPlacesParams = {}) {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  return useInfiniteQuery({
    queryKey: tastingKeys.discoverPlaces(params),
    queryFn: async ({ pageParam }) => {
      return await api<Paginated<DiscoveredPlace>>(
        `/api/v1/tastings/discover/places${qs({ ...params, page: pageParam })}`,
      )
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !isPending && isSignedIn,
    retry: false,
  })
}

// ============================================================
// GET /tastings — mes degustations
// ============================================================
export function useMyTastings(params: ListTastingsParams = {}) {
  const api = useApi()
  const { data: session, isPending } = useSession()
  const isSignedIn = !!session
  return useQuery({
    queryKey: tastingKeys.mine(params),
    queryFn: async () => {
      return await api<Paginated<Tasting>>(
        `/api/v1/tastings${qs(params)}`,
      )
    },
    enabled: !isPending && isSignedIn,
    retry: false,
  })
}

// ============================================================
// GET /users/:username/tastings — degustations publiques d'un user
// ============================================================
export function useTastingsByUsername(
  username: string | undefined,
  params: ListTastingsParams = {},
) {
  const api = useApi()
  return useQuery({
    queryKey: tastingKeys.byUsername(username ?? '', params),
    queryFn: async () => {
      return await api<Paginated<Tasting>>(
        `/api/v1/users/${username}/tastings${qs(params)}`,
      )
    },
    enabled: !!username,
    retry: false,
  })
}

// ============================================================
// GET /tastings/:id — detail
// ============================================================
export function useTasting(
  id: string | undefined,
  options?: Omit<UseQueryOptions<Tasting>, 'queryKey' | 'queryFn'>,
) {
  const api = useApi()
  return useQuery({
    queryKey: tastingKeys.detail(id ?? ''),
    queryFn: async () => {
      const { tasting } = await api<{ tasting: Tasting }>(
        `/api/v1/tastings/${id}`,
      )
      return tasting
    },
    enabled: !!id,
    retry: false,
    ...options,
  })
}

// ============================================================
// POST /tastings — creer
// ============================================================
export function useCreateTasting() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTastingPayload) => {
      const { tasting } = await api<{ tasting: Tasting }>('/api/v1/tastings', {
        method: 'POST',
        body: payload,
      })
      return tasting
    },
    onSuccess: () => {
      // Invalide tous les listings : mine, feed, discover, by-username (du creator)
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
      // Le back attribue XP + recalcule level + update streak a la creation —
      // invalider me + stats pour que le profil reflete immediatement le gain.
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
    },
  })
}

// ============================================================
// PATCH /tastings/:id — modifier
// ============================================================
export function useUpdateTasting() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTastingPayload
    }) => {
      const { tasting } = await api<{ tasting: Tasting }>(
        `/api/v1/tastings/${id}`,
        { method: 'PATCH', body: payload },
      )
      return tasting
    },
    onSuccess: (tasting) => {
      qc.setQueryData(tastingKeys.detail(tasting.id), tasting)
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// ============================================================
// DELETE /tastings/:id
// ============================================================
export function useDeleteTasting() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api<void>(`/api/v1/tastings/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: tastingKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// ============================================================
// POST /tastings/:id/photos  (multipart, field "file")
// Ajoute UNE photo en fin de tableau. Pour N photos, appeler N fois en sequence.
// ============================================================
export function useAddTastingPhoto() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File | Blob }) => {
      const fd = new FormData()
      // Le serveur ne se sert que du buffer ; un nom symbolique suffit.
      const f = file instanceof File ? file : new File([file], 'photo.jpg', { type: file.type || 'image/jpeg' })
      fd.append('file', f)
      return await api<{ photoUrls: string[] }>(
        `/api/v1/tastings/${id}/photos`,
        { method: 'POST', body: fd },
      )
    },
    onSuccess: ({ photoUrls }, { id }) => {
      qc.setQueryData<Tasting | undefined>(tastingKeys.detail(id), (prev) =>
        prev ? { ...prev, photoUrls } : prev,
      )
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// ============================================================
// DELETE /tastings/:id/photos/:index — retire une photo donnee
// ============================================================
export function useRemoveTastingPhotoAt() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, index }: { id: string; index: number }) => {
      return await api<{ photoUrls: string[] }>(
        `/api/v1/tastings/${id}/photos/${index}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: ({ photoUrls }, { id }) => {
      qc.setQueryData<Tasting | undefined>(tastingKeys.detail(id), (prev) =>
        prev ? { ...prev, photoUrls } : prev,
      )
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// ============================================================
// PATCH /tastings/:id/photos — reordonne les photos (permutation des indices)
// ============================================================
export function useReorderTastingPhotos() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, order }: { id: string; order: number[] }) => {
      return await api<{ photoUrls: string[] }>(
        `/api/v1/tastings/${id}/photos`,
        { method: 'PATCH', body: { order } },
      )
    },
    onSuccess: ({ photoUrls }, { id }) => {
      qc.setQueryData<Tasting | undefined>(tastingKeys.detail(id), (prev) =>
        prev ? { ...prev, photoUrls } : prev,
      )
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// ============================================================
// DELETE /tastings/:id/photos — retire toutes les photos
// ============================================================
export function useRemoveAllTastingPhotos() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api<void>(`/api/v1/tastings/${id}/photos`, { method: 'DELETE' })
      return id
    },
    onSuccess: (id) => {
      qc.setQueryData<Tasting | undefined>(tastingKeys.detail(id), (prev) =>
        prev ? { ...prev, photoUrls: [] } : prev,
      )
      void qc.invalidateQueries({ queryKey: tastingKeys.all })
    },
  })
}

// Helpers pour les pages qui consomment un infinite query
export function flattenPages(
  data: InfiniteData<Paginated<Tasting>> | undefined,
): Tasting[] {
  return data?.pages.flatMap((p) => p.data) ?? []
}

// ============================================================
// Likes
// ============================================================

// Balaye tous les caches tasting (detail, feed, discover, mine, byUsername)
// et applique une transformation sur le tasting matching `id` (s'il est present).
// Utilise pour les updates optimistic de like/unlike — ainsi le coeur change
// instantanement dans toutes les vues qui affichent ce tasting.
function patchTastingInAllCaches(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: (t: Tasting) => Tasting,
): void {
  // Detail direct
  qc.setQueryData<Tasting | undefined>(tastingKeys.detail(id), (prev) =>
    prev ? patch(prev) : prev,
  )
  // Listings (paginated simple et infinite)
  qc.getQueriesData<Paginated<Tasting> | InfiniteData<Paginated<Tasting>>>({
    queryKey: tastingKeys.all,
  }).forEach(([key, data]) => {
    if (!data) return
    if ('pages' in data) {
      qc.setQueryData(key, {
        ...data,
        pages: data.pages.map((p) => ({
          ...p,
          data: p.data.map((t) => (t.id === id ? patch(t) : t)),
        })),
      })
    } else if ('data' in data) {
      qc.setQueryData(key, {
        ...data,
        data: data.data.map((t) => (t.id === id ? patch(t) : t)),
      })
    }
  })
}

// POST /tastings/:id/like — idempotent. Optimistic update.
export function useLikeTasting() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return await api<{ liked: true; likesCount: number }>(
        `/api/v1/tastings/${id}/like`,
        { method: 'POST' },
      )
    },
    onMutate: (id) => {
      patchTastingInAllCaches(qc, id, (t) =>
        t.isLikedByMe ? t : { ...t, isLikedByMe: true, likesCount: t.likesCount + 1 },
      )
    },
    onError: (_err, id) => {
      // Rollback simple : on remet l'inverse. Pas 100% safe en cas d'etat
      // intermediaire mais suffit pour V1.
      patchTastingInAllCaches(qc, id, (t) =>
        t.isLikedByMe ? { ...t, isLikedByMe: false, likesCount: Math.max(0, t.likesCount - 1) } : t,
      )
    },
    onSuccess: ({ likesCount }, id) => {
      // Sync avec le vrai compteur serveur (corrige les races eventuelles).
      patchTastingInAllCaches(qc, id, (t) => ({ ...t, isLikedByMe: true, likesCount }))
    },
  })
}

// GET /tastings/:id/likes — liste paginee des users qui ont like.
export interface Liker {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  likedAt: string
}

export function useTastingLikers(id: string | undefined, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['tasting', 'likes', id ?? ''],
    queryFn: async () => {
      return await api<Paginated<Liker>>(`/api/v1/tastings/${id}/likes`)
    },
    enabled: !!id && enabled,
    retry: false,
  })
}

// DELETE /tastings/:id/like — idempotent.
export function useUnlikeTasting() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return await api<{ liked: false; likesCount: number }>(
        `/api/v1/tastings/${id}/like`,
        { method: 'DELETE' },
      )
    },
    onMutate: (id) => {
      patchTastingInAllCaches(qc, id, (t) =>
        t.isLikedByMe ? { ...t, isLikedByMe: false, likesCount: Math.max(0, t.likesCount - 1) } : t,
      )
    },
    onError: (_err, id) => {
      patchTastingInAllCaches(qc, id, (t) =>
        t.isLikedByMe ? t : { ...t, isLikedByMe: true, likesCount: t.likesCount + 1 },
      )
    },
    onSuccess: ({ likesCount }, id) => {
      patchTastingInAllCaches(qc, id, (t) => ({ ...t, isLikedByMe: false, likesCount }))
    },
  })
}
