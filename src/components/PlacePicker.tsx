import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { LatLngExpression, LeafletEvent } from 'leaflet'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlaceAutocomplete } from '@/components/PlaceAutocomplete'
import { buvardMarkerIcon } from '@/lib/leafletIcons'
import { reversePlace } from '@/lib/photon'
import type { TastingPlace } from '@/types'

// Centre par defaut quand pas de lieu : France metropolitaine.
const DEFAULT_CENTER: LatLngExpression = [46.6, 2.3]
const DEFAULT_ZOOM = 5
const PLACE_ZOOM = 15

interface Props {
  value: TastingPlace | undefined
  onChange: (place: TastingPlace | undefined) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Modal de selection de lieu : autocomplete Photon + map avec marker draggable.
// L'utilisateur peut chercher par nom, puis affiner la position en deplacant
// le marker. La selection n'est validee que sur clic "Valider" (pending state
// interne, rollback automatique au "Annuler").
export function PlacePicker({ value, onChange, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const [pending, setPending] = useState<TastingPlace | undefined>(value)
  // Cancel automatique : si l'utilisateur drag plusieurs fois, seul le dernier
  // reverse geocode gagne. AbortController re-cree a chaque drag.
  const reverseControllerRef = useRef<AbortController | null>(null)

  // Reset le pending quand la popup s'ouvre/ferme ou que la value externe change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setPending(value)
  }, [open, value])

  // Cleanup AbortController au demontage.
  useEffect(() => {
    return () => {
      reverseControllerRef.current?.abort()
    }
  }, [])

  function handleConfirm() {
    onChange(pending && pending.name.trim() ? pending : undefined)
    onOpenChange(false)
  }

  function handleClear() {
    setPending(undefined)
  }

  async function handleMarkerMove(lat: number, lng: number) {
    // 1) Update immediat des coords pour la reactivite UI (la position du
    //    marker reste a sa place finale et le nom temporaire affiche les
    //    coords si rien n'avait ete cherche).
    setPending((p) => ({
      name: p?.name?.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    }))

    // 2) Reverse geocoding Photon en background pour remplacer le nom par
    //    l'adresse OSM la plus proche. Le dernier drag gagne (abort des
    //    requetes precedentes).
    reverseControllerRef.current?.abort()
    const controller = new AbortController()
    reverseControllerRef.current = controller
    try {
      const reversed = await reversePlace(lat, lng, {
        lang: i18n.language === 'en' ? 'en' : 'fr',
        signal: controller.signal,
      })
      if (reversed) setPending(reversed)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[PlacePicker] reverse geocode failed', err)
      // En cas d'echec, on garde le pending actuel (nom = coords ou ancien).
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>{t('placePicker.title')}</DialogTitle>
          <PlaceAutocomplete
            value={pending}
            onChange={setPending}
            placeholder={t('add.fields.placePlaceholder')}
            className="h-11"
          />
        </DialogHeader>

        <div className="relative min-h-[300px] flex-1">
          <PickerMap
            position={
              pending?.lat !== undefined && pending?.lng !== undefined
                ? { lat: pending.lat, lng: pending.lng }
                : undefined
            }
            onMove={handleMarkerMove}
          />
          {pending?.lat !== undefined && (
            <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow backdrop-blur">
              {t('placePicker.dragHint')}
            </p>
          )}
        </div>

        <DialogFooter>
          {pending && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="sm:mr-auto"
            >
              {t('placePicker.clear')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('placePicker.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!pending?.name?.trim()}
            className="glow-primary"
          >
            {t('placePicker.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Sous-composant map de la popup. Re-centre automatiquement quand position
// change (via useMap dans CenterSync).
function PickerMap({
  position,
  onMove,
}: {
  position: { lat: number; lng: number } | undefined
  onMove: (lat: number, lng: number) => void
}) {
  return (
    <MapContainer
      center={position ? [position.lat, position.lng] : DEFAULT_CENTER}
      zoom={position ? PLACE_ZOOM : DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InvalidateSizeOnMount />
      <CenterSync position={position} />
      {position && (
        <Marker
          position={[position.lat, position.lng]}
          icon={buvardMarkerIcon}
          draggable
          eventHandlers={{
            dragend: (e: LeafletEvent) => {
              // Le target est un L.Marker — on appelle getLatLng() pour les coords.
              const m = e.target as { getLatLng: () => { lat: number; lng: number } }
              const { lat, lng } = m.getLatLng()
              onMove(lat, lng)
            },
          }}
        />
      )}
    </MapContainer>
  )
}

function CenterSync({
  position,
}: {
  position: { lat: number; lng: number } | undefined
}) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], PLACE_ZOOM)
    }
  }, [map, position])
  return null
}

// Leaflet mesure la taille du container au mount — dans un Dialog avec
// animation/portal, la taille n'est pas encore stabilisee au 1er render et
// la map se rend en 0px. On force une re-mesure apres un tick.
function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    const timers = [50, 200, 500].map((delay) =>
      window.setTimeout(() => map.invalidateSize(), delay),
    )
    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [map])
  return null
}
