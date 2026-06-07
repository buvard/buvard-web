import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell'
import { useMe, useSetDisplayGrade } from '@/lib/api/user'
import { findGradeForLevel, useGrades } from '@/lib/api/grade'
import { MAX_LEVEL, xpProgress, xpThresholdForLevel } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import type { Grade } from '@/types'

// Resoud le nom d'icone Lucide stocke en BDD vers le composant React.
// Fallback Sparkles si nom inconnu (defense contre une typo en BDD).
function resolveIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[name] ?? LucideIcons.Sparkles
}

export function SettingsLevelsPage() {
  const { t } = useTranslation()
  const me = useMe()
  const grades = useGrades()
  const setDisplay = useSetDisplayGrade()

  const xp = me.data?.gamification?.xp ?? 0
  const level = me.data?.gamification?.level ?? 1
  // Cle du grade affiche au reste du monde (override si choisi, sinon auto).
  const displayGradeKey = me.data?.gamification?.displayGrade ?? null
  const prog = xpProgress(xp, level)

  function handleSelectGrade(key: string | null) {
    setDisplay.mutate(key, {
      onSuccess: () => {
        toast.success(t('settings.levels.gradeSelected'))
      },
      onError: () => toast.error(t('settings.saveError')),
    })
  }

  return (
    <SettingsPageShell
      title={t('settings.levels.title')}
      subtitle={t('settings.levels.subtitle')}
    >
      {grades.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : grades.isError || !grades.data ? (
        <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('settings.levels.loadError')}
        </p>
      ) : (
        <LevelsContent
          grades={grades.data}
          level={level}
          xp={xp}
          nextThreshold={prog.nextThreshold}
          progress={prog.progress}
          displayGradeKey={displayGradeKey}
          onSelectGrade={handleSelectGrade}
          isSelecting={setDisplay.isPending}
          selectingKey={setDisplay.variables ?? undefined}
        />
      )}

      <p className="px-1 text-center text-xs text-muted-foreground">
        {t('settings.levels.maxLevelNote', { max: MAX_LEVEL })}
      </p>
    </SettingsPageShell>
  )
}

function LevelsContent({
  grades,
  level,
  xp,
  nextThreshold,
  progress,
  displayGradeKey,
  onSelectGrade,
  isSelecting,
  selectingKey,
}: {
  grades: Grade[]
  level: number
  xp: number
  nextThreshold: number
  progress: number
  displayGradeKey: string | null
  onSelectGrade: (key: string | null) => void
  isSelecting: boolean
  selectingKey?: string | null
}) {
  const { t } = useTranslation()
  // Grade derive du level — represente la progression actuelle.
  const autoGrade = findGradeForLevel(grades, level) ?? grades[0]
  // Grade reellement affiche (override visuel ou auto si null).
  const activeGrade =
    grades.find((g) => g.key === displayGradeKey) ?? autoGrade

  return (
    <>
      <CurrentStateCard
        level={level}
        xp={xp}
        nextThreshold={nextThreshold}
        progress={progress}
        grade={activeGrade}
        isOverride={displayGradeKey !== null && displayGradeKey !== autoGrade.key}
        onResetToAuto={() => onSelectGrade(null)}
        canResetToAuto={displayGradeKey !== null}
      />

      <Accordion
        type="single"
        collapsible
        defaultValue={activeGrade.key}
        className="space-y-2"
      >
        {grades.map((grade) => {
          const Icon = resolveIcon(grade.icon)
          const isCurrent = grade.key === activeGrade.key
          const isUnlocked = level >= grade.minLevel
          const isDisplayed = grade.key === displayGradeKey
          const isAutoGrade = grade.key === autoGrade.key && displayGradeKey === null
          const showAsActive = isDisplayed || isAutoGrade
          const selecting = isSelecting && selectingKey === grade.key
          return (
            <AccordionItem
              key={grade.key}
              value={grade.key}
              className={cn(
                'overflow-hidden rounded-xl border bg-card/30',
                isCurrent ? 'border-primary' : 'border-border',
                !isUnlocked && 'opacity-70',
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex w-full items-center gap-3 pr-2">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={
                      isCurrent
                        ? { backgroundColor: grade.color, color: '#fff' }
                        : { backgroundColor: `${grade.color}26`, color: grade.color }
                    }
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-base font-semibold leading-tight text-foreground">
                      {t(`settings.levels.grades.${grade.key}.name`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grade.minLevel === grade.maxLevel
                        ? t('settings.levels.gradeSingleLevel', { level: grade.minLevel })
                        : t('settings.levels.gradeRange', {
                            min: grade.minLevel,
                            max: grade.maxLevel,
                          })}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`settings.levels.grades.${grade.key}.desc`)}
                </p>
                {/* Bouton "Mettre en avant" — visible seulement si le grade
                    est debloque. Etat actuel highlighted, sinon CTA. */}
                {isUnlocked && (
                  <div className="mb-3">
                    {showAsActive ? (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {t('settings.levels.gradeActive')}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={selecting || isSelecting}
                        onClick={() => onSelectGrade(grade.key)}
                      >
                        {selecting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {t('settings.levels.gradeSetAsTitle')}
                      </Button>
                    )}
                  </div>
                )}
                <ul className="space-y-1">
                  {rangeLevels(grade.minLevel, grade.maxLevel).map((lvl) => {
                    const threshold = xpThresholdForLevel(lvl)
                    const isCurrentLevel = lvl === level
                    const unlocked = level >= lvl
                    return (
                      <li
                        key={lvl}
                        className={cn(
                          'flex items-center justify-between rounded-md px-3 py-1.5 text-sm',
                          isCurrentLevel
                            ? 'bg-primary/15 font-semibold text-foreground'
                            : unlocked
                              ? 'text-foreground/80'
                              : 'text-muted-foreground',
                        )}
                      >
                        <span>{t('profile.level', { level: lvl })}</span>
                        <span className="tabular-nums">{threshold} XP</span>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </>
  )
}

function CurrentStateCard({
  level,
  xp,
  nextThreshold,
  progress,
  grade,
  isOverride,
  onResetToAuto,
  canResetToAuto,
}: {
  level: number
  xp: number
  nextThreshold: number
  progress: number
  grade: Grade
  // Le grade affiche n'est pas celui derive du level (l'utilisateur a choisi
  // d'afficher un grade debloque different).
  isOverride: boolean
  onResetToAuto: () => void
  canResetToAuto: boolean
}) {
  const { t } = useTranslation()
  const Icon = resolveIcon(grade.icon)
  return (
    <section
      className="rounded-2xl border p-5"
      style={{
        // Gradient + bordure pilotes par la couleur du grade — le visuel
        // s'adapte naturellement aux 7 paliers.
        borderColor: `${grade.color}66`,
        background: `linear-gradient(135deg, ${grade.color}26 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
          style={{ backgroundColor: grade.color }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t(`settings.levels.grades.${grade.key}.name`)}
          </p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {t('profile.level', { level })}
          </p>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {xp} / {nextThreshold} XP
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: grade.color }}
          aria-hidden
        />
      </div>
      {/* Indicateur "override" : le user a choisi un grade different de celui
          de son level. On propose un raccourci pour revenir a l'auto. */}
      {isOverride && canResetToAuto && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary" strokeWidth={2} />
            {t('settings.levels.gradeOverrideHint')}
          </span>
          <Button size="sm" variant="ghost" onClick={onResetToAuto}>
            {t('settings.levels.gradeResetAuto')}
          </Button>
        </div>
      )}
    </section>
  )
}

function rangeLevels(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
