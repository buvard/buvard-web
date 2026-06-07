import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './useApi'
import { userKeys } from './user'

// ============================================================
// Types
// ============================================================

export type RedemptionType = 'pochtron'

export interface AdminCode {
  id: string
  code: string
  type: RedemptionType
  maxUses: number | null
  usedCount: number
  usedBy: string[]
  expiresAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateCodeInput {
  code?: string
  type: RedemptionType
  maxUses: number | null
  expiresAt: string | null
}

export interface XpSnapshot {
  userId: string
  xp: number
  level: number
  grade: string
}

// ============================================================
// Query keys
// ============================================================
export const adminKeys = {
  all: ['admin'] as const,
  codes: ['admin', 'codes'] as const,
}

// ============================================================
// GET /admin/codes
// ============================================================
export function useAdminListCodes() {
  const api = useApi()
  return useQuery({
    queryKey: adminKeys.codes,
    queryFn: async () => {
      const res = await api<{ data: AdminCode[] }>('/api/v1/admin/codes')
      return res.data
    },
    retry: false,
  })
}

// ============================================================
// POST /admin/codes — cree un code
// ============================================================
export function useCreateCode() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCodeInput) => {
      const res = await api<{ code: AdminCode }>('/api/v1/admin/codes', {
        method: 'POST',
        body: input,
      })
      return res.code
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.codes })
    },
  })
}

// ============================================================
// DELETE /admin/codes/:id
// ============================================================
export function useDeleteCode() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api<void>(`/api/v1/admin/codes/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.codes })
    },
  })
}

// ============================================================
// POST /admin/users/:id/xp { delta } — ajuste l'XP (positif ou negatif)
// ============================================================
export function useAdminAdjustXp() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, delta }: { userId: string; delta: number }) => {
      return await api<XpSnapshot>(`/api/v1/admin/users/${userId}/xp`, {
        method: 'POST',
        body: { delta },
      })
    },
    onSuccess: (_data, vars) => {
      // Le user cible peut etre l'admin lui-meme — invalide aussi /me.
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      // Pas de cache user-by-id general (on n'a pas ce hook), juste invalidate me.
      void qc.invalidateQueries({ queryKey: ['admin', 'user', vars.userId] })
    },
  })
}

// ============================================================
// PUT /admin/users/:id/xp { xp } — set absolu
// ============================================================
export function useAdminSetXp() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, xp }: { userId: string; xp: number }) => {
      return await api<XpSnapshot>(`/api/v1/admin/users/${userId}/xp`, {
        method: 'PUT',
        body: { xp },
      })
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      void qc.invalidateQueries({ queryKey: ['admin', 'user', vars.userId] })
    },
  })
}

// ============================================================
// DELETE /admin/users/:id/xp — reset a 0
// ============================================================
export function useAdminResetXp() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      return await api<XpSnapshot>(`/api/v1/admin/users/${userId}/xp`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_data, userId) => {
      void qc.invalidateQueries({ queryKey: userKeys.me })
      void qc.invalidateQueries({ queryKey: userKeys.stats })
      void qc.invalidateQueries({ queryKey: ['admin', 'user', userId] })
    },
  })
}
