import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2, MapPin, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ImagePicker, IMAGE_MAX_SIZE_MB } from '@/components/ImagePicker'
import { PlacePicker } from '@/components/PlacePicker'
import { StarRating } from '@/components/StarRating'
import { cn } from '@/lib/utils'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import {
  useAddTastingPhoto,
  useRemoveTastingPhotoAt,
  useReorderTastingPhotos,
  useTasting,
  useUpdateTasting,
} from '@/lib/api/tasting'
import { useMe } from '@/lib/api/user'
import {
  MAX_TASTING_PHOTOS,
  TASTING_TYPES,
  type Currency,
  type Tasting,
  type TastingPlace,
  type TastingType,
  type UpdateTastingPayload,
  type Visibility,
} from '@/types'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']
const VISIBILITIES: Visibility[] = ['public', 'private']
const MAX_AROMAS = 20
const MAX_AROMA_LEN = 40
const CURRENT_YEAR = new Date().getFullYear()

function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.')
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

interface PendingPhoto {
  file: File
  previewUrl: string
}

// === Page wrapper : fetch + gate (loading / 404 / forbidden) ===
// Le form lui-meme est dans un sous-composant pour que son state soit hydrate
// UNE seule fois au mount via useState lazy (evite l'anti-pattern setState in
// effect). On force le remount via la key sur tasting.id si jamais on navigue
// d'un tasting a un autre.
export function TastingEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const { id } = useParams<{ id: string }>()
  const { data: tasting, isPending, isError } = useTasting(id)
  const me = useMe()

  if (isPending || me.isPending) {
    return (
      <section className="space-y-4 pb-28">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="aspect-square w-full max-w-md rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
    )
  }
  if (isError || !tasting) {
    return (
      <section className="pt-12">
        <p className="text-sm font-medium text-destructive">{t('tasting.edit.notFound')}</p>
      </section>
    )
  }
  const isOwner = !!me.data && me.data.username === tasting.author.username
  if (!isOwner) {
    return (
      <section className="pt-12">
        <p className="text-sm font-medium text-destructive">{t('tasting.edit.forbidden')}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => navigate(localizedPath('/feed'))}
        >
          {t('add.cancel')}
        </Button>
      </section>
    )
  }
  return <TastingEditForm key={tasting.id} tasting={tasting} />
}

