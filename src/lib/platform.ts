import { Capacitor } from '@capacitor/core'

// Detecte si l'app tourne dans un "shell" applicatif (mobile natif via Capacitor
// ou desktop via Electron) par opposition au navigateur web classique.
//
// Sert de point de verite unique pour aiguiller l'UX (ex: home web marketing vs
// home app). Electron n'est pas encore branche dans le repo : la detection est
// prete (window.process.versions.electron) et s'activera des qu'il sera installe.
export function isAppShell(): boolean {
  if (Capacitor.isNativePlatform()) return true
  return isElectron()
}

// Electron expose process.versions.electron dans le renderer. On guarde l'acces
// car `process` n'existe pas en web pur.
function isElectron(): boolean {
  if (typeof window === 'undefined') return false
  const proc = (window as { process?: { versions?: { electron?: string } } }).process
  return Boolean(proc?.versions?.electron)
}
