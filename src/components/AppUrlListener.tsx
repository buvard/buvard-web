import { useEffect } from 'react'
import { App, type URLOpenListenerEvent } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import {
  parseSetCookieHeader,
  setCapacitorAuthToken,
} from 'better-auth-capacitor/client'
import { authClient } from '@/lib/auth-client'

// Apres un OAuth Better Auth, le back redirige vers
//   `app.buvard[.staging]://fr/feed?cookie=__Secure-better-auth.session_token=...; Max-Age=...; ..., __Secure-better-auth.state=; Max-Age=0; ...`
// Le plugin Capacitor de Better Auth ne consomme PAS ce deep link automatiquement,
// il faut nous-memes parser la query, extraire le session_token, le stocker dans
// `@capacitor/preferences` via setCapacitorAuthToken, puis rafraichir la session
// pour que useSession reflete la connexion.
//
// On gere aussi le cold-start via App.getLaunchUrl() au cas ou Android tue la
// WebView pendant le passage dans la Custom Tab Chrome.

const COOKIE_PREFIX = 'better-auth'
const STORAGE_PREFIX = 'buvard-auth'
const SESSION_TOKEN_COOKIE = '__Secure-better-auth.session_token'
const SESSION_TOKEN_COOKIE_FALLBACK = 'better-auth.session_token'

export function AppUrlListener() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let handle: { remove: () => void } | undefined
    const consumed = new Set<string>()

    async function handleUrl(url: string): Promise<void> {
      console.log('[OAuth] handleUrl', url)
      if (consumed.has(url)) {
        console.log('[OAuth] url deja consommee, skip')
        return
      }
      consumed.add(url)

      // Ferme la Custom Tab si elle est encore au premier plan (best-effort)
      try {
        await Browser.close()
      } catch {
        // ignore
      }

      // Recupere la query du deep link
      let cookieStr: string | null = null
      try {
        cookieStr = new URL(url).searchParams.get('cookie')
      } catch {
        const i = url.indexOf('?')
        if (i >= 0) {
          cookieStr = new URLSearchParams(url.slice(i + 1)).get('cookie')
        }
      }
      console.log('[OAuth] cookieStr', cookieStr)
      if (!cookieStr) {
        console.log('[OAuth] pas de query cookie, skip')
        return
      }

      // Parse le set-cookie compose (cookies separes par virgule)
      // parseSetCookieHeader retourne Map<string, CookieAttributes>
      const parsed = parseSetCookieHeader(cookieStr)
      console.log('[OAuth] parsed keys', Array.from(parsed.keys()))
      const sessionCookie =
        parsed.get(SESSION_TOKEN_COOKIE) ?? parsed.get(SESSION_TOKEN_COOKIE_FALLBACK)
      if (!sessionCookie?.value) {
        console.error('[OAuth] session_token absent du cookie du deep link', cookieStr)
        return
      }
      // La value du cookie est URL-encoded dans la query du deep link (`%3D` etc.).
      // On la decode pour que le bearer envoye au back matche la signature originale.
      const rawValue = sessionCookie.value
      const tokenValue = decodeURIComponent(rawValue)
      console.log(
        '[OAuth] token extrait, longueur',
        tokenValue.length,
        '(brut',
        rawValue.length,
        ')',
      )

      // Stocke le token via le plugin Capacitor (Preferences). Les requetes
      // suivantes vers /api/auth/* l'enverront en Authorization Bearer.
      const maxAge = sessionCookie['max-age']
      const expiresAtMs = maxAge
        ? Date.now() + maxAge * 1000
        : Date.now() + 7 * 24 * 60 * 60 * 1000
      try {
        await setCapacitorAuthToken({
          token: tokenValue,
          expiresAt: new Date(expiresAtMs),
          storagePrefix: STORAGE_PREFIX,
          cookiePrefix: COOKIE_PREFIX,
        })
        console.log('[OAuth] token stocke dans Preferences (prefix:', STORAGE_PREFIX, ')')
      } catch (err) {
        console.error('[OAuth] echec setCapacitorAuthToken', err)
      }

      // Inspection des keys Preferences pour debug
      try {
        const { keys } = await import('@capacitor/preferences').then((m) =>
          m.Preferences.keys(),
        )
        console.log('[OAuth] Preferences keys apres set', keys)
      } catch (err) {
        console.error('[OAuth] echec lecture Preferences', err)
      }

      // Rafraichit la session cote client -> useSession reactif (force le
      // disableCookieCache pour ignorer la valeur stale).
      try {
        const session = await authClient.getSession()
        console.log('[OAuth] getSession apres set', session)
      } catch (err) {
        console.error('[OAuth] echec refetch session apres deep link', err)
      }

      // Full reload pour relancer le routing avec la session active. Le router
      // verra session != null et laissera RequireAuth passer vers le feed.
      console.log('[OAuth] reload vers /')
      window.location.replace('/')
    }

    // Cold-start : app lancee a froid par le deep link, l'event a deja ete emis
    void App.getLaunchUrl().then((res) => {
      if (res?.url) void handleUrl(res.url)
    })

    // Warm : l'app etait deja en background, l'OS ne la tue pas et delivre
    // l'event normalement
    void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      void handleUrl(event.url)
    }).then((h) => {
      handle = h
    })

    return () => {
      handle?.remove()
    }
  }, [])

  return null
}