// === Form proprement dit ===
// `tasting` est garanti non-null par le wrapper. Le state local est seede par
// les initialiseurs lazy de useState — la prop ne change qu'au remount via key.
function TastingEditForm({ tasting }: { tasting: Tasting }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const update = useUpdateTasting()
  const addPhoto = useAddTastingPhoto()
  const removePhoto = useRemoveTastingPhotoAt()
  const reorderPhotos = useReorderTastingPhotos()

  const [type, setType] = useState<TastingType>(tasting.type)
  const [name, setName] = useState(tasting.name)
  const [producer, setProducer] = useState(tasting.producer ?? '')
  const [year, setYear] = useState(tasting.year !== undefined ? String(tasting.year) : '')
  const [rating, setRating] = useState(tasting.rating)
  const [price, setPrice] = useState(tasting.price !== undefined ? String(tasting.price) : '')
  const [currency, setCurrency] = useState<Currency>(
    (tasting.currency as Currency | undefined) ?? 'EUR',
  )
  const [aromas, setAromas] = useState<string[]>(tasting.aromas)
  const [aromaInput, setAromaInput] = useState('')
  const [place, setPlace] = useState<TastingPlace | undefined>(tasting.place)
  const [placePickerOpen, setPlacePickerOpen] = useState(false)
  const [notes, setNotes] = useState(tasting.notes ?? '')
  const [visibility, setVisibility] = useState<Visibility>(tasting.visibility)
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])

  // Cleanup des blob: URLs en pending au demontage.
  useEffect(() => {
    return () => {
      for (const p of pendingPhotos) URL.revokeObjectURL(p.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup au demontage uniquement
  }, [])

  // --- Aromas ---
  function addAroma() {
    const v = aromaInput.trim()
    if (!v) return
    if (v.length > MAX_AROMA_LEN) {
      toast.error(t('add.errors.aromaTooLong', { max: MAX_AROMA_LEN }))
      return
    }
    if (aromas.includes(v)) return
    if (aromas.length >= MAX_AROMAS) {
      toast.error(t('add.errors.aromaMax', { max: MAX_AROMAS }))
      return
    }
    setAromas([...aromas, v])
    setAromaInput('')
  }

  function onAromaKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addAroma()
    }
  }

  function removeAroma(a: string) {
    setAromas(aromas.filter((x) => x !== a))
  }

  // --- Photos serveur (delete + reorder immediat) ---
  async function handleDeleteServerPhoto(index: number) {
    try {
      await removePhoto.mutateAsync({ id: tasting.id, index })
    } catch {
      toast.error(t('tasting.edit.photoDeleteFailed'))
    }
  }

  // Echange 2 photos serveur via une permutation. delta = -1 (up) ou +1 (down).
  async function handleMoveServerPhoto(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= tasting.photoUrls.length) return
    const order = tasting.photoUrls.map((_, i) => i)
    ;[order[index], order[target]] = [order[target], order[index]]
    try {
      await reorderPhotos.mutateAsync({ id: tasting.id, order })
    } catch {
      toast.error(t('tasting.edit.photoReorderFailed'))
    }
  }

  // Reorder local des pending photos (pas d'API, juste local state).
  function movePendingPhoto(index: number, delta: -1 | 1) {
    setPendingPhotos((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // --- Photos en queue (upload differe au submit) ---
  function addPendingPhoto(file: File) {
    const totalAfter = tasting.photoUrls.length + pendingPhotos.length + 1
    if (totalAfter > MAX_TASTING_PHOTOS) {
      toast.error(t('add.camera.maxReached', { max: MAX_TASTING_PHOTOS }))
      return
    }
    setPendingPhotos((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }])
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function onPhotoRejected(reason: 'mime' | 'size') {
    toast.error(
      reason === 'mime'
        ? t('upload.errors.mime')
        : t('upload.errors.size', { mb: IMAGE_MAX_SIZE_MB }),
    )
  }

  // --- Submit ---
  const isSubmitting = update.isPending || addPhoto.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nameTrim = name.trim()
    if (!nameTrim) {
      toast.error(t('add.errors.nameRequired'))
      return
    }
    if (rating < 0.5) {
      toast.error(t('add.errors.ratingRequired'))
      return
    }
    const totalPhotos = tasting.photoUrls.length + pendingPhotos.length
    if (totalPhotos === 0) {
      toast.error(t('add.errors.photoRequired'))
      return
    }

    const payload: UpdateTastingPayload = {
      type,
      name: nameTrim,
      rating,
      visibility,
    }
    const producerTrim = producer.trim()
    payload.producer = producerTrim || undefined
    const y = year ? parseInt(year, 10) : null
    payload.year = y !== null && Number.isFinite(y) ? y : undefined
    const p = parseDecimal(price)
    if (p !== null) {
      payload.price = p
      payload.currency = currency
    } else {
      payload.price = undefined
      payload.currency = undefined
    }
    payload.aromas = aromas
    payload.place = place && place.name.trim() ? place : undefined
    const notesTrim = notes.trim()
    payload.notes = notesTrim || undefined

    try {
      await update.mutateAsync({ id: tasting.id, payload })
      // Upload des nouvelles photos en sequence pour conserver l'ordre.
      for (let i = 0; i < pendingPhotos.length; i++) {
        try {
          await addPhoto.mutateAsync({ id: tasting.id, file: pendingPhotos[i].file })
        } catch {
          toast.error(t('add.errors.photoUploadAt', { index: i + 1, total: pendingPhotos.length }))
          navigate(localizedPath('/feed'))
          return
        }
      }
      toast.success(t('tasting.edit.success'))
      navigate(localizedPath('/feed'))
    } catch {
      toast.error(t('tasting.edit.failed'))
    }
  }

  const totalPhotos = tasting.photoUrls.length + pendingPhotos.length
  const canAddMore = totalPhotos < MAX_TASTING_PHOTOS

  return (
    <section className="pb-28">
      {/* Top bar mobile */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t('add.cancel')}
          onClick={() => navigate(localizedPath('/feed'))}
          disabled={isSubmitting}
          className="-ml-2 h-10 w-10 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">{t('tasting.edit.title')}</h1>
        <div className="w-10" aria-hidden />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === Photos === */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('add.fields.photos')} ({totalPhotos}/{MAX_TASTING_PHOTOS})
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {tasting.photoUrls.map((url, i) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={t('upload.remove')}
                  onClick={() => void handleDeleteServerPhoto(i)}
                  disabled={removePhoto.isPending}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {/* Reorder controls : boutons gauche/droite si possible */}
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label={t('tasting.edit.movePhotoLeft')}
                      onClick={() => void handleMoveServerPhoto(i, -1)}
                      disabled={reorderPhotos.isPending}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md disabled:opacity-50"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {i < tasting.photoUrls.length - 1 && (
                    <button
                      type="button"
                      aria-label={t('tasting.edit.movePhotoRight')}
                      onClick={() => void handleMoveServerPhoto(i, 1)}
                      disabled={reorderPhotos.isPending}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md disabled:opacity-50"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur-md">
                    {t('add.photo.cover')}
                  </span>
                )}
              </div>
            ))}
            {pendingPhotos.map((p, i) => (
              <div
                key={p.previewUrl}
                className="relative aspect-square overflow-hidden rounded-lg border border-dashed border-primary/60"
              >
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={t('upload.remove')}
                  onClick={() => removePendingPhoto(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label={t('tasting.edit.movePhotoLeft')}
                      onClick={() => movePendingPhoto(i, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {i < pendingPhotos.length - 1 && (
                    <button
                      type="button"
                      aria-label={t('tasting.edit.movePhotoRight')}
                      onClick={() => movePendingPhoto(i, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground backdrop-blur-md">
                  {t('tasting.edit.pending')}
                </span>
              </div>
            ))}
            {canAddMore && (
              <ImagePicker onPick={addPendingPhoto} onRejected={onPhotoRejected}>
                {(open) => (
                  <button
                    type="button"
                    onClick={open}
                    className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted/30"
                    aria-label={t('add.photo.add')}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </ImagePicker>
            )}
          </div>
        </div>

        {/* === Essentiels === */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {t('add.fields.name')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('add.fields.namePlaceholder')}
              maxLength={120}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('add.fields.rating')}</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('add.fields.type')}</Label>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {TASTING_TYPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
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
        </div>

        {/* === Lieu === */}
        <div className="space-y-2 rounded-xl border border-border bg-card/30 p-4">
          <Label className="text-sm font-medium">{t('add.fields.place')}</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPlacePickerOpen(true)}
            className="h-11 w-full justify-start gap-2 font-normal"
          >
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className={cn('truncate', !place?.name && 'text-muted-foreground')}>
              {place?.name ?? t('add.fields.placePickCta')}
            </span>
          </Button>
          {place?.name && (
            <p className="text-xs text-muted-foreground">
              {t('add.fields.placePrivacy')}
            </p>
          )}
        </div>
        <PlacePicker
          value={place}
          onChange={setPlace}
          open={placePickerOpen}
          onOpenChange={setPlacePickerOpen}
        />

        {/* === Notes === */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            {t('add.fields.notes')}
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('add.fields.notesPlaceholder')}
            rows={3}
            maxLength={2000}
          />
        </div>

        {/* === Plus de détails === */}
        <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
          <AccordionItem value="more" className="border-b-0">
            <AccordionTrigger className="py-3 text-sm hover:no-underline">
              {t('add.moreDetails')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producer">{t('add.fields.producer')}</Label>
                    <Input
                      id="producer"
                      value={producer}
                      onChange={(e) => setProducer(e.target.value)}
                      placeholder={t('add.fields.producerPlaceholder')}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">{t('add.fields.year')}</Label>
                    <Input
                      id="year"
                      type="number"
                      inputMode="numeric"
                      min={1700}
                      max={CURRENT_YEAR + 1}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="2018"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_100px] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('add.fields.price')}</Label>
                    <Input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="42,50"
                      pattern="[0-9]*[.,]?[0-9]*"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('add.fields.currency')}</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aroma-input">{t('add.fields.aromas')}</Label>
                  <Input
                    id="aroma-input"
                    value={aromaInput}
                    onChange={(e) => setAromaInput(e.target.value)}
                    onKeyDown={onAromaKey}
                    onBlur={addAroma}
                    placeholder={t('add.fields.aromasPlaceholder')}
                    maxLength={MAX_AROMA_LEN}
                  />
                  {aromas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aromas.map((a) => (
                        <Badge
                          key={a}
                          variant="secondary"
                          className="gap-1 pr-1 font-normal"
                        >
                          {a}
                          <button
                            type="button"
                            aria-label={t('add.fields.aromaRemove', { value: a })}
                            onClick={() => removeAroma(a)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('add.fields.visibility')}</Label>
                  <div className="flex gap-2">
                    {VISIBILITIES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={cn(
                          'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                          visibility === v
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t(`add.visibility.${v}`)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(`add.visibility.${visibility}Hint`)}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>

      {/* Sticky bottom mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md lg:hidden">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 w-full text-base font-semibold glow-primary"
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('tasting.edit.save')}
        </Button>
      </div>

      {/* Inline desktop */}
      <div className="mt-6 hidden items-center gap-2 lg:flex">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="glow-primary"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('tasting.edit.save')}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={() => navigate(localizedPath('/feed'))}
          disabled={isSubmitting}
        >
          {t('add.cancel')}
        </Button>
      </div>
    </section>
  )
}
