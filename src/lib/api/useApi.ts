import { useCallback } from 'react'
import { getNativeAuthToken, useSession } from '@/lib/auth-client'
import { apiRequest } from './client'

// Wrapper qui injecte automatiquement l'auth dans chaque requete.
//   - Web    : cookies Better Auth (envoyes via credentials: 'include' dans apiRequest)
//   - Natif  : Authorization Bearer recupere via le plugin Capacitor Better Auth
// Usage : const api = useApi(); await api<User>('/api/v1/users/me')
export function useApi() {
  const { data: session } = useSession()
  const isSignedIn = !!session

  return useCallback(
    async <T>(
      path: string,
      options: {
        method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
        body?: unknown
        signal?: AbortSignal
        skipAuth?: boolean
      } = {},
    ): Promise<T> => {
      const { skipAuth, ...rest } = options
      // En web le token est null (les cookies prennent le relais via apiRequest).
      // En natif on recupere le bearer depuis @capacitor/preferences.
      const token = skipAuth || !isSignedIn ? null : await getNativeAuthToken()
      return apiRequest<T>(path, { ...rest, token })
    },
    [isSignedIn],
  )
}
