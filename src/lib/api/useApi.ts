import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'
import { apiRequest } from './client'

// Wrapper qui injecte automatiquement le JWT Clerk dans chaque requête.
// Usage : const api = useApi(); await api<User>('/api/v1/users/me')
export function useApi() {
  const { getToken, isSignedIn } = useAuth()

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
      const token = skipAuth || !isSignedIn ? null : await getToken()
      if (!skipAuth && isSignedIn && !token && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          '[useApi] Clerk getToken() returned null while signed in — backend will reject the call.',
        )
      }
      return apiRequest<T>(path, { ...rest, token })
    },
    [getToken, isSignedIn],
  )
}
