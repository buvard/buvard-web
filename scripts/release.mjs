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
import archiver from 'archiver'

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
  // eslint-disable-next-line no-console
  console.log(`
Buvard OTA release

Usage:
  node scripts/release.mjs --version 1.2.4 --platform ios [--notes "..."] [--inactive]

Env requis:
  API_URL    URL de l'API (ex: https://api.buvard.app)
  ADMIN_JWT  JWT d'un user role=admin
`)
}

// ---- Charge .env.release si présent (pratique pour stocker ADMIN_JWT en local) ----
function loadDotenv() {
  const envFile = resolve(ROOT, '.env.release')
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
    const archive = archiver('zip', { zlib: { level: 9 } })
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
  loadDotenv()
  const args = parseArgs()

  if (!args.version || !args.platform) {
    // eslint-disable-next-line no-console
    console.error('Erreur: --version et --platform sont requis')
    printHelp()
    process.exit(1)
  }

  if (!['ios', 'android'].includes(args.platform)) {
    // eslint-disable-next-line no-console
    console.error(`Erreur: --platform doit être "ios" ou "android"`)
    process.exit(1)
  }

  if (!/^\d+\.\d+\.\d+$/.test(args.version)) {
    // eslint-disable-next-line no-console
    console.error(`Erreur: --version doit suivre le format SemVer X.Y.Z`)
    process.exit(1)
  }

  const apiUrl = process.env.API_URL?.replace(/\/$/, '')
  const jwt = process.env.ADMIN_JWT
  if (!apiUrl) {
    // eslint-disable-next-line no-console
    console.error('Erreur: API_URL manquant (env ou .env.release)')
    process.exit(1)
  }
  if (!jwt) {
    // eslint-disable-next-line no-console
    console.error('Erreur: ADMIN_JWT manquant (env ou .env.release)')
    process.exit(1)
  }

  const zipPath = resolve(ROOT, `bundle-${args.version}-${args.platform}.zip`)

  // eslint-disable-next-line no-console
  console.log(`→ Zip de dist/ vers ${zipPath}`)
  await zipDist(zipPath)
  const size = statSync(zipPath).size
  // eslint-disable-next-line no-console
  console.log(`  ${(size / 1024 / 1024).toFixed(2)} MB`)

  if (size > 50 * 1024 * 1024) {
    // eslint-disable-next-line no-console
    console.error(`Erreur: bundle > 50 MB (limite backend)`)
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(
    `→ Upload vers ${apiUrl}/api/v1/admin/releases (platform=${args.platform}, version=${args.version}, active=${args.active})`,
  )
  try {
    const result = await uploadRelease({
      apiUrl,
      jwt,
      zipPath,
      version: args.version,
      platform: args.platform,
      notes: args.notes,
      active: args.active,
    })
    // eslint-disable-next-line no-console
    console.log(`✓ Release ${args.version} (${args.platform}) publiée`)
    if (result?.release?.checksum) {
      // eslint-disable-next-line no-console
      console.log(`  checksum: ${result.release.checksum}`)
    }
  } finally {
    // Cleanup local
    await unlink(zipPath).catch(() => {})
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`✗ ${err.message ?? err}`)
  process.exit(1)
})
