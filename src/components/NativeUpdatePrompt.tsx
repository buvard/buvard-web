import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  checkNativeUpdate,
  dismissVersion,
  openDownloadPage,
} from '@/lib/version-check'

// Verifie au boot si une nouvelle version native (APK Android) est disponible
// sur Github Releases. Si oui, affiche un toast non-bloquant avec un bouton
// "Telecharger" qui ouvre la page /download dans le navigateur natif.
//
// Throttle : 1 check max par 24h (cf version-check.ts).
// Dismiss : si le user ferme le toast, on stocke la version pour ne plus
// la proposer (mais reprompter sur une version superieure).
//
// Diff avec <UpdatePrompt /> (OTA Capgo) :
// - UpdatePrompt : update du bundle JS (web), s'applique au reboot de l'app
// - NativeUpdatePrompt : update du binaire APK, l'user doit le telecharger
//   manuellement depuis Github via /download.
export function NativeUpdatePrompt() {
  const { t } = useTranslation()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const update = await checkNativeUpdate()
      if (cancelled || !update) return

      toast(t('update.native.title', { version: update.latest }), {
        description: t('update.native.description', { current: update.current }),
        duration: Infinity,
        action: {
          label: t('update.native.cta'),
          onClick: () => void openDownloadPage(update.downloadUrl),
        },
        onDismiss: () => dismissVersion(update.latest),
      })
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  return null
}
