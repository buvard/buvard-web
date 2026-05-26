import { SignUp } from '@clerk/clerk-react'
import { useParams } from 'react-router-dom'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config'

export function SignUpPage() {
  const { lang } = useParams<{ lang: string }>()
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  return (
    <section className="flex h-full items-center justify-center p-6">
      <SignUp
        routing="path"
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
        afterSignUpUrl={`/${locale}/feed`}
      />
    </section>
  )
}
