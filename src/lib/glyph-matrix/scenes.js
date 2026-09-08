// Scene coordinates are grid cells. Every mark snaps to the same fixed lattice.
export const SCENES = ['builder', 'raft', 'painter', 'dreamer']
export const DESCRIPTIONS = {
  builder:
    'A crowned builder thinks, types at a computer, reveals a finished creation, and celebrates. What if… One more detail. There it is. Worth the effort.',
  raft: 'A crowned creator rests on a raft, bobbing on ocean waves and waving hello. Great work takes effort. Rest is part of it.',
  painter:
    'A crowned painter adds brush strokes to a canvas, reveals a mountain landscape, and admires the masterpiece.',
  dreamer:
    'A crowned dreamer launches a paper airplane. It loops back, bonks the back of his head, and falls. He says Tough crowd, picks it up, and tries again.',
}
export const CYCLE_MS = 14400
export function chooseScene(previous, random = Math.random) {
  const choices = SCENES.filter((scene) => scene !== previous)
  return choices[
    Math.min(
      choices.length - 1,
      Math.max(0, Math.floor(random() * choices.length))
    )
  ]
}
export function phaseAt(elapsed, reduced = false) {
  if (reduced) return { stage: 'play', time: 10.5, reveal: 1, exit: 0 }
  const t = ((elapsed % CYCLE_MS) + CYCLE_MS) % CYCLE_MS
  if (t < 1200) return { stage: 'standby', time: 0, reveal: 0, exit: 0 }
  if (t < 1900)
    return { stage: 'enter', time: 0, reveal: (t - 1200) / 700, exit: 0 }
  if (t < 13900)
    return { stage: 'play', time: (t - 1900) / 1000, reveal: 1, exit: 0 }
  return { stage: 'exit', time: 12, reveal: 1, exit: (t - 13900) / 500 }
}

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  '!': ['1', '1', '1', '1', '1', '0', '1'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
}

