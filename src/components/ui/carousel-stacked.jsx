'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
   "carousel-07" (CarouselStacked). What is kept: one motion value for the
   whole fan, a signed wrapped distance per card, transforms derived from
   that distance, the spring on release. What changed:

   - the arc is a prop. The original arches symmetrically (both sides drop
     the same way); this takes a direction, so the previous card can sit
     up and to the left while the next sits down and to the right -- a
     diagonal arc -- or any other line;
   - card size and the fan's height are props, decided by the parent from
     its own container and content, not by the window;
   - the card is a render prop;
   - nothing is clipped here. The parent decides where overflow is cut
     (the page's content pane, not the column), and sizes the arc so the
     cards it wants seen fit inside it;
   - next() and prev() on a ref, onChange for the card in front, and a
     reduced-motion snap. The original is drag-only, which is no way in
     for a keyboard. */

const mod = (n, m) => ((n % m) + m) % m
const sign = (n) => (n < 0 ? -1 : 1)

function Card({
  index,
  total,
  progress,
  geometry,
  size,
  bounds,
  render,
  active,
}) {
  /* Signed distance from the front, wrapped so the fan is a ring. */
  const offset = useTransform(progress, (p) => {
    let d = (index - p) % total
    if (d > total / 2) d -= total
    if (d < -total / 2) d += total
    return d
  })
  const { dx, dy, curve, rotation, scaleStep, minScale } = geometry

  const scaleAt = (o) => Math.max(minScale, 1 - Math.abs(o) * scaleStep)
  /* Travel along the arc, but never past the parent's bounds: a card's
     centre stops where its own scaled edge would cross. The far cards
     stack up at the edge rather than crossing into whatever sits beside
     the fan. */
  const x = useTransform(offset, (o) => {
    const wanted = o * dx
    if (!bounds) return wanted
    const maxX = Math.max(0, (bounds - size.w * scaleAt(o)) / 2)
    return Math.max(-maxX, Math.min(maxX, wanted))
  })
  /* |o|^curve with curve < 1 flattens the line as it leaves the centre:
     the second card out drops less than twice the first, which is what
     turns a straight diagonal into an arc. */
  const y = useTransform(offset, (o) => sign(o) * dy * Math.abs(o) ** curve)
  const rotate = useTransform(offset, (o) => o * rotation)
  const scale = useTransform(offset, scaleAt)
  const opacity = useTransform(
    offset,
    [-2.6, -2, -1, 0, 1, 2, 2.6],
    [0, 0.5, 0.9, 1, 0.9, 0.5, 0]
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
        width: size.w,
        height: size.h,
      }}
      className="pointer-events-none absolute"
    >
      {render({ offset, active })}
    </motion.div>
  )
}

export const CarouselStacked = forwardRef(function CarouselStacked(
  {
    items,
    renderCard,
    onChange,
    reduce = false,
    size,
    height,
    geometry,
    className,
  },
  ref
) {
  const total = items.length
  const progress = useMotionValue(0)
  const startProgress = useRef(0)
  const [active, setActive] = useState(0)

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

  /* Drag feel scales with the card: a card's width of travel is one card. */
  const sensitivity = size.w * 0.6
  const onDragStart = () => {
    startProgress.current = progress.get()
  }
  const onDrag = (_, info) => {
    progress.set(progress.get() - info.delta.x / sensitivity)
  }
  const onDragEnd = (_, info) => {
    const shift = Math.max(
      -3,
      Math.min(
        3,
        Math.round(-info.offset.x / (size.w * 0.5) - info.velocity.x / 800)
      )
    )
    goTo(Math.round(startProgress.current) + shift)
  }

  return (
    <div
      className={cn(
        'relative flex w-full select-none items-center justify-center overflow-visible',
        className
      )}
      style={{ height }}
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
          key={`${i}-${size.w}-${size.h}`}
          index={i}
          total={total}
          progress={progress}
          geometry={geometry}
          size={size}
          active={i === active}
          render={({ offset, active: isActive }) =>
            renderCard(item, i, { offset, active: isActive })
          }
        />
      ))}
    </div>
  )
})
