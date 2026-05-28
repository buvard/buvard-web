import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/router'
import { AppUrlListener } from '@/components/AppUrlListener'
import { Toaster } from '@/components/ui/sonner'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import '@/i18n/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // On retry pas les 4xx (utilisateur/auth), seulement les vraies erreurs reseau/5xx
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})

// Better Auth est instancie dans src/lib/auth-client.ts.
// En natif, le plugin Capacitor gere la persistence et les deep links OAuth
// automatiquement — pas besoin de <ClerkProvider> ni de <AppUrlListener>.
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <AppUrlListener />
      <Toaster />
      <UpdatePrompt />
    </QueryClientProvider>
  )
}

export default App