export function createDrawing(columns, rows) {
  const pixels = new Set()
  const dot = (x, y) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x >= 0 && y >= 0 && x < columns && y < rows) pixels.add(y * columns + x)
  }
  const line = (x1, y1, x2, y2) => {
    const n = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2)
    for (let i = 0; i <= n; i++) {
      const p = n ? i / n : 0
      dot(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p)
    }
  }
  const path = (points) =>
    points.slice(1).forEach((p, i) => line(...points[i], ...p))
  const circle = (x, y, r) => {
    for (let a = 0; a < Math.PI * 2; a += 1 / (r * 3))
      dot(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  const rect = (x, y, w, h) =>
    path([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
      [x, y],
    ])
  const text = (value, cx, y) => {
    const widths = [...value].map((letter) =>
      letter === ' ' ? 3 : FONT[letter]?.[0].length || 5
    )
    let x = Math.round(
      cx - (widths.reduce((a, b) => a + b, 0) + value.length - 1) / 2
    )
    ;[...value].forEach((letter, i) => {
      FONT[letter]?.forEach((row, yy) =>
        [...row].forEach((p, xx) => {
          if (p === '1') dot(x + xx, y + yy)
        })
      )
      x += widths[i] + 1
    })
  }
  const crown = (x, y) =>
    path([
      [x - 4, y],
      [x - 5, y - 5],
      [x - 2, y - 3],
      [x, y - 7],
      [x + 2, y - 3],
      [x + 5, y - 5],
      [x + 4, y],
      [x - 4, y],
    ])
  const head = (x, y) => {
    circle(x, y, 4)
    crown(x, y - 6)
  }
  const spark = (x, y, r = 3) => {
    line(x - r, y, x + r, y)
    line(x, y - r, x, y + r)
    dot(x - 2, y - 2)
    dot(x + 2, y + 2)
  }
  const thought = (lines, cx, y) => {
    const width = Math.max(...lines.map((s) => s.length * 6)) + 6
    const height = lines.length * 9 + 4
    cx = Math.max(width / 2 + 2, Math.min(columns - width / 2 - 3, cx))
    path([
      [cx - width / 2 + 2, y],
      [cx + width / 2 - 2, y],
      [cx + width / 2, y + 2],
      [cx + width / 2, y + height - 2],
      [cx + width / 2 - 2, y + height],
      [cx - width / 2 + 2, y + height],
      [cx - width / 2, y + height - 2],
      [cx - width / 2, y + 2],
      [cx - width / 2 + 2, y],
    ])
    lines.forEach((s, i) => text(s, cx, y + 3 + i * 9))
    dot(cx + 5, y + height + 3)
    dot(cx + 7, y + height + 5)
  }
  return {
    pixels,
    dot,
    line,
    path,
    circle,
    rect,
    text,
    crown,
    head,
    spark,
    thought,
  }
}

function landscape(d, x, y, w, h, progress = 1) {
  const points = [
    [x, y + h],
    [x + w * 0.3, y + h * 0.3],
    [x + w * 0.53, y + h * 0.7],
    [x + w * 0.72, y + h * 0.45],
    [x + w, y + h],
  ]
  for (let i = 1; i < points.length; i++)
    if (progress >= i / 4) d.path([points[i - 1], points[i]])
  if (progress > 0.7) d.circle(x + w * 0.78, y + h * 0.15, 2)
}

function builder(d, cx, ground, t) {
  const x = cx - 14,
    y = ground - 22,
    celebrate = t >= 9
  d.head(x, y)
  d.path([
    [x, y + 5],
    [x - 2, y + 14],
    [x + 5, y + 15],
    [x + 8, ground],
    [x + 12, ground],
  ])
  d.path([
    [x - 6, y + 8],
    [x - 7, y + 17],
    [x + 3, y + 17],
  ])
  d.line(x - 3, y + 18, x - 3, ground - 1)
  d.line(x - 8, ground, x + 2, ground)
  const tap = Math.sin(t * 15) > 0 ? 1 : 0
  if (celebrate) {
    d.path([
      [x, y + 7],
      [x - 7, y + 1],
      [x - 9, y - 6],
    ])
    d.path([
      [x, y + 7],
      [x + 7, y + 1],
      [x + 10, y - 5],
    ])
  } else {
    d.path([
      [x, y + 7],
      [x + 6, y + 11],
      [x + 15, y + 10 + tap],
    ])
    d.path([
      [x + 1, y + 8],
      [x + 7, y + 13],
      [x + 17, y + 11 - tap],
    ])
  }
  d.line(x + 9, y + 14, x + 49, y + 14)
  d.line(x + 12, y + 14, x + 12, ground)
  d.line(x + 46, y + 14, x + 46, ground)
  d.line(x + 13, y + 12, x + 24, y + 12)
  d.rect(x + 23, y - 7, 23, 16)
  d.line(x + 34, y + 9, x + 34, y + 13)
  d.rect(x + 49, y + 9, 4, 4)
  d.path([
    [x + 53, y + 10],
    [x + 55, y + 10],
    [x + 55, y + 12],
    [x + 53, y + 12],
  ])
  if (t >= 6) {
    landscape(d, x + 26, y - 4, 17, 9)
    if (Math.sin(t * 4) > 0) d.spark(x + 48, y - 9)
  } else {
    for (let i = 0; i < Math.floor(t * 2) % 7; i++)
      d.line(x + 26, y - 4 + i * 2, x + 30 + (i % 3) * 3, y - 4 + i * 2)
  }
  const lines =
    t < 3
      ? ['WHAT IF...']
      : t < 6
      ? ['ONE MORE', 'DETAIL.']
      : t < 9
      ? ['THERE IT IS.']
      : ['WORTH THE', 'EFFORT.']
  d.thought(lines, cx - 20, Math.max(2, y - 38))
  const px = x + 61
  d.path([
    [px - 3, ground - 7],
    [px + 3, ground - 7],
    [px + 2, ground],
    [px - 2, ground],
    [px - 3, ground - 7],
  ])
  d.line(px, ground - 7, px, ground - 21)
  d.path([
    [px, ground - 12],
    [px - 5, ground - 18],
    [px - 5, ground - 14],
    [px, ground - 10],
  ])
  d.path([
    [px, ground - 16],
    [px + 5, ground - 22],
    [px + 4, ground - 17],
    [px, ground - 14],
  ])
}
function raft(d, cx, ground, t, columns) {
  const bob = Math.sin(t * 1.8) * 1.2,
    x = cx - 15,
    y = ground - 15 + bob
  for (let row = 0; row < 3; row++)
    for (let xx = 0; xx < columns; xx++)
      d.dot(xx, ground + row * 5 + Math.sin(xx * 0.16 - t * 1.8 + row) * 1.8)
  d.head(x, y - 8)
  d.path([
    [x, y - 3],
    [x + 4, y + 6],
    [x + 13, y + 5],
    [x + 20, y + 9],
  ])
  d.path([
    [x + 1, y - 2],
    [x + 8, y - 6],
    [x + 10 + Math.sin(t * 5) * 2, y - 13],
  ])
  d.path([
    [x, y - 1],
    [x - 4, y + 5],
    [x - 8, y + 7],
  ])
  d.path([
    [x - 10, y + 8],
    [x + 24, y + 10],
    [x + 22, y + 13],
    [x - 11, y + 11],
    [x - 10, y + 8],
  ])
  for (let i = 0; i < 5; i++)
    d.line(x - 7 + i * 6, y + 9, x - 8 + i * 6, y + 11)
  const sun = Math.min(columns - 12, cx + 44)
  d.circle(sun, 12, 4)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    d.line(
      sun + Math.cos(a) * 7,
      12 + Math.sin(a) * 7,
      sun + Math.cos(a) * 9,
      12 + Math.sin(a) * 9
    )
  }
  d.path([
    [cx - 48, 14],
    [cx - 44, 10],
    [cx - 41, 12],
    [cx - 37, 9],
    [cx - 31, 14],
    [cx - 48, 14],
  ])
}
function painter(d, cx, ground, t) {
  const x = cx - 24,
    y = ground - 22
  d.head(x, y)
  d.line(x, y + 4, x, y + 13)
  d.path([
    [x, y + 13],
    [x - 5, ground],
    [x - 8, ground],
  ])
  d.path([
    [x, y + 13],
    [x + 5, ground],
    [x + 8, ground],
  ])
  const hand = t < 8 ? Math.sin(t * 3) * 4 : -6
  d.path([
    [x, y + 6],
    [x + 7, y + 8],
    [x + 15, y + hand],
  ])
  d.line(x + 14, y + hand, x + 20, y + hand - 2)
  d.path([
    [x, y + 7],
    [x - 6, y + 11],
    [x - 9, y + 7],
  ])
  d.circle(x - 9, y + 6, 3)
  d.rect(cx + 1, y - 10, 27, 22)
  d.line(cx - 2, y + 14, cx + 31, y + 14)
  d.line(cx + 7, y + 14, cx + 2, ground)
  d.line(cx + 22, y + 14, cx + 28, ground)
  landscape(d, cx + 4, y - 6, 21, 14, Math.min(1, t / 6))
  if (t > 7) d.spark(cx + 33, y - 12)
  d.thought(
    t < 7 ? ['MAKE IT', 'MEAN SOMETHING.'] : ['A LITTLE', 'MORE SOUL.'],
    cx - 4,
    Math.max(2, y - 38)
  )
}
// Twelve-second story, ending in the same ready pose in which it began.
export function dreamerPose(t, columns, ground) {
  const x = Math.floor(columns / 2) - 30,
    y = ground - 23
  const clamp = (n) => Math.max(0, Math.min(1, n))
  const smooth = (n) => {
    const p = clamp(n)
    return p * p * (3 - 2 * p)
  }
  const mix = (a, b, p) => a + (b - a) * p
  const ready = { x: x + 17, y: y - 3, angle: 0 }
  let plane = { ...ready },
    bend = 0,
    recoil = 0,
    stage = 'ready'
  if (t >= 1 && t < 4) {
    stage = 'outbound'
    const p = smooth((t - 1) / 3)
    plane = {
      x: mix(ready.x, columns - 7, p),
      y: mix(ready.y, y - 18, p) - Math.sin(p * Math.PI) * 5,
      angle: -0.2 * Math.sin(p * Math.PI),
    }
  } else if (t >= 4 && t < 6.5) {
    stage = 'return'
    const p = clamp((t - 4) / 2.5)
    // A cubic arc loops above the crown, then approaches from behind (left).
    const points = [
      [columns - 7, y - 18],
      [columns - 7, y - 40],
      [x - 35, y - 32],
      [x - 10, y],
    ]
    const q = 1 - p
    const px =
      q * q * q * points[0][0] +
      3 * q * q * p * points[1][0] +
      3 * q * p * p * points[2][0] +
      p * p * p * points[3][0]
    const py =
      q * q * q * points[0][1] +
      3 * q * q * p * points[1][1] +
      3 * q * p * p * points[2][1] +
      p * p * p * points[3][1]
    // Ease the nose back to the right as it reaches the back of his head.
    plane = { x: px, y: py, angle: Math.PI * Math.sin(p * Math.PI) }
  } else if (t >= 6.5 && t < 8.5) {
    stage = 'bonk'
    recoil = Math.sin(clamp((t - 6.5) / 0.6) * Math.PI) * 3
    const p = smooth((t - 6.8) / 1.2)
    plane = {
      x: mix(x - 10, x - 13, p),
      y: mix(y, ground - 4, p),
      angle: p * 0.6,
    }
  } else if (t >= 8.5 && t < 10.3) {
    stage = 'pickup'
    bend = smooth((t - 8.5) / 1.3)
    plane = { x: x - 13, y: ground - 4, angle: 0.6 }
  } else if (t >= 10.3 && t < 11.7) {
    stage = 'reset'
    const p = smooth((t - 10.3) / 1.4)
    bend = 1 - p
    plane = {
      x: mix(x - 13, ready.x, p),
      y: mix(ground - 4, ready.y, p),
      angle: 0.6 * (1 - p),
    }
  }
  return { x, y, plane, bend, recoil, stage }
}

