import { useParams } from 'react-router-dom'
import { DEFAULT_LOCALE, isLocale } from './config'

// Construit un href préfixé par la locale courante.
// usage: const to = useLocalizedPath(); to('/feed') -> '/fr/feed'
export function useLocalizedPath() {
  const { lang } = useParams<{ lang: string }>()
  const current = isLocale(lang) ? lang : DEFAULT_LOCALE
  return (path: string) => `/${current}${path.startsWith('/') ? path : `/${path}`}`
}
