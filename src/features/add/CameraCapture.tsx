import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { CameraPreview, type CameraPreviewOptions } from '@capacitor-community/camera-preview'
import { X, Zap, ZapOff, RotateCcw, Images, Check } from 'lucide-react'
import { ImagePicker, IMAGE_MAX_SIZE_MB } from '@/components/ImagePicker'
import { cn } from '@/lib/utils'
import { MAX_TASTING_PHOTOS } from '@/types'

type Facing = 'rear' | 'front'

// Une capture prete a etre uploadee : le File pour l'API + une URL pour preview.
// `ownsBlob` = true si previewUrl est un blob: a revoke au cleanup.
export interface Capture {
  file: File
  previewUrl: string
  ownsBlob: boolean
}

// Convertit le base64 retourne par CameraPreview en File reutilisable par
// l'upload (FormData). Le plugin ne renvoie pas le mime mais on sait que c'est
// du JPEG (option par defaut).
function base64ToFile(base64: string, mime = 'image/jpeg'): File {
  const bin = atob(base64)
  const len = bin.length
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], `tasting-${Date.now()}.jpg`, { type: mime })
}

interface Props {
  // Photos deja accumulees (seed depuis Add lors d'un "Reprendre").
  initial?: Capture[]
  // Appele quand l'utilisateur valide la session (>= 1 photo).
  onDone: (captures: Capture[]) => void
  // Fermeture sans aucune photo retournee.
  onClose: () => void
}

