import { useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserLink } from '@/components/UserLink'
import { useSearchUsers } from '@/lib/api/user'

interface UserSearchProps {
  // Focus l'input au montage. Utile quand le composant est revele suite a
  // un toggle (ex: top bar du profil).
  autoFocus?: boolean
  // Appele quand l'utilisateur selectionne un resultat OU clique en dehors.
  // Permet au parent de refermer un mode "search expanded".
  onClose?: () => void
  // Ref externe sur l'input — permet au parent de declencher un focus
  // imperatif sans remonter l'arbre.
  inputRef?: RefObject<HTMLInputElement | null>
}

// Barre de recherche d'utilisateurs façon X : input + dropdown de résultats cliquables.
// Branchée sur /users/search (debounce 250ms, >= 2 car.).
// Le dropdown se ferme au clic en dehors et après sélection d'un résultat.
export function UserSearch({ autoFocus, onClose, inputRef: externalInputRef }: UserSearchProps = {}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [active, setActive] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const localInputRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef ?? localInputRef

  // Auto-focus a l'ouverture si demande.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus, inputRef])

  // Debounce de la saisie
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 250)
    return () => clearTimeout(id)
  }, [value])

  // Ferme le dropdown au clic en dehors du composant.
  // Notifie aussi le parent (utile pour fermer un mode "search expanded").
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setActive(false)
        onClose?.()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  const { data, isFetching } = useSearchUsers(debounced)
  const showResults = active && debounced.trim().length >= 2

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 transition-colors focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setActive(true)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label={t('common.clear')}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {data && data.length > 0 ? (
            data.map((u) => (
              <UserLink
                key={u.id}
                username={u.username}
                onClick={() => {
                  setActive(false)
                  onClose?.()
                }}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-card"
              >
                <Avatar className="h-9 w-9">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                  <AvatarFallback>
                    {(u.displayName ?? u.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.displayName ?? u.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{u.username}
                  </p>
                </div>
              </UserLink>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {isFetching ? t('search.searching') : t('search.empty')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
