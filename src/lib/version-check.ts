import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

// Helpers de versioning pour la notification "Nouvelle version dispo" qui
// vise les utilisateurs ayant installe l'APK Android (cf
// .github/workflows/release-android.yml + page /download).
//
// La PWA et le web ne sont PAS concernes (la PWA se met a jour via SW au
// refresh Safari, et le web web est toujours a jour par definition).

const STORAGE_KEY_LAST_CHECK = 'buvard.versionCheck.lastAt'
const STORAGE_KEY_DISMISSED = 'buvard.versionCheck.dismissed'
const THROTTLE_MS = 24 * 60 * 60 * 1000 // 24h entre 2 verifications

// URL web de la page /download — l'utilisateur la rejoint via Safari/Chrome
// natif pour telecharger l'APK. Fallback prod si l'env var n'est pas definie.
function getDownloadUrl(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'https://buvard.app'
  return `${base.replace(/\/$/, '')}/fr/download`
}

// Compare deux versions SemVer "X.Y.Z".
// Retourne 1 si a > b, -1 si a < b, 0 si egale.
export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map((p) => parseInt(p, 10) || 0)
  const bParts = b.split('.').map((p) => parseInt(p, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const ai = aParts[i] ?? 0
    const bi = bParts[i] ?? 0
    if (ai > bi) return 1
    if (ai < bi) return -1
  }
  return 0
}

// Doit-on faire le check ? Throttle 24h pour ne pas spam l'API Github.
function shouldCheckNow(): boolean {
  const lastAt = localStorage.getItem(STORAGE_KEY_LAST_CHECK)
  if (!lastAt) return true
  const last = parseInt(lastAt, 10)
  if (!Number.isFinite(last)) return true
  return Date.now() - last > THROTTLE_MS
}

function markChecked(): void {
  localStorage.setItem(STORAGE_KEY_LAST_CHECK, String(Date.now()))
}

// Le user a-t-il dismiss cette version specifique ?
// On stocke la version dismiss pour ne plus la proposer mais reprompter sur
// une nouvelle version superieure.
function isVersionDismissed(version: string): boolean {
  return localStorage.getItem(STORAGE_KEY_DISMISSED) === version
}

export function dismissVersion(version: string): void {
  localStorage.setItem(STORAGE_KEY_DISMISSED, version)
}

// Recupere la version native via Capacitor App plugin. Echec silencieux si
// on est pas en native (renvoie null).
export async function getCurrentNativeVersion(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const info = await App.getInfo()
    return info.version
  } catch {
    return null
  }
}

export interface UpdateAvailable {
  current: string
  latest: string
  downloadUrl: string
  releaseUrl: string
}

// Verifie si une mise a jour native est disponible.
// Retourne null si :
// - on n'est pas en native
// - le throttle n'est pas ecoule
// - la version distante n'est pas superieure
// - le user a deja dismiss cette version
export async function checkNativeUpdate(): Promise<UpdateAvailable | null> {
  if (!Capacitor.isNativePlatform()) return null
  if (!shouldCheckNow()) return null

  const current = await getCurrentNativeVersion()
  if (!current) return null

  // On marque le check fait avant le fetch — meme en cas d'erreur reseau on
  // attendra 24h, pour eviter de hammer Github si l'API est down.
  markChecked()

  const repo =
    (import.meta.env.VITE_GITHUB_RELEASE_REPO as string | undefined) ?? 'buvard/buvard-web'
  let release: { tag_name?: string; html_url?: string }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    release = (await res.json()) as { tag_name?: string; html_url?: string }
  } catch {
    return null
  }

  const latest = release.tag_name?.replace(/^v/, '')
  if (!latest) return null
  if (compareVersions(latest, current) <= 0) return null
  if (isVersionDismissed(latest)) return null

  return {
    current,
    latest,
    downloadUrl: getDownloadUrl(),
    releaseUrl: release.html_url ?? `https://github.com/${repo}/releases/latest`,
  }
}

// Ouvre la page de download dans le navigateur natif (in-app browser
// Capacitor). L'utilisateur peut ensuite telecharger l'APK.
export async function openDownloadPage(url: string): Promise<void> {
  await Browser.open({ url })
}
