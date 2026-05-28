import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'

// Live update self-hosted via R2 + endpoint backend.
//
// Backend (déjà implémenté côté API Buvard) :
//   GET /api/v1/app/latest-update?platform=ios|android&currentVersion=x.y.z
//     -> 200 { version, url, checksum, notes? }   si mise à jour dispo
//     -> 204                                       si déjà à jour ou aucune release active
//     -> 400                                       si query invalide
//
// Le bundle ZIP doit contenir le contenu de dist/ à la racine du zip
// (index.html + assets/ directement dans le zip, pas dans un sous-dossier dist/).
//
// Le checksum est un SHA-256 du zip — calculé côté backend depuis le buffer
// d'upload (pas confiance au client). Capgo vérifie le checksum avant
// d'appliquer le bundle, donc une altération MITM serait rejetée.

interface LatestUpdateResponse {
  version: string
  url: string
  checksum: string
  notes?: string
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
)

// Évite de check le serveur plus d'une fois par démarrage
let alreadyChecked = false

export async function notifyAppReady() {
  // À appeler AU PLUS TÔT après le 1er render — sinon Capgo rollback
  // automatiquement vers la version embarquée à la prochaine ouverture.
  if (!Capacitor.isNativePlatform()) return
  try {
    await CapacitorUpdater.notifyAppReady()
  } catch (err) {
    console.warn('[live-update] notifyAppReady failed', err)
  }
}

export async function checkForUpdate(
  onReady?: (info: { id: string; version: string; notes?: string }) => void,
) {
  if (!Capacitor.isNativePlatform()) return
  if (!API_URL) return
  if (alreadyChecked) return
  alreadyChecked = true

  try {
    const platform = Capacitor.getPlatform() // 'ios' | 'android' | 'web'
    const current = await CapacitorUpdater.current()
    const currentVersion = current.bundle.version

    const res = await fetch(
      `${API_URL}/api/v1/app/latest-update?platform=${platform}&currentVersion=${encodeURIComponent(
        currentVersion,
      )}`,
    )

    // 204 = pas de mise à jour dispo
    if (res.status === 204 || !res.ok) return

    const data = (await res.json()) as LatestUpdateResponse
    if (!data.version || !data.url) return
    if (data.version === currentVersion) return

    // Téléchargement en arrière-plan
    const bundle = await CapacitorUpdater.download({
      url: data.url,
      version: data.version,
      checksum: data.checksum,
    })

    // On ne set PAS le bundle immédiatement (ça ferait reload pendant que
    // l'utilisateur utilise l'app). On le marque, il sera chargé au prochain
    // démarrage de l'app.
    await CapacitorUpdater.next({ id: bundle.id })

    // Prévient l'UI qu'un bundle est prêt → permet de proposer un redémarrage immédiat
    onReady?.({ id: bundle.id, version: data.version, notes: data.notes })

    console.info(
      `[live-update] new version ${data.version} ready, will apply on next launch`,
    )
  } catch (err) {
    console.warn('[live-update] check failed', err)
  }
}

// Applique immédiatement un bundle déjà téléchargé : recharge la webview dessus.
export async function applyUpdateNow(id: string) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await CapacitorUpdater.set({ id })
  } catch (err) {
    console.warn('[live-update] set failed', err)
  }
}
