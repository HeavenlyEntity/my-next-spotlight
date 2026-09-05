'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import KingdomKodeMark from '@/components/brand/kingdom-kode-mark'
import logoMipi from '@/images/logos/mipi.svg'
import logoNewgen from '@/images/logos/newgen.png'
import logoSchwab from '@/images/logos/charles-schwab.png'
import logoDotCom from '@/images/logos/Dot_Com_Development.png'
import logoRlcanning from '@/images/logos/rlcanning-logo.png'

/* Record-block format ported from the RBP portfolio template's About page
   (github.com/DavidHDev/rbp-portfolio): labeled panels of logo rows, a
   collapsible Experience list with a blur fade, pill skills, and a stack
   chip wall. Restyled to amw tokens; physics stack omitted (no matter-js). */

const EXPERIENCE = [
  {
    company: 'Kingdom Kode',
    role: 'Co-Founder & CEO',
    period: '2025 - present',
    mark: KingdomKodeMark,
  },
  {
    company: 'MiPi',
    role: 'Founder & CEO',
    period: '2022 - present',
    logo: logoMipi,
  },
  {
    company: 'NewGen Business Solutions',
    role: 'Senior Lead Software Engineer',
    period: '2021 - 2025',
    logo: logoNewgen,
  },
  {
    company: 'Charles Schwab',
    role: 'Software Engineer',
    period: '2019 - 2021',
    logo: logoSchwab,
  },
  {
    company: 'Dot Com Development',
    role: 'Junior Software Engineer',
    period: '2018 - 2019',
    logo: logoDotCom,
  },
  {
    company: 'RL Canning (Honeywell)',
    role: 'Automation Programmer',
    period: '2017 - 2020',
    logo: logoRlcanning,
  },
]

const SKILLS = [
  'System Architecture',
  'Fractional CTO Work',
  'Full-Stack Engineering',
  'AI Product Development',
  'Industrial Automation',
  'Team Mentorship',
  'Business Strategy',
  'E-Commerce Builds',
]

const ROW_HEIGHT = 64
/* WHOLE ROWS ONLY, AND COUNTED NOT MEASURED.

   This was 2.5 rows of a hardcoded 64px, which failed twice. The half row left
   a sliver the toggle then sat on top of, covering 48px of a live row: at 375px
   "show more" was drawn straight across "Founder & CEO · 2022 - present". And
   64px is a desktop row; at 375px the role and its period wrap and a row runs
   about 97px, so a pixel height cut whole rows off regardless of the fraction.

   Slicing the array instead means the collapsed box is always exactly N rows
   tall at any text wrap, in any language, and the button's count can never
   disagree with what is on screen. */
const COLLAPSED_COUNT = 3

function RecordPanel({ label, children, padded = true }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="amw-kicker">{label}</h3>
      <div
        className={`border-[var(--amw-line)] bg-[color-mix(in_srgb,var(--amw-card-2)_70%,transparent)] rounded-2xl border ${
          padded ? 'p-2 sm:p-3' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function RecordRow({ logo, mark: Mark, title, subtitle, meta }) {
  return (
    <li
      className="border-[var(--amw-line)] bg-[var(--amw-card)] flex items-center gap-4 rounded-xl border p-2"
      style={{ minHeight: ROW_HEIGHT }}
    >
      {/* Tiles stay white in both themes so every logo reads on a
          consistent ground; marks therefore render in their dark form. */}
      <span className="ring-[var(--amw-line)] inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white ring-1">
        {Mark ? (
          <Mark className="h-7 w-7 text-zinc-900" />
        ) : logo ? (
          <Image src={logo} alt="" className="h-7 w-7" unoptimized />
        ) : (
          <span className="amw-mono text-[var(--amw-accent-ink)] text-xs font-semibold">
            {title.charAt(0)}
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </span>
        <span className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          {subtitle}
          {meta && (
            <span className="amw-mono ml-2 text-xs text-zinc-500 dark:text-zinc-500">
              {meta}
            </span>
          )}
        </span>
      </div>
    </li>
  )
}

export function ExperienceRecord() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const visible = open ? EXPERIENCE : EXPERIENCE.slice(0, COLLAPSED_COUNT)
  const hiddenCount = EXPERIENCE.length - COLLAPSED_COUNT

  return (
    <div className="flex flex-col gap-3">
      <h3 className="amw-kicker">Experience</h3>
      <div className="border-[var(--amw-line)] bg-[color-mix(in_srgb,var(--amw-card-2)_70%,transparent)] rounded-2xl border p-2 sm:p-3">
        <motion.div
          className="relative overflow-hidden"
          initial={false}
          animate={{ height: 'auto' }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <ul className="flex flex-col gap-2">
            {visible.map((entry) => (
              <RecordRow
                key={entry.company}
                logo={entry.logo}
                mark={entry.mark}
                title={entry.company}
                subtitle={entry.role}
                meta={entry.period}
              />
            ))}
          </ul>
        </motion.div>

        {/* In normal flow, always. Absolute positioning is what let this land
            on a row; a real row of its own cannot. 44px minimum because it is
            a touch target and the system already requires that. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="amw-mono hover:text-[var(--amw-accent-ink)] min-h-11 relative mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 bg-transparent text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 transition dark:text-zinc-200"
        >
          {open ? 'show less ↑' : `show ${hiddenCount} more ↓`}
        </button>
      </div>
    </div>
  )
}

export function EducationRecord() {
  return (
    <RecordPanel label="Education">
      <ul className="flex flex-col gap-2">
        {/* TODO: add the MBA school name when confirmed. */}
        <RecordRow
          title="MBA, Business Administration"
          subtitle="Bridging the boardroom and the codebase"
          meta="completed feb 2026"
        />
      </ul>
    </RecordPanel>
  )
}

export function SkillsRecord() {
  return (
    <RecordPanel label="What I do">
      <div className="flex flex-wrap gap-2 p-1">
        {SKILLS.map((skill) => (
          <span
            key={skill}
            className="border-[var(--amw-line)] bg-[var(--amw-card)] rounded-full border px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            {skill}
          </span>
        ))}
      </div>
    </RecordPanel>
  )
}
