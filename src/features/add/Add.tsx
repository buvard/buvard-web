import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, MapPin, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ImagePicker, IMAGE_MAX_SIZE_MB } from '@/components/ImagePicker'
import { PlacePicker } from '@/components/PlacePicker'
import { StarRating } from '@/components/StarRating'
import { cn } from '@/lib/utils'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useAddTastingPhoto, useCreateTasting } from '@/lib/api/tasting'
import { usePrefs } from '@/lib/api/user'
import { XP_PER_TASTING } from '@/lib/gamification'
import { consumePendingCaptures, setPendingCaptures } from './pendingCaptures'
import {
  clearStashedAddForm,
  getStashedAddForm,
  setStashedAddForm,
} from './addFormStash'
import type { Capture } from './CameraCapture'
import {
  MAX_TASTING_PHOTOS,
  TASTING_TYPES,
  type Currency,
  type TastingPlace,
  type TastingType,
  type Visibility,
  type CreateTastingPayload,
} from '@/types'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']
const VISIBILITIES: Visibility[] = ['public', 'private']
const MAX_AROMAS = 20
const MAX_AROMA_LEN = 40
const CURRENT_YEAR = new Date().getFullYear()

// Accepte "42,50" ou "42.50" ou "42" — renvoie null si vide/invalide.
function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.')
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

interface AddPageProps {
  // Si fourni, l'app considere qu'on est en mode modal/popup :
  //   - le bouton "Reprendre" la photo ouvre l'ImagePicker direct au lieu de
  //     naviguer vers /add/capture (qui sortirait du modal)
  //   - apres publication / annulation, on appelle onComplete au lieu de
  //     navigate(/feed) — le parent decide quoi faire (fermer le modal).
  onComplete?: () => void
}

