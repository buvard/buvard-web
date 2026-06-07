import { Capacitor } from '@capacitor/core'
import { createAuthClient } from 'better-auth/react'
import { capacitorClient, getCapacitorAuthToken } from 'better-auth-capacitor/client'

// Client Better Auth — un seul export pour toute l'app.
//
// Choix techniques :
// - En natif (Capacitor), on active le plugin `capacitorClient` qui stocke la
//   session via @capacitor/preferences et envoie l'Authorization Bearer au lieu
//   de cookies. Necessaire car la WebView Capacitor (https://localhost) n'a pas
//   les cookies first-party du domaine API.
// - `disableDefaultFetchPlugins` en natif : sinon le redirectPlugin de
//   better-auth ouvrirait Safari/Chrome sur les redirections OAuth, alors qu'on
//   veut tout dans l'app via le deep link.
// - Le scheme est lu depuis VITE_APP_SCHEME (.env.staging / .env.production).
//   On a privilegie une variable d'env plutot que `App.getInfo()` parce que le
//   client est instancie au module-load, et lire le bundleId est async.

const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
if (!baseURL) throw new Error('Missing VITE_API_URL in .env.local')

// Scheme deep link (ex: "app.buvard" ou "app.buvard.staging"). Optionnel en web.
const scheme = import.meta.env.VITE_APP_SCHEME as string | undefined

const isNative = Capacitor.isNativePlatform()

export const authClient = createAuthClient({
  baseURL,
  plugins: isNative
    ? [
        capacitorClient({
          scheme,
          storagePrefix: 'buvard-auth',
        }),
      ]
    : [],
  // Desactive les fetch plugins par defaut (notamment redirectPlugin) en natif.
  disableDefaultFetchPlugins: isNative,
})

// Hooks et actions re-exportes pour des imports plus courts dans les composants.
export const { useSession, signIn, signUp, signOut } = authClient

// Recupere le bearer token stocke par le plugin Capacitor.
// Renvoie null en web (les cookies prennent le relais) ou si pas de session.
export async function getNativeAuthToken(): Promise<string | null> {
  if (!isNative) return null
  return getCapacitorAuthToken({ storagePrefix: 'buvard-auth' })
}
