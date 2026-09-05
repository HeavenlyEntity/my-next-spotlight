'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DotLoader } from '@/components/ui/dot-display/dot-loader'

/* Ported from PaceUI "dot-display-dot-flow" (paceui.com/r): a step flow
   that plays each item's dot-matrix frames, then swaps the status text
   with a blur/slide transition and resizes the label box to fit. The
   original drives the swap with GSAP; this port uses Motion (already the
   site's animation library) so the two engines never contend for the
   same element. Surfaces mapped to amw tokens. */

const swap = {
  initial: { y: -12, opacity: 0, filter: 'blur(4px)' },
  animate: { y: 0, opacity: 1, filter: 'blur(0px)' },
  exit: { y: 12, opacity: 0, filter: 'blur(4px)' },
}

export const DotFlow = ({
  items,
  isPlaying = true,
  columns = 9,
  dotSize = 'size-1.5',
  className = '',
}) => {
  const [index, setIndex] = useState(0)

  const safeIndex = items.length > 0 ? index % items.length : 0
  const currentItem = items[safeIndex]

  /* Reset to the first item when the list itself changes. Done during render,
     which React supports for exactly this case, rather than committing a stale
     render and correcting it from an effect. */
  const [prevItems, setPrevItems] = useState(items)
  if (items !== prevItems) {
    setPrevItems(items)
    setIndex(0)
  }

  const next = useCallback(() => {
    if (items.length === 0) return
    setIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  return (
    <div
      className={`border-[var(--amw-line)] bg-[var(--amw-card-2)] flex items-center gap-3 rounded-lg border px-3 py-3 ${className}`}
    >
      <DotLoader
        key={safeIndex}
        frames={currentItem?.frames ?? []}
        onComplete={next}
        columns={columns}
        className="shrink-0 gap-0.5"
        isPlaying={isPlaying}
        repeatCount={currentItem?.repeatCount ?? 1}
        duration={currentItem?.duration ?? 150}
        dotClassName={`[&.active]:bg-[var(--amw-accent-ink)] ${dotSize} rounded-full bg-zinc-900/15 dark:bg-white/15`}
      />
      {/* `layout` tweens the box width as labels change length, standing
          in for the original's width tween. */}
      <motion.div layout className="relative min-w-0 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={safeIndex}
            variants={swap}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="amw-mono inline-block whitespace-nowrap text-xs font-medium text-zinc-800 dark:text-zinc-200"
          >
            {currentItem?.title ?? ''}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
