'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react'
import { cn } from '@/lib/utils'

/* Cards fanned along an arc, dragged with a spring. Adapted from 21st.dev
   "carousel-07" (CarouselStacked), with four changes:

   - it is sized to its container, not the window, so it can sit in a
     column beside something else without spilling past it;
   - the card is a render prop, so this file knows nothing about what a
     card shows;
   - next() and prev() are exposed on a ref, and onChange reports the card
     in front, so buttons, keys and a counter can drive it -- the original
     is drag-only, which is no way in for a keyboard;
   - under reduced motion the fan snaps instead of springing.

   The arc itself is the original's: distance from the centre becomes
   horizontal travel, a downward drop, a rotation and a shrink, so the fan
   reads as cards held in a hand, the middle one raised. */

const tier = (width) => {
  if (width < 480) {
    return {
      cardW: 176,
      cardH: 232,
      distanceDivisor: 120,
      velocityDivisor: 500,
      sensitivity: 180,
      x: 88,
      y: 20,
      rotation: 8,
      scale: 0.06,
    }
  }
  if (width < 800) {
    return {
      cardW: 216,
      cardH: 296,
      distanceDivisor: 160,
      velocityDivisor: 650,
      sensitivity: 220,
      x: 122,
      y: 28,
      rotation: 10,
      scale: 0.09,
    }
  }
  return {
    cardW: 256,
    cardH: 352,
    distanceDivisor: 200,
    velocityDivisor: 800,
    sensitivity: 250,
    x: 150,
    y: 36,
    rotation: 12,
    scale: 0.11,
  }
}

const mod = (n, m) => ((n % m) + m) % m

function Card({ index, total, progress, config, render, active }) {
  /* Signed distance from the front, wrapped so the fan is a ring: the card
     after the last is the first. */
  const offset = useTransform(progress, (p) => {
    let d = (index - p) % total
    if (d > total / 2) d -= total
    if (d < -total / 2) d += total
    return d
  })
  const x = useTransform(offset, (o) => o * config.x)
  const rotate = useTransform(offset, (o) =>
    Math.abs(o) < 0.05 ? 0 : o * config.rotation
  )
  const y = useTransform(offset, (o) =>
    Math.abs(o) < 0.05 ? 0 : Math.abs(o) * config.y
  )
  const scale = useTransform(offset, (o) => 1 - Math.abs(o) * config.scale)
  const opacity = useTransform(
    offset,
    [-total / 2, -total / 2 + 0.5, 0, total / 2 - 0.5, total / 2],
    [0, 1, 1, 1, 0]
  )
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10))

  return (
    <motion.div
      style={{
        x,
        rotate,
        y,
        scale,
        opacity,
        zIndex,
        width: config.cardW,
        height: config.cardH,
      }}
      className="pointer-events-none absolute"
    >
      {render({ offset, active })}
    </motion.div>
  )
}

export const CarouselStacked = forwardRef(function CarouselStacked(
  { items, renderCard, onChange, reduce = false, className },
  ref
) {
  const total = items.length
  const progress = useMotionValue(0)
  const startProgress = useRef(0)
  const wrap = useRef(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState(0)
  const config = tier(width)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useMotionValueEvent(progress, 'change', (v) => {
    const next = mod(Math.round(v), total)
    setActive((prev) => (prev === next ? prev : next))
  })

  useEffect(() => {
    onChange?.(active)
  }, [active, onChange])

  const goTo = useCallback(
    (target) => {
      if (reduce) {
        progress.set(target)
        return
      }
      animate(progress, target, {
        type: 'spring',
        stiffness: 200,
        damping: 30,
        mass: 1,
      })
    },
    [progress, reduce]
  )

  const next = useCallback(
    () => goTo(Math.round(progress.get()) + 1),
    [goTo, progress]
  )
  const prev = useCallback(
    () => goTo(Math.round(progress.get()) - 1),
    [goTo, progress]
  )
  useImperativeHandle(ref, () => ({ next, prev }), [next, prev])

  const onDragStart = () => {
    startProgress.current = progress.get()
  }
  const onDrag = (_, info) => {
    progress.set(progress.get() - info.delta.x / config.sensitivity)
  }
  const onDragEnd = (_, info) => {
    const shift = Math.max(
      -3,
      Math.min(
        3,
        Math.round(
          -info.offset.x / config.distanceDivisor -
            info.velocity.x / config.velocityDivisor
        )
      )
    )
    goTo(Math.round(startProgress.current) + shift)
  }

  return (
    <div
      ref={wrap}
      className={cn(
        'relative flex w-full select-none items-center justify-center overflow-hidden',
        className
      )}
      style={{ height: config.cardH + config.y * 2 + 16 }}
    >
      {/* The drag surface sits over the cards; they are pointer-events-none
          so the whole fan is one grab. Motion sets touch-action: pan-y for
          drag="x", so the page still scrolls under a thumb. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        className="absolute inset-0 z-[110] cursor-grab active:cursor-grabbing"
      />
      {items.map((item, i) => (
        <Card
          key={`${i}-${config.cardW}`}
          index={i}
          total={total}
          progress={progress}
          config={config}
          active={i === active}
          render={({ offset, active: isActive }) =>
            renderCard(item, i, { offset, active: isActive })
          }
        />
      ))}
    </div>
  )
})
