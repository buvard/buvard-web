import { useQuery } from '@tanstack/react-query'
import { useApi } from './useApi'
import type { Grade } from '@/types'

// Liste des grades (paliers de progression). Donnee stable, change rarement
// (admin / dev) — on cache aggressivement (staleTime 30min).
export const gradeKeys = {
  all: ['grade'] as const,
  list: () => ['grade', 'list'] as const,
}

export function useGrades() {
  const api = useApi()
  return useQuery({
    queryKey: gradeKeys.list(),
    queryFn: async () => {
      const res = await api<{ data: Grade[] }>('/api/v1/grades')
      // Defense : si le back renvoie pas trie, on trie cote front.
      return [...res.data].sort((a, b) => a.order - b.order)
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  })
}

// Helper pur — utilise par les pages Levels / LevelPopover quand on a deja
// la liste. Retourne le grade qui couvre `level`, fallback sur le dernier
// si level > max.
export function findGradeForLevel(grades: Grade[], level: number): Grade | undefined {
  if (grades.length === 0) return undefined
  const match = grades.find((g) => level >= g.minLevel && level <= g.maxLevel)
  return match ?? grades[grades.length - 1]
}
