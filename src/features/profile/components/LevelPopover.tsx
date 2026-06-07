import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Camera,
  CheckCircle2,
  Flame,
  Heart,
  Image as ImageIcon,
  MapPin,
  PencilLine,
  Sparkles,
  Trophy,
  UserPlus,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  STREAK_MILESTONES,
  XP_BONUS_AROMAS,
  XP_BONUS_LONG_NOTES,
  XP_BONUS_PLACE,
  XP_FIRST_FOLLOWER,
  XP_FIRST_TASTING,
  XP_ONBOARDING,
  XP_PER_FOLLOWER,
  XP_PER_LIKE_RECEIVED,
  XP_PER_PHOTO_ADDITIONAL,
  XP_PER_TASTING,
  XP_PROFILE_COMPLETE,
  xpProgress,
  xpThresholdForLevel,
} from '@/lib/gamification'
import { cn } from '@/lib/utils'

interface Props {
  level: number
  xp: number
  streak?: number
  longestStreak?: number
  // Le trigger (la barre XP) est passe en children — le popover s'ancre dessous.
  children: ReactNode
}

const TIERS_AHEAD = 3

// Popup explicative ancree sous la barre XP. Detail des actions qui rapportent,
// paliers a venir, streak. Apparait en click, se ferme au click outside / Esc.
export function LevelPopover({ level, xp, streak, longestStreak, children }: Props) {
  const { t } = useTranslation()
  const prog = xpProgress(xp, level)

  const tiers = Array.from({ length: TIERS_AHEAD + 1 }, (_, i) => {
    const l = level + i
    return { level: l, threshold: xpThresholdForLevel(l) }
  })

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      {/* max-h compact (22rem) + fallback sur la hauteur dispo via Radix :
          on plafonne a 22rem (352px) mais jamais plus que ce que le viewport
          autorise. Le contenu scrolle en interne. */}
      <PopoverContent
        align="start"
        className="w-80 max-h-[min(22rem,var(--radix-popover-content-available-height))] space-y-4"
      >
        {/* Recap */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('profile.levelDialog.title')}
          </p>
          <p className="text-base font-semibold text-foreground">
            {t('profile.levelDialog.toNext', {
              xp: prog.nextThreshold - xp,
              level: level + 1,
            })}
          </p>
        </div>

        {/* === Bonus a la creation === */}
        <RuleSection title={t('profile.levelDialog.section.tasting')}>
          <Rule icon={Wine} label={t('profile.levelDialog.rules.tasting')} xp={XP_PER_TASTING} />
          <Rule icon={MapPin} label={t('profile.levelDialog.rules.place')} xp={XP_BONUS_PLACE} />
          <Rule
            icon={PencilLine}
            label={t('profile.levelDialog.rules.longNotes')}
            xp={XP_BONUS_LONG_NOTES}
          />
          <Rule icon={Sparkles} label={t('profile.levelDialog.rules.aromas')} xp={XP_BONUS_AROMAS} />
          <Rule
            icon={ImageIcon}
            label={t('profile.levelDialog.rules.extraPhoto')}
            xp={XP_PER_PHOTO_ADDITIONAL}
            perUnit
          />
        </RuleSection>

        {/* === Engagement recu === */}
        <RuleSection title={t('profile.levelDialog.section.social')}>
          <Rule
            icon={Heart}
            label={t('profile.levelDialog.rules.likeReceived')}
            xp={XP_PER_LIKE_RECEIVED}
          />
          <Rule
            icon={UserPlus}
            label={t('profile.levelDialog.rules.follower')}
            xp={XP_PER_FOLLOWER}
          />
        </RuleSection>

        {/* === Milestones one-shot === */}
        <RuleSection title={t('profile.levelDialog.section.milestones')}>
          <Rule
            icon={CheckCircle2}
            label={t('profile.levelDialog.rules.onboarding')}
            xp={XP_ONBOARDING}
            oneShot
          />
          <Rule
            icon={Wine}
            label={t('profile.levelDialog.rules.firstTasting')}
            xp={XP_FIRST_TASTING}
            oneShot
          />
          <Rule
            icon={UserPlus}
            label={t('profile.levelDialog.rules.firstFollower')}
            xp={XP_FIRST_FOLLOWER}
            oneShot
          />
          <Rule
            icon={Camera}
            label={t('profile.levelDialog.rules.profileComplete')}
            xp={XP_PROFILE_COMPLETE}
            oneShot
          />
          {Object.entries(STREAK_MILESTONES).map(([days, bonus]) => (
            <Rule
              key={days}
              icon={Trophy}
              label={t('profile.levelDialog.rules.streakMilestone', { days })}
              xp={bonus}
              oneShot
            />
          ))}
        </RuleSection>

        {/* === Streak === */}
        {streak != null && streak > 0 && (
          <section className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3">
            <Flame className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t('profile.streak', { count: streak })}
                </span>
                {longestStreak != null && longestStreak > streak && (
                  <span className="text-[11px] text-muted-foreground">
                    {t('profile.streakLongest', { count: longestStreak })}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('profile.levelDialog.streakHint')}
              </p>
            </div>
          </section>
        )}

        {/* === Paliers a venir === */}
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('profile.levelDialog.tiers')}
          </h3>
          <ul className="space-y-0.5">
            {tiers.map((tier) => {
              const isCurrent = tier.level === level
              return (
                <li
                  key={tier.level}
                  className={cn(
                    'flex items-center justify-between rounded px-2 py-1.5 text-xs',
                    isCurrent
                      ? 'bg-primary/15 font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <span>{t('profile.level', { level: tier.level })}</span>
                  <span className="tabular-nums">{tier.threshold} XP</span>
                </li>
              )
            })}
          </ul>
        </section>
      </PopoverContent>
    </Popover>
  )
}

function RuleSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </section>
  )
}

function Rule({
  icon: Icon,
  label,
  xp,
  perUnit,
  oneShot,
}: {
  icon: LucideIcon
  label: string
  xp: number
  // Suffixe "× N" pour rappeler que le bonus est par occurrence (ex: photo).
  perUnit?: boolean
  // Suffixe "unique" pour marquer un bonus one-shot.
  oneShot?: boolean
}) {
  const { t } = useTranslation()
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/30 px-2.5 py-1.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 text-xs text-foreground">{label}</span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
        +{xp}
        {perUnit && (
          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
            {' '}
            {t('profile.levelDialog.perUnit')}
          </span>
        )}
        {oneShot && (
          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
            {' '}
            {t('profile.levelDialog.oneShot')}
          </span>
        )}
      </span>
    </li>
  )
}
