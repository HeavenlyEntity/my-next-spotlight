'use client'

import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/* Ported from PaceUI "dot-display-dot-loader" (paceui.com/r): a 9x9 LED
   dot-matrix that steps through frames (arrays of lit dot indices) on a
   timer and toggles the `active` class on each dot. Types dropped for
   this JavaScript codebase; behaviour unchanged. */

export const DotLoader = ({
  frames,
  columns = 9,
  isPlaying = true,
  duration = 100,
  dotClassName,
  className,
  repeatCount = -1,
  onComplete,
  ...props
}) => {
  const gridRef = useRef(null)
  const currentIndex = useRef(0)
  const repeats = useRef(0)
  const interval = useRef(null)

  const applyFrameToDots = useCallback(
    (dots, frameIndex) => {
      const frame = frames[frameIndex]
      if (!frame) return

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', frame.includes(index))
      })
    },
    [frames]
  )

  useEffect(() => {
    currentIndex.current = 0
    repeats.current = 0
  }, [frames])

  useEffect(() => {
    if (isPlaying) {
      if (currentIndex.current >= frames.length) {
        currentIndex.current = 0
      }
      const dotElements = gridRef.current?.children
      if (!dotElements) return
      const dots = Array.from(dotElements)
      interval.current = setInterval(() => {
        applyFrameToDots(dots, currentIndex.current)
        if (currentIndex.current + 1 >= frames.length) {
          if (repeatCount !== -1 && repeats.current + 1 >= repeatCount) {
            clearInterval(interval.current)
            onComplete?.()
          }
          repeats.current++
        }
        currentIndex.current = (currentIndex.current + 1) % frames.length
      }, duration)
    } else if (interval.current) {
      clearInterval(interval.current)
    }

    return () => {
      if (interval.current) clearInterval(interval.current)
    }
  }, [frames, isPlaying, applyFrameToDots, duration, repeatCount, onComplete])

  const totalDots = columns * columns

  return (
    <div
      {...props}
      ref={gridRef}
      className={cn(
        'grid w-fit gap-0.5',
        columns === 7 ? 'grid-cols-7' : 'grid-cols-9',
        className
      )}
    >
      {Array.from({ length: totalDots }).map((_, i) => (
        <div key={i} className={cn('h-1.5 w-1.5 rounded-sm', dotClassName)} />
      ))}
    </div>
  )
}
