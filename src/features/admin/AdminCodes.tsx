import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Check,
  Copy,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useAdminListCodes,
  useCreateCode,
  useDeleteCode,
  type AdminCode,
} from '@/lib/api/admin'
import { cn } from '@/lib/utils'

export function AdminCodesPage() {
  const { t, i18n } = useTranslation()
  const codes = useAdminListCodes()
  const [createOpen, setCreateOpen] = useState(false)
  const [toDelete, setToDelete] = useState<AdminCode | null>(null)
  // Bump a chaque ouverture du dialog : sert de key pour remount le composant
  // et avoir un slug frais sans setState dans un useEffect.
  const [createKey, setCreateKey] = useState(0)
  // Capture once a mount pour calculer expired sans Date.now() impure dans render.
  // OK pour un panel admin (refresh manuel suffit a re-evaluer).
  const [now] = useState(() => Date.now())

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  function openCreate() {
    setCreateKey((k) => k + 1)
    setCreateOpen(true)
  }

  function handleCopy(code: string) {
    void navigator.clipboard.writeText(code).then(
      () => toast.success(t('admin.codes.copied')),
      () => toast.error(t('admin.codes.copyError')),
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('admin.codes.subtitle')}</p>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" strokeWidth={2} />
          {t('admin.codes.create')}
        </Button>
      </div>

      {/* Liste des codes */}
      {codes.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : codes.isError ? (
        <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('admin.codes.loadError')}
        </p>
      ) : codes.data && codes.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t('admin.codes.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {codes.data?.map((code) => {
            const usesLabel =
              code.maxUses === null
                ? t('admin.codes.usesUnlimited', { count: code.usedCount })
                : t('admin.codes.usesLimited', {
                    used: code.usedCount,
                    max: code.maxUses,
                  })
            const expired =
              code.expiresAt && new Date(code.expiresAt).getTime() < now
            const exhausted =
              code.maxUses !== null && code.usedCount >= code.maxUses
            return (
              <li
                key={code.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-card/40 px-3 py-2.5',
                  expired || exhausted
                    ? 'border-border opacity-60'
                    : 'border-border',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold tracking-wider text-foreground">
                    {code.code}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t(`admin.codes.types.${code.type}`)} · {usesLabel}
                    {code.expiresAt && (
                      <>
                        {' · '}
                        {expired
                          ? t('admin.codes.expired')
                          : t('admin.codes.expires', { date: dateFmt.format(new Date(code.expiresAt)) })}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(code.code)}
                  aria-label={t('admin.codes.copy')}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.8} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setToDelete(code)}
                  aria-label={t('admin.codes.delete')}
                  className="shrink-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <CreateCodeDialog
        key={createKey}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <DeleteCodeDialog code={toDelete} onClose={() => setToDelete(null)} />
    </section>
  )
}

// Genere un slug random de la forme POCHTRON-XXXX-YYYY (lettres/chiffres
// sans caracteres ambigus 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomChunk(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}
function generateSlug(): string {
  return `POCHTRON-${randomChunk(4)}-${randomChunk(4)}`
}

// Convertit un preset d'expiration en ISO date string.
function presetToIso(preset: 'day' | 'week' | 'month' | 'never'): string | null {
  if (preset === 'never') return null
  const days = preset === 'day' ? 1 : preset === 'week' ? 7 : 30
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

type MaxUsesPreset = 1 | 10 | 50 | 'unlimited'
type ExpiresPreset = 'day' | 'week' | 'month' | 'never'

function CreateCodeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const create = useCreateCode()
  // Le parent remount ce composant a chaque ouverture (via key bumped) — les
  // useState initialisent donc fraichement a chaque session, pas besoin
  // d'effect de reset.
  const [code, setCode] = useState(() => generateSlug())
  const [maxUses, setMaxUses] = useState<MaxUsesPreset>('unlimited')
  const [expires, setExpires] = useState<ExpiresPreset>('never')
  const [created, setCreated] = useState<AdminCode | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const finalMaxUses = maxUses === 'unlimited' ? null : maxUses
    const finalExpires = presetToIso(expires)
    create.mutate(
      {
        code: code.trim() || undefined,
        type: 'pochtron',
        maxUses: finalMaxUses,
        expiresAt: finalExpires,
      },
      {
        onSuccess: (createdCode) => {
          setCreated(createdCode)
        },
        onError: () => toast.error(t('admin.codes.createError')),
      },
    )
  }

  function handleCopyCreated() {
    if (!created) return
    void navigator.clipboard.writeText(created.code).then(
      () => toast.success(t('admin.codes.copied')),
      () => toast.error(t('admin.codes.copyError')),
    )
  }

  function handleCreateAnother() {
    setCreated(null)
    setCode(generateSlug())
    setMaxUses('unlimited')
    setExpires('never')
  }

  // Ecran succes : on remplace l'integralite du formulaire par une vue
  // dediee "code pret a partager" — utile pour copier/coller direct.
  if (created) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent bottomSheet>
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <DialogTitle>{t('admin.codes.dialog.successTitle')}</DialogTitle>
              <DialogDescription>
                {t('admin.codes.dialog.successDesc')}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5">
            <button
              type="button"
              onClick={handleCopyCreated}
              className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 text-left transition-colors hover:border-primary/60"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80">
                {t('admin.codes.dialog.preview')}
              </p>
              <p className="mt-1.5 break-all pr-10 font-mono text-2xl font-bold tracking-wider text-foreground">
                {created.code}
              </p>
              <span className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Copy className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCreateAnother}>
              <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
              {t('admin.codes.dialog.createAnother')}
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              {t('admin.codes.dialog.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent bottomSheet>
        <DialogHeader>
          <div className="flex items-center gap-3 pr-10">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <DialogTitle>{t('admin.codes.dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('admin.codes.dialog.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Zone scrollable du form */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Preview du code — gros, en gradient, avec actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('admin.codes.dialog.preview')}
                </p>
                <button
                  type="button"
                  onClick={() => setCode(generateSlug())}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
                  {t('admin.codes.dialog.regenerate')}
                </button>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                <p className="break-all font-mono text-xl font-bold tracking-wider text-foreground">
                  {code}
                </p>
              </div>
            </div>

            {/* Max uses presets */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('admin.codes.dialog.maxUsesTitle')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <PresetChip
                  active={maxUses === 1}
                  onClick={() => setMaxUses(1)}
                  label="1"
                />
                <PresetChip
                  active={maxUses === 10}
                  onClick={() => setMaxUses(10)}
                  label="10"
                />
                <PresetChip
                  active={maxUses === 50}
                  onClick={() => setMaxUses(50)}
                  label="50"
                />
                <PresetChip
                  active={maxUses === 'unlimited'}
                  onClick={() => setMaxUses('unlimited')}
                  icon={InfinityIcon}
                />
              </div>
            </div>

            {/* Expires presets */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('admin.codes.dialog.expiresTitle')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <PresetChip
                  active={expires === 'day'}
                  onClick={() => setExpires('day')}
                  label={t('admin.codes.dialog.expiresPresets.day')}
                />
                <PresetChip
                  active={expires === 'week'}
                  onClick={() => setExpires('week')}
                  label={t('admin.codes.dialog.expiresPresets.week')}
                />
                <PresetChip
                  active={expires === 'month'}
                  onClick={() => setExpires('month')}
                  label={t('admin.codes.dialog.expiresPresets.month')}
                />
                <PresetChip
                  active={expires === 'never'}
                  onClick={() => setExpires('never')}
                  label={t('admin.codes.dialog.expiresPresets.never')}
                />
              </div>
            </div>
          </div>

          {/* Footer sticky avec border-top fourni par DialogFooter */}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              {t('admin.codes.dialog.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending || !code.trim()}>
              {create.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" strokeWidth={2} />
              )}
              {t('admin.codes.dialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PresetChip({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label?: string
  icon?: typeof InfinityIcon
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card/40 text-foreground hover:border-primary/40 hover:bg-card',
      )}
    >
      {Icon ? <Icon className="h-4 w-4" strokeWidth={2.5} /> : label}
    </button>
  )
}

function DeleteCodeDialog({
  code,
  onClose,
}: {
  code: AdminCode | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const del = useDeleteCode()

  function handleConfirm() {
    if (!code) return
    del.mutate(code.id, {
      onSuccess: () => {
        toast.success(t('admin.codes.deleteSuccess'))
        onClose()
      },
      onError: () => toast.error(t('admin.codes.deleteError')),
    })
  }

  return (
    <AlertDialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.codes.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.codes.deleteConfirmDesc', { code: code?.code ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.back')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={del.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {del.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('admin.codes.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
