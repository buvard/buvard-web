import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TastingCard } from '@/components/TastingCard'
import { useTasting } from '@/lib/api/tasting'
import { ApiError } from '@/lib/api/client'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

// Page detail d'une degustation : top bar back + nom de la boisson, puis la
// TastingCard complete (carousel photos, infos, like, etc.). Reutilise le
// composant TastingCard pour rester DRY avec le feed.
export function TastingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const tasting = useTasting(id)

  // Bouton retour : visible seulement s'il y a un historique de navigation in-app.
  const canGoBack = (window.history.state?.idx ?? 0) > 0

  if (tasting.isPending) {
    return (
      <section className="space-y-4">
        <TopBar canGoBack={canGoBack} onBack={() => navigate(-1)} />
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </section>
    )
  }

  if (tasting.isError) {
    const notFound = tasting.error instanceof ApiError && tasting.error.status === 404
    return (
      <section className="space-y-4">
        <TopBar canGoBack={canGoBack} onBack={() => navigate(-1)} />
        <div className="flex flex-col items-start gap-3 pt-8">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {notFound ? '404' : t('common.errorGeneric')}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {notFound ? t('tastingDetail.notFound') : t('tastingDetail.error')}
          </h1>
          <Button asChild variant="ghost" size="sm">
            <Link to={localizedPath('/feed')}>{t('common.back')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <TopBar canGoBack={canGoBack} onBack={() => navigate(-1)} title={tasting.data.name} />
      <TastingCard tasting={tasting.data} />
    </section>
  )
}

// Top bar collee : back arrow + titre tronque. Memes regles de scroll-offset
// que ProfileLayout (-top-4 compense le pt-4 du scroll container parent).
function TopBar({
  canGoBack,
  onBack,
  title,
}: {
  canGoBack: boolean
  onBack: () => void
  title?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="sticky -top-4 z-20 -mx-4 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:-mx-5 sm:px-5">
      {canGoBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
      )}
      <h2 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-foreground">
        {title ?? t('tastingDetail.loading')}
      </h2>
    </div>
  )
}
