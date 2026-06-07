import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TastingsMap } from '@/components/TastingsMap'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import type { TastingPlace } from '@/types'

interface Props {
  place: TastingPlace
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Popup map readOnly pour visualiser un lieu en preview.
// - Affiche le nom du lieu en header
// - Map centree avec marker (pas de drag, pas de popup, juste visual)
// - Bouton "Voir sur la carte" qui ferme la popup et navigue vers /map focused
//
// Necessite que le place ait des coords (lat/lng). Si pas de coords, l'appelant
// ne devrait meme pas ouvrir cette popup (no-op gracieux quand meme).
export function LocationMapDialog({ place, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()

  const hasCoords = place.lat !== undefined && place.lng !== undefined

  function handleOpenFullMap() {
    if (!hasCoords) return
    onOpenChange(false)
    navigate(localizedPath(`/map?lat=${place.lat}&lng=${place.lng}`))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="truncate">{place.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative min-h-[300px] flex-1">
          {hasCoords ? (
            <TastingsMap
              tastings={[]}
              extraMarker={{ lat: place.lat!, lng: place.lng! }}
              readOnly
              className="h-full w-full rounded-none border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {t('locationDialog.noCoords')}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('locationDialog.close')}
          </Button>
          {hasCoords && (
            <Button type="button" onClick={handleOpenFullMap} className="glow-primary">
              {t('locationDialog.openFullMap')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
