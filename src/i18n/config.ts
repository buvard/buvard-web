import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'
import co from './locales/co.json'

// Liste figée des langues supportées — l'ordre sert aussi de fallback UI
export const SUPPORTED_LOCALES = ['fr', 'en', 'co'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

// Vrai si la chaîne fournie est une locale supportée
export function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    co: { translation: co },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export { i18n }
