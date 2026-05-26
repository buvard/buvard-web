import { useEffect } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE, isLocale } from './config'

// Layout qui synchronise i18next avec le segment :lang de l'URL.
// Toute locale invalide (ex: /es/feed) est redirigée vers la locale par défaut.
export function LocaleProvider() {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (isLocale(lang) && i18n.language !== lang) {
      void i18n.changeLanguage(lang)
      document.documentElement.lang = lang
    }
  }, [lang, i18n])

  if (!isLocale(lang)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />
  }

  return <Outlet />
}
