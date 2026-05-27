import { SignIn } from '@clerk/clerk-react'
import { useParams } from 'react-router-dom'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

export function SignInPage() {
  const { lang } = useParams<{ lang: string }>()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  return (
    <section className="flex h-full items-center justify-center p-6">
      <SignIn
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        afterSignInUrl={`/${locale}/feed`}
      />
    </section>
  )
}
