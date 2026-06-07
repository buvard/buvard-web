import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { useDeleteTasting } from '@/lib/api/tasting'
import { useMe } from '@/lib/api/user'
import type { Tasting } from '@/types'

interface Props {
  tasting: Tasting
}

// Kebab + dropdown (Modifier / Supprimer) + dialog de confirm.
// Rendu UNIQUEMENT si le viewer est le owner du tasting. Sinon -> null.
export function TastingActions({ tasting }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()
  const me = useMe()
  const del = useDeleteTasting()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isOwner = !!me.data && me.data.username === tasting.author.username
  if (!isOwner) return null

  function handleEdit() {
    navigate(localizedPath(`/tasting/${tasting.id}/edit`))
  }

  async function handleDelete() {
    try {
      await del.mutateAsync(tasting.id)
      toast.success(t('tasting.actions.deleted'))
      setConfirmOpen(false)
    } catch {
      toast.error(t('tasting.actions.deleteFailed'))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t('tasting.actions.menu')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('tasting.actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('tasting.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasting.actions.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasting.actions.deleteConfirmText')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>
              {t('tasting.actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // On evite la fermeture auto du dialog tant que la mutation tourne.
                e.preventDefault()
                void handleDelete()
              }}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? t('common.loading') : t('tasting.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
