#!/usr/bin/env node
// Bump de version coherent pour l'app Buvard.
//
// Usage :
//   node scripts/version.mjs patch          1.3.0 -> 1.3.1
//   node scripts/version.mjs minor          1.3.0 -> 1.4.0
//   node scripts/version.mjs major          1.3.0 -> 2.0.0
//   node scripts/version.mjs 1.5.2          set explicit
//   node scripts/version.mjs patch --push   bump + commit + tag + push
//
// Effet :
//   1. Bump version dans package.json (+ package-lock.json si present)
//   2. Sync versionName et incremente versionCode dans
//      android/app/build.gradle (+1 a chaque bump, sequentiel)
//   3. Cree un commit "chore(release): vX.Y.Z" + tag vX.Y.Z
//   4. (avec --push) git push origin <branch> --follow-tags
//
// Le tag vX.Y.Z declenche le workflow .github/workflows/release-android.yml
// qui build et publie l'APK signe en Github Release.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PKG_PATH = resolve(ROOT, 'package.json')
const LOCK_PATH = resolve(ROOT, 'package-lock.json')
const GRADLE_PATH = resolve(ROOT, 'android/app/build.gradle')

function parseArgs() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage:
  node scripts/version.mjs <patch|minor|major|X.Y.Z> [--push]

Options:
  --push    Pousser le commit + tag vers origin a la fin
  --help    Affiche cette aide
`)
    process.exit(0)
  }
  const bump = argv[0]
  const push = argv.includes('--push')
  return { bump, push }
}

function semverNext(current, bump) {
  // Si "X.Y.Z" explicit, on l'utilise direct
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump

  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current)
  if (!m) throw new Error(`Version actuelle invalide : ${current}`)
  let [, maj, min, pat] = m.map(Number)
  if (bump === 'patch') pat += 1
  else if (bump === 'minor') {
    min += 1
    pat = 0
  } else if (bump === 'major') {
    maj += 1
    min = 0
    pat = 0
  } else {
    throw new Error(`Bump invalide : ${bump} (attendu patch/minor/major/X.Y.Z)`)
  }
  return `${maj}.${min}.${pat}`
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}
function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n')
}

function bumpPackageJson(nextVersion) {
  const pkg = readJson(PKG_PATH)
  pkg.version = nextVersion
  writeJson(PKG_PATH, pkg)
  // Si lockfile, on met aussi a jour le champ version du root
  if (existsSync(LOCK_PATH)) {
    const lock = readJson(LOCK_PATH)
    lock.version = nextVersion
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = nextVersion
    }
    writeJson(LOCK_PATH, lock)
  }
}

function bumpGradle(nextVersion) {
  const content = readFileSync(GRADLE_PATH, 'utf-8')
  const codeMatch = /versionCode\s+(\d+)/.exec(content)
  if (!codeMatch) throw new Error('versionCode introuvable dans build.gradle')
  const currentCode = Number(codeMatch[1])
  const nextCode = currentCode + 1
  let next = content.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
  next = next.replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`)
  writeFileSync(GRADLE_PATH, next)
  return { currentCode, nextCode }
}

function exec(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim()
}

function assertCleanWorkdir() {
  const status = exec('git status --porcelain')
  if (status) {
    console.error(
      `✗ Working directory non clean. Commit ou stash tes changements d'abord.`,
    )
    process.exit(1)
  }
}

function main() {
  const { bump, push } = parseArgs()

  assertCleanWorkdir()

  const pkg = readJson(PKG_PATH)
  const current = pkg.version
  const next = semverNext(current, bump)
  if (current === next) {
    console.error(`✗ Aucun changement : version deja a ${current}`)
    process.exit(1)
  }

  console.log(`→ ${current} → ${next}`)

  bumpPackageJson(next)
  const { currentCode, nextCode } = bumpGradle(next)
  console.log(`  package.json     ${current} → ${next}`)
  console.log(`  build.gradle     versionName "${next}", versionCode ${currentCode} → ${nextCode}`)

  exec(`git add ${PKG_PATH} ${GRADLE_PATH}` + (existsSync(LOCK_PATH) ? ` ${LOCK_PATH}` : ''))
  exec(`git commit -m "chore(release): v${next}"`)
  exec(`git tag -a v${next} -m "Release v${next}"`)
  console.log(`✓ Commit + tag v${next} crees`)

  if (push) {
    const branch = exec('git rev-parse --abbrev-ref HEAD')
    console.log(`→ Push origin ${branch} --follow-tags`)
    execSync(`git push origin ${branch} --follow-tags`, {
      cwd: ROOT,
      stdio: 'inherit',
    })
    console.log(`✓ Push complete. Le workflow Github va build l'APK.`)
  } else {
    console.log(`\n→ Prochain step :`)
    console.log(`  git push origin <branch> --follow-tags`)
    console.log(`  Le workflow .github/workflows/release-android.yml va declencher.`)
  }
}

try {
  main()
} catch (err) {
  console.error(`✗ ${err.message ?? err}`)
  process.exit(1)
}
