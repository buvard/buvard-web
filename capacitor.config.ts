import type { CapacitorConfig } from '@capacitor/cli'

// Config Capacitor — pointe sur le bundle Vite (dist/) et fixe l'identité de l'app.
// Le bundleId est partagé iOS/Android : "app.buvard".
const config: CapacitorConfig = {
  appId: 'app.buvard',
  appName: 'Buvard',
  webDir: 'dist',
  // Fond sombre aligné sur --background du thème (#0a0a0a). Évite le flash blanc au lancement.
  backgroundColor: '#0a0a0a',
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DEFAULT',
    },
  },
}

export default config
