import { describe, expect, it } from 'vitest'
import {
  chooseScene,
  SCENES,
  phaseAt,
  CYCLE_MS,
  INTRO_MS,
  drawScene,
  createDrawing,
  dreamerPose,
} from '../scenes'

describe('refresh selection', () => {
  it('never repeats the previous scene across the random range', () => {
    for (const previous of [...SCENES, null, 'obsolete']) {
      for (const n of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const scene = chooseScene(previous, () => n)
        expect(SCENES).toContain(scene)
        expect(scene).not.toBe(previous)
      }
    }
  })
})
describe('animation lifecycle', () => {
  it('keeps both sides of the longest builder bubble inside mobile edges', () => {
    const drawing = createDrawing(116, 101)
    drawing.thought(['THERE IT IS.'], 38, 2)
    const xs = [...drawing.pixels].map((cell) => cell % 116)
    const left = Math.min(...xs)
    const right = Math.max(...xs)
    expect(left).toBeGreaterThanOrEqual(2)
    expect(right).toBeLessThan(114)
    for (let y = 4; y <= 13; y++) {
      expect(drawing.pixels.has(y * 116 + left)).toBe(true)
      expect(drawing.pixels.has(y * 116 + right)).toBe(true)
    }
  })
  it('reveals once and loops playback without another fade or standby', () => {
    expect(phaseAt(0).stage).toBe('standby')
    expect(phaseAt(1500).stage).toBe('enter')
    expect(phaseAt(1900).time).toBe(0)
    for (let cycle = 1; cycle <= 5; cycle++) {
      const boundary = INTRO_MS + cycle * CYCLE_MS
      expect(phaseAt(boundary)).toEqual({
        stage: 'play',
        time: 0,
        reveal: 1,
        exit: 0,
      })
      for (const offset of [-1, 1, 1200, 1500]) {
        const phase = phaseAt(boundary + offset)
        expect(phase.stage).toBe('play')
        expect(phase.reveal).toBe(1)
        expect(phase.exit).toBe(0)
      }
    }
    expect(phaseAt(50, true)).toEqual(phaseAt(9000, true))
    expect(phaseAt(0, true).time).toBeGreaterThan(9)
  })
  it('draws distinct animated scenes within desktop and mobile bounds', () => {
    for (const [cols, rows] of [
      [116, 101],
      [220, 72],
    ])
      for (const scene of SCENES) {
        const start = drawScene(scene, cols, rows, 0)
        const end = drawScene(scene, cols, rows, 10.5)
        expect(start.size).toBeGreaterThan(100)
        expect(end).not.toEqual(start)
        for (const cell of end) {
          expect(Number.isInteger(cell)).toBe(true)
          expect(cell).toBeGreaterThanOrEqual(0)
          expect(cell).toBeLessThan(cols * rows)
        }
      }
  })
  it('keeps the finished computer artwork visible during celebration', () => {
    const cols = 220,
      rows = 72,
      x = Math.floor(cols / 2) - 14,
      y = rows - 9 - 22
    const artwork = (pixels) =>
      [...pixels]
        .filter((cell) => {
          const px = cell % cols,
            py = Math.floor(cell / cols)
          return px > x + 25 && px < x + 44 && py > y - 5 && py < y + 7
        })
        .sort((a, b) => a - b)
    expect(artwork(drawScene('builder', cols, rows, 7))).toEqual(
      artwork(drawScene('builder', cols, rows, 8.5))
    )
    expect(
      artwork(drawScene('builder', cols, rows, 8.5)).length
    ).toBeGreaterThan(20)
  })
})

describe('paper airplane return story', () => {
  it('flies beyond the right edge, hits the back of the head, lands and resets', () => {
    for (const [columns, ground] of [
      [116, 92],
      [220, 63],
    ]) {
      const ready = dreamerPose(0, columns, ground)
      const edge = dreamerPose(4, columns, ground)
      expect(edge.plane.x - 6).toBeGreaterThan(columns - 1)
      expect(edge.plane.hidden).toBe(true)
      const returning = dreamerPose(5.2, columns, ground)
      expect(returning.plane.x + 6).toBeLessThan(0)
      expect(returning.plane.y).toBe(returning.y)
      expect(dreamerPose(4.6, columns, ground).stage).toBe('offscreen')
      const impact = dreamerPose(6.5, columns, ground)
      expect(impact.plane.x + 6).toBe(impact.x - 4)
      expect(impact.plane.y).toBe(impact.y)
      expect(impact.stage).toBe('bonk')
      const fallen = dreamerPose(8.5, columns, ground)
      expect(fallen.plane.y).toBe(ground - 4)
      expect(dreamerPose(10.3, columns, ground).bend).toBe(1)
      expect(dreamerPose(12, columns, ground)).toEqual(ready)
    }
  })
  it('keeps flight positions continuous at each story boundary', () => {
    for (const time of [1, 4, 6.5, 8.5, 10.3, 11.7]) {
      const before = dreamerPose(time - 0.001, 116, 92)
      const after = dreamerPose(time, 116, 92)
      expect(
        Math.hypot(
          before.plane.x - after.plane.x,
          before.plane.y - after.plane.y
        )
      ).toBeLessThan(0.1)
      expect(Math.abs(before.bend - after.bend)).toBeLessThan(0.01)
    }
  })
})

describe('seamless scene boundaries', () => {
  for (const [columns, rows] of [
    [116, 101],
    [220, 72],
  ]) {
    for (const scene of SCENES) {
      it(`${scene} matches its opening frame at ${columns} columns`, () => {
        const opening = drawScene(scene, columns, rows, 0)
        expect(drawScene(scene, columns, rows, 12)).toEqual(opening)
        const closing = drawScene(scene, columns, rows, 11.999)
        expect(closing).toEqual(opening)
        expect(drawScene(scene, columns, rows, 0.001)).toEqual(opening)
      })
    }
  }
})

it('shows an app error after celebration and clears it when work resumes', () => {
  const cols = 220,
    rows = 72,
    x = Math.floor(cols / 2) - 14,
    y = rows - 9 - 22
  const error = createDrawing(cols, rows)
  error.text('ERR', x + 34, y - 1)
  const broken = drawScene('builder', cols, rows, 10)
  for (const pixel of error.pixels) expect(broken.has(pixel)).toBe(true)
  expect(broken).not.toEqual(drawScene('builder', cols, rows, 8.5))
  expect(drawScene('builder', cols, rows, 11.9)).toEqual(
    drawScene('builder', cols, rows, 0)
  )
})