function dreamer(d, cx, ground, t, columns) {
  const { x, y, plane, bend, recoil, stage } = dreamerPose(t, columns, ground)
  const hx = x - bend * 10 + recoil,
    hy = y + bend * 13
  d.head(hx, hy)
  d.line(hx, hy + 4, x, y + 14)
  d.path([
    [x, y + 14],
    [x - 5, ground],
    [x - 8, ground],
  ])
  d.path([
    [x, y + 14],
    [x + 6, ground],
    [x + 9, ground],
  ])
  if (stage === 'pickup' || stage === 'reset') {
    const hand =
      stage === 'reset'
        ? [plane.x - 4, plane.y + 2]
        : [x + 12 - bend * 29, y - 2 + bend * 23]
    d.path([[hx, hy + 6], [hx - 5, hy + 10], hand])
    d.path([
      [hx, hy + 7],
      [hx + 4, hy + 11],
      [hand[0] + 2, hand[1]],
    ])
  } else if (stage === 'bonk') {
    d.path([
      [hx, hy + 7],
      [hx - 8, hy + 5],
      [hx - 5, hy - 1],
    ])
    d.path([
      [hx, hy + 7],
      [hx + 7, hy + 11],
      [hx + 10, hy + 7],
    ])
    if (t < 7.1) d.spark(x - 6, y - 3, 3)
  } else {
    d.path([
      [hx, hy + 7],
      [x + 7, y + 5],
      [x + 12, y - 2],
    ])
    d.path([
      [hx, hy + 7],
      [x - 5, y + 11],
      [x - 8, y + 7],
    ])
  }
  const shape = [
    [-6, -3],
    [6, 0],
    [-6, 4],
    [-3, 0],
    [-6, -3],
    [6, 0],
    [-3, 0],
  ]
  d.path(
    shape.map(([xx, yy]) => [
      plane.x + xx * Math.cos(plane.angle) - yy * Math.sin(plane.angle),
      plane.y + xx * Math.sin(plane.angle) + yy * Math.cos(plane.angle),
    ])
  )
  // Short trailing blips follow the moving plane without drawing across him.
  if (stage === 'outbound' || stage === 'return') {
    for (let delay = 0.12; delay < 0.6; delay += 0.12) {
      const previous = dreamerPose(
        Math.max(1, t - delay),
        columns,
        ground
      ).plane
      d.dot(previous.x, previous.y)
    }
  }
  const words =
    stage === 'bonk' || stage === 'pickup'
      ? ['TOUGH', 'CROWD.']
      : stage === 'return'
      ? ['WAIT...']
      : stage === 'outbound'
      ? ['LOOK AT', 'IT GO.']
      : ['WHAT IF', 'IT FLIES?']
  if (stage !== 'return') d.thought(words, cx - 22, Math.max(2, y - 38))
}
export function drawScene(scene, columns, rows, time) {
  const d = createDrawing(columns, rows),
    cx = Math.floor(columns / 2),
    ground = rows - 9
  if (scene === 'raft') raft(d, cx, ground - 5, time, columns)
  else {
    for (let x = 0; x < columns; x += 2) d.dot(x, ground + 1)
    if (scene === 'painter') painter(d, cx, ground, time)
    else if (scene === 'dreamer') dreamer(d, cx, ground, time, columns)
    else builder(d, cx, ground, time)
  }
  return d.pixels
}
