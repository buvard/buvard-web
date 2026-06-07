import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalizedPath } from '@/i18n/useLocalizedPath'
import { CameraCapture, type Capture } from './CameraCapture'
import { consumePendingCaptures, setPendingCaptures } from './pendingCaptures'

// Page plein ecran wrappant l'experience camera. Au "Done", stocke les Files
// et navigate vers /add ou le formulaire les recupere.
export function CameraCapturePage() {
  const navigate = useNavigate()
  const localizedPath = useLocalizedPath()

  // Si Add a push des photos existantes pour "modification", on les seed.
  // Sinon, on demarre vide.
  const initial = useMemo(() => consumePendingCaptures() ?? [], [])

  // Body NOIR pendant le mount (le preview natif n'est pas encore lance).
  // CameraCapture switchera vers .camera-ready une fois le preview en place.
  useEffect(() => {
    document.body.classList.add('camera-loading')
    return () => {
      document.body.classList.remove('camera-loading', 'camera-ready')
    }
  }, [])

  function goToForm(captures: Capture[]) {
    setPendingCaptures(captures)
    navigate(localizedPath('/add'), { replace: true })
  }

  return (
    <CameraCapture
      initial={initial}
      onDone={goToForm}
      onClose={() => navigate(localizedPath('/feed'), { replace: true })}
    />
  )
}
