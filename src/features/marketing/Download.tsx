import { useTranslation } from 'react-i18next'
import {
  Apple,
  Download as DownloadIcon,
  Loader2,
  Plus,
  Share,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  findAndroidApk,
  useLatestRelease,
  versionFromTag,
} from '@/lib/api/github-release'
import { MarketingShell } from './MarketingShell'

// Page de telechargement direct :
// - Android : APK servi via Github Release (fetch live api.github.com).
//   La convention de nommage des assets est buvard-vX.Y.Z.apk (cf
//   .github/workflows/release-android.yml).
// - iOS : pas de store ni TestFlight, on guide l'utilisateur a installer
//   la PWA via "Ajouter a l'ecran d'accueil" dans Safari.

export function DownloadPage() {
  const { t, i18n } = useTranslation()
  const release = useLatestRelease()
  const apkAsset = release.data ? findAndroidApk(release.data) : undefined
  const version = release.data ? versionFromTag(release.data.tag_name) : undefined
  const releaseDate = release.data?.published_at
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        new Date(release.data.published_at),
      )
    : undefined

  return (
    <MarketingShell>
      <header className="mb-12 max-w-2xl space-y-4 sm:mb-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {t('download.eyebrow')}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('download.title')}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('download.subtitle')}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* === ANDROID === */}
        <article className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Smartphone className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('download.android.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('download.android.desc')}
          </p>
          {/* Etat de fetch Github API : loading / dispo / erreur. */}
          {release.isPending ? (
            <Button size="lg" variant="outline" className="mt-6 gap-2" disabled>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              {t('download.android.cta')}
            </Button>
          ) : apkAsset ? (
            <Button asChild size="lg" className="mt-6 gap-2 glow-primary">
              <a href={apkAsset.browser_download_url}>
                <DownloadIcon className="h-4 w-4" strokeWidth={2} />
                {t('download.android.cta')}
                {version && (
                  <span className="ml-1 rounded-md bg-background/20 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                    v{version}
                  </span>
                )}
              </a>
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="mt-6 gap-2" disabled>
              {t('download.android.unavailable')}
            </Button>
          )}
          {/* Hint + meta info (taille, date) seulement si on a l'asset. */}
          {apkAsset && releaseDate && (
            <p className="mt-3 text-xs text-muted-foreground/70">
              {t('download.android.publishedOn', { date: releaseDate })}
              {' · '}
              {(apkAsset.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground/70">
            {t('download.android.hint')}
          </p>
        </article>

        {/* === iOS === PWA via Add to Home Screen.
            Pas d'App Store, pas de TestFlight — l'utilisateur installe en
            ajoutant la PWA a son ecran d'accueil via Safari. */}
        <article className="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Apple className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('download.ios.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('download.ios.desc')}
          </p>
          {/* Steps Safari -> Share -> Add to Home Screen */}
          <ol className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span className="flex-1 leading-relaxed text-foreground/85">
                {t('download.ios.step1')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span className="flex flex-1 items-center gap-1.5 leading-relaxed text-foreground/85">
                <Share className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                {t('download.ios.step2')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <span className="flex flex-1 items-center gap-1.5 leading-relaxed text-foreground/85">
                <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                {t('download.ios.step3')}
              </span>
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground/70">
            {t('download.ios.hint')}
          </p>
        </article>
      </div>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card/20 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-foreground">
          {t('download.install.title')}
        </h3>
        <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>1. {t('download.install.step1')}</li>
          <li>2. {t('download.install.step2')}</li>
          <li>3. {t('download.install.step3')}</li>
        </ol>
      </section>
    </MarketingShell>
  )
}
