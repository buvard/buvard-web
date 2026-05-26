import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { DrinkType } from '@/lib/types'

const TYPES: DrinkType[] = ['wine', 'beer', 'spirit', 'cocktail', 'other']

export function AddPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()

  // État local — pas de backend pour l'instant, on revient juste au feed.
  const [type, setType] = useState<DrinkType>('wine')
  const [name, setName] = useState('')
  const [rating, setRating] = useState('')
  const [place, setPlace] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: brancher l'envoi backend
    navigate(localizedPath('/feed'))
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('add.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('add.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t('add.fields.name')}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('add.fields.namePlaceholder')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t('add.fields.type')}</Label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  type === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`types.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rating">{t('add.fields.rating')}</Label>
            <Input
              id="rating"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="place">{t('add.fields.place')}</Label>
            <Input
              id="place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder={t('add.fields.placePlaceholder')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t('add.fields.notes')}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('add.fields.notesPlaceholder')}
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" size="lg">
            {t('add.submit')}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={() => navigate(localizedPath('/feed'))}
          >
            {t('add.cancel')}
          </Button>
        </div>
      </form>
    </section>
  )
}
