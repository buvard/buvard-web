import { RouterProvider } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import '@/i18n/config'

// Clé publique Clerk — exposée côté client, c'est attendu.
function getClerkKey(): string {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
  if (!key) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local')
  }
  return key
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // On retry pas les 4xx (utilisateur/auth), seulement les vraies erreurs réseau/5xx
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <ClerkProvider publishableKey={getClerkKey()} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
        <UpdatePrompt />
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App
