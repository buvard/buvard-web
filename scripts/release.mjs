#!/usr/bin/env node
// Script de release OTA pour Buvard.
//
// Usage :
//   node scripts/release.mjs --version 1.2.4 --platform ios --notes "Fix login"
//   node scripts/release.mjs --version 1.2.4 --platform android --inactive
//
// Variables d'environnement requises (dans .env.release ou shell) :
//   API_URL       = https://api.buvard.app (sans slash final)
//   ADMIN_JWT     = JWT Clerk d'un utilisateur ayant role=admin
//
// Étapes :
//   1. Lit le dist/ existant (suppose que tu as déjà fait `npm run build`)
//   2. Zip dist/* à la racine du zip (pas de sous-dossier dist/)
//   3. POST multipart vers /api/v1/admin/releases avec
//      file + version + platform + notes + active

import { createWriteStream, existsSync, readFileSync, statSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { ZipArchive } from 'archiver'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

// ---- Parsing args minimal ----
function parseArgs() {
  const args = { active: true }
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--version') args.version = argv[++i]
    else if (k === '--platform') args.platform = argv[++i]
    else if (k === '--target') args.target = argv[++i]
    else if (k === '--notes') args.notes = argv[++i]
    else if (k === '--inactive') args.active = false
    else if (k === '--help' || k === '-h') {
      printHelp()
      process.exit(0)
    }
  }
  return args
}

function printHelp() {
  console.log(`
Buvard OTA release

Le plus simple :
  npm run release:prod    -- --version 1.2.4 --notes "..."
  npm run release:staging -- --version 1.2.4

Direct :
  node scripts/release.mjs --version 1.2.4 [--target prod|staging] [--platform ios|android|all] [--notes "..."] [--inactive]
  (--target défaut: prod · --platform défaut: les deux)

Env requis — .env.release (prod) / .env.release.staging (staging) :
  API_URL    URL de l'API
  ADMIN_JWT  JWT d'un user role=admin
`)
}

// ---- Charge les creds de release : .env.release (prod) ou .env.release.staging ----
function loadDotenv(target) {
  const file = target === 'staging' ? '.env.release.staging' : '.env.release'
  const envFile = resolve(ROOT, file)
  if (!existsSync(envFile)) return
  const content = readFileSync(envFile, 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

// ---- Zippe dist/ à plat dans un fichier tmp ----
async function zipDist(outputPath) {
  if (!existsSync(DIST)) {
    throw new Error(
      `Le dossier dist/ n'existe pas. Lance d'abord "npm run build".`,
    )
  }
  await new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = new ZipArchive({ zlib: { level: 9 } })
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    // false en 2e param = inclut le contenu de dist/ à la racine du zip,
    // pas le dossier "dist/" lui-même
    archive.directory(DIST, false)
    void archive.finalize()
  })
}

// ---- POST multipart vers /admin/releases ----
async function uploadRelease({ apiUrl, jwt, zipPath, version, platform, notes, active }) {
  const buf = readFileSync(zipPath)
  const fd = new FormData()
  fd.append(
    'file',
    new Blob([buf], { type: 'application/zip' }),
    `bundle-${version}.zip`,
  )
  fd.append('version', version)
  fd.append('platform', platform)
  fd.append('active', active ? 'true' : 'false')
  if (notes) fd.append('notes', notes)

  const res = await fetch(`${apiUrl}/api/v1/admin/releases`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: fd,
  })

  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body?.error?.message
        ? body.error.message
        : `HTTP ${res.status}`
    throw new Error(`Upload failed: ${message}`)
  }
  return body
}

// ---- Main ----
async function main() {
  const args = parseArgs()
  const target = args.target ?? 'prod'

  if (!['prod', 'staging'].includes(target)) {
    console.error(`Erreur: --target doit être "prod" ou "staging"`)
    process.exit(1)
  }

  // Charge les creds (.env.release ou .env.release.staging) selon la cible
  loadDotenv(target)

  // Plateformes : par défaut les deux (ios + android), ou une seule via --platform
  const platforms =
    !args.platform || args.platform === 'all'
      ? ['ios', 'android']
      : [args.platform]
  if (!platforms.every((p) => ['ios', 'android'].includes(p))) {
    console.error(`Erreur: --platform doit être "ios", "android" ou "all"`)
    process.exit(1)
  }

  if (!args.version || !/^\d+\.\d+\.\d+$/.test(args.version)) {
    console.error(`Erreur: --version requis au format SemVer X.Y.Z`)
    process.exit(1)
  }

  const credsFile = target === 'staging' ? '.env.release.staging' : '.env.release'
  const apiUrl = process.env.API_URL?.replace(/\/$/, '')
  const jwt = process.env.ADMIN_JWT
  if (!apiUrl) {
    console.error(`Erreur: API_URL manquant (${credsFile})`)
    process.exit(1)
  }
  if (!jwt) {
    console.error(`Erreur: ADMIN_JWT manquant (${credsFile})`)
    process.exit(1)
  }

  // Le bundle web est identique pour les 2 plateformes → on zippe une seule fois
  const zipPath = resolve(ROOT, `bundle-${args.version}.zip`)
  console.log(`→ [${target}] Zip de dist/ vers ${zipPath}`)
  await zipDist(zipPath)
  const size = statSync(zipPath).size
  console.log(`  ${(size / 1024 / 1024).toFixed(2)} MB`)
  if (size > 50 * 1024 * 1024) {
    console.error(`Erreur: bundle > 50 MB (limite backend)`)
    process.exit(1)
  }

  try {
    for (const platform of platforms) {
      console.log(
        `→ Upload ${apiUrl}/api/v1/admin/releases (platform=${platform}, version=${args.version}, active=${args.active})`,
      )
      const result = await uploadRelease({
        apiUrl,
        jwt,
        zipPath,
        version: args.version,
        platform,
        notes: args.notes,
        active: args.active,
      })
      console.log(`✓ Release ${args.version} (${platform}) publiée sur ${target}`)
      if (result?.release?.checksum) {
        console.log(`  checksum: ${result.release.checksum}`)
      }
    }
  } finally {
    await unlink(zipPath).catch(() => {})
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message ?? err}`)
  process.exit(1)
})