export function AddPage({ onComplete }: AddPageProps = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const prefs = usePrefs()
  const createTasting = useCreateTasting()
  const addPhoto = useAddTastingPhoto()
  const isModal = !!onComplete

  // Sortie du flow : ferme le modal si fourni, sinon redirige vers le feed.
  function exit() {
    if (onComplete) onComplete()
    else navigate(localizedPath('/feed'))
  }

  // --- Form state ---
  // Au 1er mount, on tente de reprendre un brouillon en attente (cas typique :
  // l'utilisateur quitte /add pour /add/capture puis revient).
  const stashed = getStashedAddForm()
  const [type, setType] = useState<TastingType>(stashed?.type ?? 'whisky')
  const [name, setName] = useState(stashed?.name ?? '')
  const [producer, setProducer] = useState(stashed?.producer ?? '')
  const [year, setYear] = useState(stashed?.year ?? '')
  const [rating, setRating] = useState(stashed?.rating ?? 0)
  const [price, setPrice] = useState(stashed?.price ?? '')
  const [currency, setCurrency] = useState<Currency>(
    stashed?.currency ?? prefs.data?.currency ?? 'EUR',
  )
  const [aromas, setAromas] = useState<string[]>(stashed?.aromas ?? [])
  const [aromaInput, setAromaInput] = useState('')
  const [place, setPlace] = useState<TastingPlace | undefined>(stashed?.place)
  const [placePickerOpen, setPlacePickerOpen] = useState(false)
  const [notes, setNotes] = useState(stashed?.notes ?? '')
  const [visibility, setVisibility] = useState<Visibility>(stashed?.visibility ?? 'public')
  const [photos, setPhotos] = useState<Capture[]>(() => consumePendingCaptures() ?? [])

  // Persiste le brouillon a chaque change. Reset au submit success (cf exit()).
  useEffect(() => {
    setStashedAddForm({
      type,
      name,
      producer,
      year,
      rating,
      price,
      currency,
      aromas,
      place,
      notes,
      visibility,
    })
  }, [type, name, producer, year, rating, price, currency, aromas, place, notes, visibility])

  // Cleanup au demontage : revoke uniquement les previewUrl blob: qu'on possede.
  useEffect(() => {
    return () => {
      for (const p of photos) {
        if (p.ownsBlob) URL.revokeObjectURL(p.previewUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup au demontage uniquement
  }, [])

  function addPhotoFromGallery(file: File) {
    if (photos.length >= MAX_TASTING_PHOTOS) {
      toast.error(t('add.camera.maxReached', { max: MAX_TASTING_PHOTOS }))
      return
    }
    setPhotos((prev) => [
      ...prev,
      { file, previewUrl: URL.createObjectURL(file), ownsBlob: true },
    ])
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const removed = prev[index]
      if (removed?.ownsBlob) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  // Reorder local par swap voisin (delta = -1 pour gauche, +1 pour droite).
  function movePhoto(index: number, delta: -1 | 1) {
    setPhotos((prev) => {
      const target = index + delta
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function onPhotoRejected(reason: 'mime' | 'size') {
    toast.error(
      reason === 'mime'
        ? t('upload.errors.mime')
        : t('upload.errors.size', { mb: IMAGE_MAX_SIZE_MB }),
    )
  }

  // Repart vers la cam en seedant les photos actuelles pour les modifier.
  // Inactif en mode modal (on quitterait le modal) — l'utilisateur passe par
  // le bouton + de la grille pour ajouter d'autres photos.
  function handleEditPhotos() {
    if (isModal) return
    setPendingCaptures(photos)
    navigate(localizedPath('/add/capture'), { replace: true })
  }

  // --- Aromas (chips) ---
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

  // --- Submit ---
  const isSubmitting = createTasting.isPending || addPhoto.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nameTrim = name.trim()
    if (!nameTrim) {
      toast.error(t('add.errors.nameRequired'))
      return
    }
    if (photos.length === 0) {
      toast.error(t('add.errors.photoRequired'))
      return
    }
    if (rating < 0.5) {
      toast.error(t('add.errors.ratingRequired'))
      return
    }

    const payload: CreateTastingPayload = {
      type,
      name: nameTrim,
      rating,
      visibility,
    }
    const producerTrim = producer.trim()
    if (producerTrim) payload.producer = producerTrim
    const y = year ? parseInt(year, 10) : null
    if (y !== null && Number.isFinite(y)) payload.year = y
    const p = parseDecimal(price)
    if (p !== null) {
      payload.price = p
      payload.currency = currency
    }
    if (aromas.length > 0) payload.aromas = aromas
    if (place && place.name.trim()) payload.place = place
    const notesTrim = notes.trim()
    if (notesTrim) payload.notes = notesTrim

    try {
      const created = await createTasting.mutateAsync(payload)
      // Tasting cree -> on peut wiper le brouillon (peu importe si les photos
      // suivent ou pas, le tasting est en base).
      clearStashedAddForm()
      // Upload sequentiel pour preserver l'ordre cote serveur (chaque POST append en fin de tableau).
      for (let i = 0; i < photos.length; i++) {
        try {
          await addPhoto.mutateAsync({ id: created.id, file: photos[i].file })
        } catch {
          toast.error(t('add.errors.photoUploadAt', { index: i + 1, total: photos.length }))
          // Tasting deja cree, on garde ce qui est upload et on quitte vers le feed.
          exit()
          return
        }
      }
      toast.success(t('add.success'), {
        description: t('add.xpGained', { xp: XP_PER_TASTING }),
      })
      exit()
    } catch {
      toast.error(t('add.errors.generic'))
    }
  }

  const canAddMore = photos.length < MAX_TASTING_PHOTOS

  return (
    <section className="pb-28">
      {/* === Top bar mobile : bouton fermer (la bottom-nav est cachee sur /add).
           Masque en mode modal : le Dialog parent a deja sa propre croix. === */}
      {!isModal && (
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t('add.cancel')}
            onClick={exit}
            disabled={isSubmitting}
            className="-ml-2 h-10 w-10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground">{t('add.title')}</h1>
          <div className="w-10" aria-hidden />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === Photos ===
            En mode modal (desktop), pas de navigation vers /add/capture : on
            ouvre le file picker directement. Mobile/page : on garde la cam plein
            ecran via handleEditPhotos. */}
        {photos.length === 0 ? (
          isModal ? (
            <ImagePicker onPick={addPhotoFromGallery} onRejected={onPhotoRejected}>
              {(open) => (
                <Button
                  type="button"
                  variant="outline"
                  onClick={open}
                  className="flex h-32 w-full flex-col gap-1.5 rounded-xl border-dashed"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">{t('add.photo.take')}</span>
                </Button>
              )}
            </ImagePicker>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleEditPhotos}
              className="flex h-32 w-full flex-col gap-1.5 rounded-xl border-dashed"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm">{t('add.photo.take')}</span>
            </Button>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {t('add.fields.photos')} ({photos.length}/{MAX_TASTING_PHOTOS})
              </Label>
              {!isModal && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleEditPhotos}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t('add.photo.edit')}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div
                  key={p.previewUrl}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={t('upload.remove')}
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        aria-label={t('tasting.edit.movePhotoLeft')}
                        onClick={() => movePhoto(i, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {i < photos.length - 1 && (
                      <button
                        type="button"
                        aria-label={t('tasting.edit.movePhotoRight')}
                        onClick={() => movePhoto(i, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-md"
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
              {canAddMore && (
                <ImagePicker onPick={addPhotoFromGallery} onRejected={onPhotoRejected}>
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
        )}

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

        {/* === Notes (caption) === */}
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

        {/* === Plus de détails (shadcn Accordion) === */}
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
                      // Pattern conseillé pour eviter les sous-systemes auto-correct
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

        {/* === Moderation notice === */}
        <p className="rounded-md border border-border bg-card/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {t('common.moderation')}
        </p>
      </form>

      {/* === Bouton Publier sticky bottom === */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md lg:hidden">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 w-full text-base font-semibold glow-primary"
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('add.submit')}
        </Button>
      </div>

      {/* === Bouton desktop inline === */}
      <div className="mt-6 hidden items-center gap-2 lg:flex">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="glow-primary"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('add.submit')}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={exit}
          disabled={isSubmitting}
        >
          {t('add.cancel')}
        </Button>
      </div>
    </section>
  )
}
