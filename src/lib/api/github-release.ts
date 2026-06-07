import { useQuery } from '@tanstack/react-query'

// Repo public utilise pour distribuer les APK Android. Override possible via
// VITE_GITHUB_RELEASE_REPO (utile en staging si on veut pointer ailleurs).
const REPO = (import.meta.env.VITE_GITHUB_RELEASE_REPO as string | undefined) ?? 'buvard/buvard-web'

export interface GithubReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface GithubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  assets: GithubReleaseAsset[]
}

// Hook qui fetch la latest release publique du repo Buvard sur Github.
// Sans auth (limite 60 req/h par IP, largement suffisant pour le trafic page).
// Cache 1h cote react-query — pas la peine de re-fetch a chaque montage.
export function useLatestRelease() {
  return useQuery<GithubRelease>({
    queryKey: ['github-release', REPO, 'latest'],
    queryFn: async () => {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/releases/latest`,
        {
          headers: { Accept: 'application/vnd.github+json' },
        },
      )
      if (!res.ok) {
        throw new Error(`Github API ${res.status}`)
      }
      return res.json() as Promise<GithubRelease>
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
  })
}

// Extrait la version du tag (v1.2.3 -> 1.2.3).
export function versionFromTag(tag: string): string {
  return tag.replace(/^v/, '')
}

// Trouve l'asset APK Android dans une release.
// Convention de nommage : buvard-vX.Y.Z.apk (cf .github/workflows/release-android.yml).
export function findAndroidApk(release: GithubRelease): GithubReleaseAsset | undefined {
  return release.assets.find((a) => a.name.toLowerCase().endsWith('.apk'))
}
