import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { TOOLS, liveTools, soonTools } from '../tools.js'
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
