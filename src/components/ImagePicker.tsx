import { useRef, useState } from 'react'

// MIMES acceptés par le backend (sharp gère jpeg/png/webp/heic).
// HEIC n'a pas toujours de mime fiable côté browser (Safari) — on accepte
// l'extension en fallback côté front.
const ACCEPTED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export interface ImagePickerValidation {
  ok: boolean
  reason?: 'mime' | 'size'
}

// eslint-disable-next-line react-refresh/only-export-components -- helper co-localisé avec le composant qui l'utilise
export function validateImageFile(file: File): ImagePickerValidation {
  const mimeOk =
    ACCEPTED_MIMES.includes(file.type) ||
    ACCEPTED_EXTS.some((ext) => file.name.toLowerCase().endsWith(ext))
  if (!mimeOk) return { ok: false, reason: 'mime' }
  if (file.size > MAX_SIZE) return { ok: false, reason: 'size' }
  return { ok: true }
}

interface Props {
  onPick: (file: File) => void
  onRejected?: (reason: 'mime' | 'size') => void
  disabled?: boolean
  children: (open: () => void) => React.ReactNode
}

// Wrapper headless qui expose un trigger pour ouvrir le file picker.
// Le children est une render-prop qui reçoit la fonction open().
// Validation taille + MIME centralisée pour éviter de dupliquer.
export function ImagePicker({ onPick, onRejected, disabled, children }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(0) // force re-render pour pas se lock

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-sélectionner le même fichier
    if (!file) return
    const v = validateImageFile(file)
    if (!v.ok) {
      onRejected?.(v.reason!)
      return
    }
    onPick(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIMES.concat(ACCEPTED_EXTS).join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
        // Sur iOS Capacitor permet de choisir entre photothèque et appareil
        // photo natif (selon le wrapper). Sur web standard ça reste un dialog.
      />
      {/* eslint-disable-next-line react-hooks/refs -- callback declenche par event handler user (clic), pas pendant le render */}
      {children(() => {
        setOpen((n) => n + 1)
        inputRef.current?.click()
      })}
      {/* dummy span pour utiliser open et éviter warning unused */}
      <span data-open={open} className="hidden" aria-hidden />
    </>
  )
}

export const IMAGE_MAX_SIZE_MB = 10
