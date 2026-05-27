import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { checkForUpdate, applyUpdateNow } from '@/lib/live-update'

// Lance la vérification de mise à jour OTA au démarrage. Quand un bundle est prêt,
// affiche un toast non-bloquant proposant de redémarrer pour l'appliquer tout de suite
// (sinon il s'appliquera de toute façon au prochain lancement).
export function UpdatePrompt() {
  const { t } = useTranslation()

  useEffect(() => {
    void checkForUpdate((info) => {
      toast(t('update.available'), {
        description: t('update.availableDesc'),
        duration: Infinity,
        action: {
          label: t('update.restart'),
          onClick: () => void applyUpdateNow(info.id),
        },
      })
    })
  }, [t])

  return null
}
