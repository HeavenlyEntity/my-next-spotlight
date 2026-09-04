import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ASK_HREF, EQUITY_HREF, TOOLS, liveTools, soonTools } from '../tools.js'
import { STEPS, pendingAfter } from '../steps.js'

const APP = path.resolve(process.cwd(), 'src/app/(site)')

describe('tools registry', () => {
  it('every live tool has a route that exists under src/app/(site)', () => {
    for (const tool of liveTools()) {
      expect(tool.href, tool.id).toBeTruthy()
      const dir = path.join(APP, tool.href.replace(/^\//, ''))
      const page = ['page.jsx', 'page.tsx', 'page.js'].some((f) =>
        existsSync(path.join(dir, f))
      )
      expect(page, `${tool.href} has no page file`).toBe(true)
    }
  })

  it('soon tools have no href and every tool has a lucide icon name and blurb', () => {
    for (const tool of soonTools()) expect(tool.href).toBeNull()
    for (const tool of TOOLS) {
      expect(tool.icon).toMatch(/^[A-Z][A-Za-z]+$/)
      expect(tool.blurb.length).toBeGreaterThan(10)
    }
  })
})

describe('the two hand-off routes', () => {
  it('names routes that are really in the registry as live tools', () => {
    /* The hand-off links import these rather than reaching into TOOLS by
       index. If a tool is renamed or unpublished, this fails instead of the
       link quietly 404ing. */
    for (const href of [ASK_HREF, EQUITY_HREF]) {
      const tool = liveTools().find((t) => t.href === href)
      expect(tool, href).toBeTruthy()
    }
  })
})

describe('privacy copy (decision D3)', () => {
  /* The shared store persists to sessionStorage now, so "nothing stored" is
     false wherever it still appears. It was true on three surfaces before the
     job offer calculator shipped, which is exactly the kind of claim that
     survives a behaviour change because nobody re-reads marketing copy. */
  const SURFACES = [
    'src/app/(site)/founders/page.jsx',
    'src/app/(site)/founders/equity/page.jsx',
    'src/app/(site)/founders/equity/EquityCalculator.jsx',
    'src/app/(site)/founders/job-offer/page.jsx',
    'src/app/(site)/founders/job-offer/JobOfferCalculator.jsx',
  ]

  it('never claims nothing is stored', () => {
    for (const file of SURFACES) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8')
      /* The comment explaining why the claim was retired is allowed; the claim
         itself is not. */
      const claims = text
        .split('\n')
        .filter((line) => /nothing stored/i.test(line))
        .filter((line) => !/would be false/.test(line))
      expect(claims, file).toEqual([])
    }
  })

  it('says the true thing on every tool surface instead', () => {
    for (const file of SURFACES) {
      const text = readFileSync(path.resolve(process.cwd(), file), 'utf8')
      expect(text, file).toMatch(/leaves your browser/i)
    }
  })
})

describe('steps registry', () => {
  it('has four ordered steps with one job each and a pending label for input steps', () => {
    expect(STEPS.map((s) => s.index)).toEqual([1, 2, 3, 4])
    expect(STEPS.slice(0, 3).every((s) => s.pending)).toBe(true)
    expect(STEPS[3].fields).toHaveLength(0)
    const all = STEPS.flatMap((s) => s.fields)
    expect(new Set(all).size).toBe(all.length)
  })

  it('pendingAfter lists only later input steps', () => {
    expect(pendingAfter(1).map((s) => s.index)).toEqual([2, 3])
    expect(pendingAfter(3)).toEqual([])
  })
})
