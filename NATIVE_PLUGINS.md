# Plugins natifs Capacitor — Buvard

Liste des plugins pré-installés et configurés (iOS + Android) pour limiter les
redistributions stores au strict minimum.

**Règle d'or** : on installe un plugin **avant** d'avoir besoin de la feature.
Une fois en place, le code TS peut s'y connecter via une simple maj OTA (voir [LIVE_UPDATES.md](LIVE_UPDATES.md)).

## Plugins installés

| Plugin | Version | Permissions iOS | Permissions Android |
|---|---|---|---|
| `@capacitor/app` | 8.1.0 | — | — |
| `@capacitor/browser` | 8.0.3 | — | — |
| `@capacitor/camera` | 8.2.0 | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` | `CAMERA`, `READ_MEDIA_IMAGES`, `READ/WRITE_EXTERNAL_STORAGE` (legacy) |
| `@capacitor/geolocation` | 8.2.0 | `NSLocationWhenInUseUsageDescription` | `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` |
| `@capacitor/haptics` | 8.0.2 | — | — |
| `@capacitor/keyboard` | 8.0.3 | — | — |
| `@capacitor/network` | 8.0.1 | — | `ACCESS_NETWORK_STATE` |
| `@capacitor/push-notifications` | 8.1.1 | — (l'OS demande au runtime) | `POST_NOTIFICATIONS` (Android 13+) |
| `@capacitor/share` | 8.0.1 | — | — |
| `@capacitor/splash-screen` | 8.0.1 | — | — |
| `@capacitor/status-bar` | 8.0.2 | — | — |
| `@capgo/capacitor-updater` | 8.47.3 | — | — |

## Exemples d'usage

### Camera

```ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

const photo = await Camera.getPhoto({
  quality: 85,
  allowEditing: false,
  resultType: CameraResultType.Base64,
  source: CameraSource.Prompt, // demande à l'user : caméra ou photothèque
})
// photo.base64String -> envoyer en multipart vers POST /me/avatar
```

### Geolocation

```ts
import { Geolocation } from '@capacitor/geolocation'

const pos = await Geolocation.getCurrentPosition({
  enableHighAccuracy: false,
  timeout: 5000,
})
// pos.coords.latitude, pos.coords.longitude
```

### Push Notifications

```ts
import { PushNotifications } from '@capacitor/push-notifications'

// Demande la permission (iOS et Android 13+)
const perm = await PushNotifications.requestPermissions()
if (perm.receive === 'granted') {
  await PushNotifications.register()
}

// Écoute le token FCM/APNs
PushNotifications.addListener('registration', (token) => {
  // POST le token à ton backend pour l'associer à l'user
})
```

Setup côté backend : Firebase Cloud Messaging (gratuit) pour Android, APNs (compris dans le compte Apple Developer) pour iOS. Pas encore wiré côté backend Buvard.

### Share

```ts
import { Share } from '@capacitor/share'

await Share.share({
  title: 'Mon dernier coup de cœur',
  text: 'Tu dois goûter ça : Talisker 10 ans 8.5/10',
  url: 'https://buvard.app/u/leo.k/tastings/abc123',
  dialogTitle: 'Partager',
})
```

### Browser (in-app safari/chrome custom tab)

```ts
import { Browser } from '@capacitor/browser'

await Browser.open({ url: 'https://buvard.app/legal/terms' })
```

### Network

```ts
import { Network } from '@capacitor/network'

const status = await Network.getStatus()
// status.connected, status.connectionType ('wifi' | 'cellular' | 'none')

Network.addListener('networkStatusChange', (status) => {
  // afficher / cacher un bandeau "Hors ligne"
})
```

## Ce qui force quand même une redistribution stores

Même avec tout pré-installé, tu redistribues si tu :

- **Ajoutes un nouveau plugin** Capacitor non listé ci-dessus
- Changes la **version native** (target SDK, iOS deployment target)
- Modifies `capacitor.config.ts` côté `backgroundColor`, `splashScreen`, `appId`, etc.
- Mets à jour un plugin existant (ex. `@capacitor/camera` v8 → v9)
- Ajoutes une **permission iOS/Android** non listée ci-dessus
- Modifies les icônes, le splash, le launchScreen

## Ce qui passe par OTA (live update)

Toute modification dans `src/` qui n'introduit pas un nouveau plugin natif :

- Refonte UI / nouveaux écrans
- Logique métier en TS
- Appels API
- i18n
- Hooks React
- Utilisation des plugins déjà déclarés (ex. activer Camera dans la page Add)

## Workflow recommandé

1. **Code la feature en TS** en utilisant les plugins déjà présents
2. `npm run build`
3. Push le bundle via le script OTA (voir LIVE_UPDATES.md)
4. Les users récupèrent la maj au prochain démarrage

Si tu te rends compte qu'il manque un plugin → installe-le, ajoute la perm, et redistribue une **seule fois** par les stores. Toutes les itérations suivantes redeviennent OTA.

## Justification des permissions (pour la review stores)

Quand tu soumets à App Store / Play Console, voici les justifications à donner :

- **Camera** : "Permet aux utilisateurs de prendre en photo les bouteilles et étiquettes pour leurs dégustations."
- **Photo Library** : "Permet aux utilisateurs de choisir une photo existante pour leurs dégustations et leur profil."
- **Location** : "Permet de pré-remplir le lieu d'une dégustation et de découvrir les dégustations à proximité."
- **Push Notifications** : "Avertit les utilisateurs des activités de leurs amis (nouvelle dégustation, like, commentaire)."