// Capture cam plein ecran (natif Capacitor) en mode SESSION multi-photo.
// L'utilisateur peut cumuler jusqu'a MAX_TASTING_PHOTOS prises avant de valider.
// Sur web, on tombe sur un fallback ImagePicker classique (multiple files).
export function CameraCapture({ initial = [], onDone, onClose }: Props) {
  const { t } = useTranslation()
  const isNative = Capacitor.isNativePlatform()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [facing, setFacing] = useState<Facing>('rear')
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [captures, setCaptures] = useState<Capture[]>(initial)
  // Ref pour eviter le double-start en StrictMode (mount/unmount/mount).
  const startedRef = useRef(false)

  const atMax = captures.length >= MAX_TASTING_PHOTOS

  useEffect(() => {
    if (!isNative) return
    if (startedRef.current) return
    startedRef.current = true

    async function start() {
      try {
        // toBack: true place le preview SOUS la WebView (plein ecran).
        // En mode toBack on ne passe PAS de `parent` (mutuellement exclusif).
        const options: CameraPreviewOptions = {
          position: facing,
          width: window.innerWidth,
          height: window.innerHeight,
          toBack: true,
          enableHighResolution: false,
        }
        await CameraPreview.start(options)
        document.body.classList.remove('camera-loading')
        document.body.classList.add('camera-ready')
        setReady(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.toLowerCase().includes('permission')) {
          toast.error(t('add.camera.permissionDenied'))
        } else {
          toast.error(t('add.camera.startFailed'))
        }
        onClose()
      }
    }
    void start()

    return () => {
      startedRef.current = false
      document.body.classList.remove('camera-ready')
      document.body.classList.add('camera-loading')
      void CameraPreview.stop().catch(() => undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/stop uniquement au mount/unmount, le switch facing utilise flip()
  }, [isNative])

  // Note : pas de cleanup global des blob: URLs au demontage. Les captures
  // confirmees sont transferees au parent (Add) qui les revoque. Les retraits
  // en cours de session sont revoques individuellement dans removeCapture().

  async function handleCapture() {
    if (!isNative || !ready || busy || atMax) return
    setBusy(true)
    try {
      const result = await CameraPreview.capture({ quality: 85 })
      const base64 = result.value
      const file = base64ToFile(base64)
      // data: URL au lieu de blob: pour eviter d'avoir a gerer le revoke.
      const previewUrl = `data:image/jpeg;base64,${base64}`
      setCaptures((prev) => [...prev, { file, previewUrl, ownsBlob: false }])
    } catch {
      toast.error(t('add.camera.captureFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleFlip() {
    if (!isNative || !ready) return
    try {
      await CameraPreview.flip()
      setFacing((f) => (f === 'rear' ? 'front' : 'rear'))
    } catch {
      // pas de toast ici, c'est silencieux UX
    }
  }

  async function handleFlash() {
    if (!isNative || !ready) return
    const next = flash === 'off' ? 'on' : 'off'
    try {
      await CameraPreview.setFlashMode({ flashMode: next })
      setFlash(next)
    } catch {
      // ignore
    }
  }

  function handlePickRejected(reason: 'mime' | 'size') {
    toast.error(
      reason === 'mime'
        ? t('upload.errors.mime')
        : t('upload.errors.size', { mb: IMAGE_MAX_SIZE_MB }),
    )
  }

  function handlePickGallery(file: File) {
    if (atMax) {
      toast.error(t('add.camera.maxReached', { max: MAX_TASTING_PHOTOS }))
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setCaptures((prev) => [...prev, { file, previewUrl, ownsBlob: true }])
  }

  function removeCapture(index: number) {
    setCaptures((prev) => {
      const removed = prev[index]
      if (removed?.ownsBlob) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDone() {
    if (captures.length === 0) {
      toast.error(t('add.camera.atLeastOne'))
      return
    }
    onDone(captures)
  }

  // --- Fallback web : pas de live preview, ImagePicker classique ---
  if (!isNative) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-xs text-white/70 tabular-nums">
            {captures.length}/{MAX_TASTING_PHOTOS}
          </span>
          <button
            type="button"
            aria-label={t('add.camera.done')}
            onClick={handleDone}
            disabled={captures.length === 0}
            className={cn(
              'flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-black text-sm font-semibold',
              captures.length === 0 && 'opacity-40',
            )}
          >
            <Check className="h-4 w-4" />
            {t('add.camera.done')}
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-white/70">{t('add.camera.webFallback')}</p>
        </div>
        {captures.length > 0 && <Thumbnails captures={captures} onRemove={removeCapture} />}
        <div className="pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
          <ImagePicker onPick={handlePickGallery} onRejected={handlePickRejected}>
            {(open) => (
              <button
                type="button"
                onClick={open}
                disabled={atMax}
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-black',
                  atMax && 'opacity-40',
                )}
                aria-label={t('add.photo.pick')}
              >
                <Images className="h-6 w-6" />
              </button>
            )}
          </ImagePicker>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Preview natif rendu DERRIERE la WebView par le plugin (toBack).
          UI HTML en overlay au-dessus via z-50. */}
      <div className="fixed inset-0 z-50 flex flex-col text-white pointer-events-none">
        {/* Top bar : close · compteur · done */}
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pointer-events-auto">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs tabular-nums backdrop-blur-md">
              {captures.length}/{MAX_TASTING_PHOTOS}
            </span>
            <button
              type="button"
              aria-label={t('add.camera.flash')}
              onClick={() => void handleFlash()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
            >
              {flash === 'on' ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex-1" />

        {/* Thumbnails des photos deja prises */}
        {captures.length > 0 && (
          <div className="pointer-events-auto">
            <Thumbnails captures={captures} onRemove={removeCapture} />
          </div>
        )}

        {/* Bottom bar : galerie / capture / flip + Done */}
        <div className="pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 pointer-events-auto">
          <div className="flex items-center justify-around px-6">
            <ImagePicker onPick={handlePickGallery} onRejected={handlePickRejected}>
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  disabled={atMax}
                  aria-label={t('add.photo.pick')}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md',
                    atMax && 'opacity-40',
                  )}
                >
                  <Images className="h-5 w-5" />
                </button>
              )}
            </ImagePicker>

            <button
              type="button"
              aria-label={t('add.camera.capture')}
              onClick={() => void handleCapture()}
              disabled={!ready || busy || atMax}
              className={cn(
                'h-20 w-20 rounded-full border-4 border-white bg-white/95 transition-transform active:scale-95',
                (!ready || busy || atMax) && 'opacity-50',
              )}
            />

            <button
              type="button"
              aria-label={t('add.camera.flip')}
              onClick={() => void handleFlip()}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {captures.length > 0 && (
            <div className="mt-4 px-6">
              <button
                type="button"
                onClick={handleDone}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-black text-base font-semibold active:scale-[0.98] transition-transform"
              >
                <Check className="h-5 w-5" />
                {t('add.camera.done')} · {captures.length}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Bande horizontale de miniatures avec bouton X par photo.
function Thumbnails({
  captures,
  onRemove,
}: {
  captures: Capture[]
  onRemove: (index: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-4 py-2">
      {captures.map((c, i) => (
        <div
          key={c.previewUrl}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/30"
        >
          <img src={c.previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label={t('upload.remove')}
            onClick={() => onRemove(i)}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
