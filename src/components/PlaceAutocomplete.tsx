import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { searchPlaces, type PlaceSuggestion } from '@/lib/photon'
import type { TastingPlace } from '@/types'

interface Props {
  value: TastingPlace | undefined
  onChange: (place: TastingPlace | undefined) => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

// Combobox autocomplete base sur Photon (Komoot / OpenStreetMap).
// - L'utilisateur tape → on debounce 250ms → fetch suggestions → dropdown.
// - Selection (clic ou Enter) → on stocke TastingPlace complet (name + lat/lng + placeId).
// - Texte libre sans selection → on stocke juste { name }.
// - Si fetch echoue ou rate-limit, on degrade silencieusement (input texte simple).
//
// Pas de loader script, pas d'API key, pas de billing. Fair-use Komoot.
export function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  className,
  disabled,
}: Props) {
  const { t, i18n } = useTranslation()
  const reactId = useId()
  const listId = `${id ?? reactId}-listbox`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [text, setText] = useState(value?.name ?? '')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  // Debounce + fetch — abortable pour eviter les races sur frappe rapide.
  // Skip uniquement si:
  //   - trop court
  //   - OU value vient deja d'une vraie selection (a des coords) ET le texte matche le nom
  //     => evite de re-fetch apres que l'utilisateur a cliquer une suggestion.
  useEffect(() => {
    const trimmed = text.trim()
    const isSelectedValue =
      value?.lat !== undefined && value?.lng !== undefined && trimmed === value.name
    if (trimmed.length < MIN_QUERY_LENGTH || isSelectedValue) {
      setSuggestions([])
      setLoading(false)
      setLoadFailed(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setLoading(true)
      setLoadFailed(false)
      searchPlaces(trimmed, {
        limit: 5,
        lang: i18n.language === 'en' ? 'en' : 'fr',
        signal: controller.signal,
      })
        .then((results) => {
          setSuggestions(results)
          setHighlight(results.length > 0 ? 0 : -1)
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          console.error('[PlaceAutocomplete] photon search failed', err)
          setSuggestions([])
          setLoadFailed(true)
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [text, value?.name, value?.lat, value?.lng, i18n.language])

  // Click outside : ferme le dropdown.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setText(v)
    setOpen(true)
    const trimmed = v.trim()
    if (!trimmed) {
      onChange(undefined)
    } else if (value?.name !== trimmed) {
      // Texte libre — la valeur peut etre ecrasee si l'utilisateur clique
      // ensuite sur une suggestion (geo + placeId).
      onChange({ name: trimmed })
    }
  }

  function selectSuggestion(s: PlaceSuggestion) {
    setText(s.place.name)
    onChange(s.place)
    setOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < suggestions.length) {
        e.preventDefault()
        selectSuggestion(suggestions[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Le dropdown s'affiche dès qu'on a tapé assez de chars ET qu'on est focused,
  // SAUF si la valeur actuelle est deja une vraie selection (coords + nom match)
  // — auquel cas pas de bruit, on a fait notre choix.
  const trimmed = text.trim()
  const isSelectedValue =
    value?.lat !== undefined && value?.lng !== undefined && trimmed === value.name
  const showDropdown = open && trimmed.length >= MIN_QUERY_LENGTH && !isSelectedValue
  const noResults = !loading && !loadFailed && suggestions.length === 0

  return (
    <div ref={containerRef} className="relative">
      <MapPin
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.8}
      />
      <Input
        id={id}
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          highlight >= 0 ? `${listId}-${highlight}` : undefined
        }
        className={cn('pl-9', className)}
      />

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {t('common.loading')}
            </li>
          )}
          {loadFailed && (
            <li className="px-3 py-2 text-sm text-destructive">
              {t('add.fields.placeFallback')}
            </li>
          )}
          {noResults && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {t('add.fields.placeNoResults')}
            </li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={highlight === i}
              onMouseDown={(e) => {
                // mouseDown au lieu de click pour eviter que l'Input perde le
                // focus avant qu'on traite la selection.
                e.preventDefault()
                selectSuggestion(s)
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                'flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-sm',
                highlight === i ? 'bg-accent text-accent-foreground' : 'text-foreground',
              )}
            >
              <span className="font-medium leading-tight">{s.label}</span>
              {s.secondary && (
                <span className="text-xs text-muted-foreground">{s.secondary}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
