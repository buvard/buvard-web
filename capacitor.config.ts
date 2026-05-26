import type { CapacitorConfig } from '@capacitor/cli'

// Config Capacitor — pointe sur le bundle Vite (dist/) et fixe l'identité de l'app.
// Le bundleId est partagé iOS/Android : "app.buvard".
const config: CapacitorConfig = {
  appId: 'app.buvard',
  appName: 'Buvard',
  webDir: 'dist',
  // backgroundColor en hex avec alpha (AARRGGBB côté Android). Aligné avec --background du thème.
  backgroundColor: '#ffffff',
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#ffffff',
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
