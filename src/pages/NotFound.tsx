import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'

export function NotFoundPage() {
  const localizedPath = useLocalizedPath()
  return (
    <section className="flex flex-col items-start gap-4 pt-12">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Page introuvable
      </h1>
      <Button asChild variant="outline">
        <Link to={localizedPath('/')}>Retour à l'accueil</Link>
      </Button>
    </section>
  )
}
