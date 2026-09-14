'use client'

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'

/* React Bits Pro "Click Stack" (pro.reactbits.dev/docs/components/click-stack),
   installed as local source and extended in four places:

   - forwardRef exposes next() and prev(), so real buttons and arrow keys can
     drive the deck rather than only a click on the pile;
   - prev() is new: the last card returns to the front by the same motion
     the front card leaves with, reversed;
   - onChange(frontIndex) reports which card is on top after each move, for a
     counter, progress dots and a live region;
   - clickToCycle lets a wrapper own the click when it wants to.

   The arrangement and the forward cycle are the original's. */

const SWATCHES = ['01', '02', '03', '04', '05', '06']

const BUILTIN_CARDS = SWATCHES.map((id) => (
  <div
    key={id}
    style={{
      background: '#ffffff',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#000000',
      fontSize: 56,
      fontWeight: 700,
      fontFamily: 'system-ui, sans-serif',
      userSelect: 'none',
    }}
  >
    {id}
  </div>
))

const ClickStack = forwardRef(function ClickStack(
  {
    items,
    cardWidth = 250,
    cardHeight = 300,
    spreadX = 20,
    spreadY = -20,
    duration = 0.35,
    ease = 'power3.out',
    borderRadius = 24,
    shadowBlur = 30,
    shadowOpacity = 0.3,
    cardColor = '#ffffff',
    visibleCount = 5,
    depthScale = 0.08,
    depthOpacity = 0,
    className,
    cardClassName,
    opacity = 1,
    clickToCycle = true,
    onChange,
  },
  ref
) {
  const cards = items ?? BUILTIN_CARDS
  const total = cards.length
  const vis = Math.min(visibleCount, total)

  const seq = useRef([])
  const busy = useRef(false)
  const nodes = useRef([])
  const onChangeRef = useRef(onChange)
  const cfg = useRef({
    spreadX,
    spreadY,
    depthScale,
    depthOpacity,
    vis,
    duration,
    ease,
  })
  const containerRef = useRef(null)

  useEffect(() => {
    cfg.current = {
      spreadX,
      spreadY,
      depthScale,
      depthOpacity,
      vis,
      duration,
      ease,
    }
    onChangeRef.current = onChange
  })

  const targetFor = useCallback((rank, c) => {
    if (rank >= c.vis) return { opacity: 0, visibility: 'hidden', zIndex: -1 }
    return {
      x: rank * c.spreadX,
      y: rank * c.spreadY,
      scale: 1 - rank * c.depthScale,
      opacity: Math.max(0, 1 - rank * c.depthOpacity),
      visibility: 'visible',
      zIndex: c.vis - rank,
      rotation: 0,
    }
  }, [])

  const arrange = useCallback(
    (animate) => {
      const c = cfg.current
      seq.current.forEach((itemIdx, rank) => {
        const el = nodes.current[itemIdx]
        if (!el) return
        const target = targetFor(rank, c)
        if (animate && rank < c.vis) {
          gsap.to(el, { ...target, duration: c.duration, ease: c.ease })
        } else {
          gsap.set(el, target)
        }
      })
    },
    [targetFor]
  )

  useEffect(() => {
    seq.current = Array.from({ length: total }, (_, i) => i)
    busy.current = false
    arrange(false)
    if (containerRef.current) {
      containerRef.current.style.visibility = 'visible'
    }
  }, [total, arrange])

  useEffect(() => {
    if (seq.current.length > 0) arrange(false)
  }, [spreadX, spreadY, depthScale, depthOpacity, vis, arrange])

  useEffect(() => {
    const refs = nodes.current
    return () => {
      refs.forEach((el) => {
        if (el) gsap.killTweensOf(el)
      })
    }
  }, [])

  const settle = useCallback(() => {
    busy.current = false
    onChangeRef.current?.(seq.current[0])
  }, [])

  const next = useCallback(() => {
    if (busy.current || total < 2) return
    busy.current = true

    const c = cfg.current
    const frontIdx = seq.current[0]
    const frontEl = nodes.current[frontIdx]

    if (!frontEl) {
      busy.current = false
      return
    }

    const tl = gsap.timeline({ onComplete: settle })

    tl.to(frontEl, {
      scale: 1.04,
      opacity: 0,
      duration: c.duration * 0.55,
      ease: 'power2.in',
      onComplete: () => {
        const moved = seq.current.shift()
        seq.current.push(moved)

        const c2 = cfg.current

        gsap.set(nodes.current[moved], {
          opacity: 0,
          visibility: 'hidden',
          zIndex: -1,
        })

        seq.current.forEach((idx, rank) => {
          if (idx === moved) return
          const el = nodes.current[idx]
          if (!el) return
          const target = targetFor(rank, c2)
          if (rank >= c2.vis) {
            gsap.set(el, target)
            return
          }
          gsap.to(el, {
            ...target,
            duration: c2.duration * 0.65,
            ease: 'power2.out',
          })
        })

        const movedRank = seq.current.indexOf(moved)
        const movedEl = nodes.current[moved]

        if (movedRank < c2.vis && movedEl) {
          gsap.set(movedEl, { ...targetFor(movedRank, c2), opacity: 0 })
          gsap.to(movedEl, {
            opacity: Math.max(0, 1 - movedRank * c2.depthOpacity),
            duration: c2.duration * 0.5,
            delay: c2.duration * 0.2,
            ease: 'power1.out',
          })
        }
      },
    })
  }, [total, settle, targetFor])

  /* The reverse of next(): the card at the bottom of the pile comes to the
     front, everyone else eases back one rank. It arrives the way the front
     card leaves -- slightly large and transparent, settling to rest -- so
     going back reads as the same motion played backwards. */
  const prev = useCallback(() => {
    if (busy.current || total < 2) return
    busy.current = true

    const c = cfg.current
    const moved = seq.current.pop()
    seq.current.unshift(moved)
    const movedEl = nodes.current[moved]

    seq.current.forEach((idx, rank) => {
      if (idx === moved) return
      const el = nodes.current[idx]
      if (!el) return
      const target = targetFor(rank, c)
      if (rank >= c.vis) {
        gsap.set(el, target)
        return
      }
      gsap.to(el, {
        ...target,
        duration: c.duration * 0.65,
        ease: 'power2.out',
      })
    })

    if (!movedEl) {
      settle()
      return
    }

    gsap.set(movedEl, {
      ...targetFor(0, c),
      scale: 1.04,
      opacity: 0,
      zIndex: c.vis + 1,
    })
    gsap.to(movedEl, {
      scale: 1,
      opacity: 1,
      duration: c.duration * 0.55,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(movedEl, { zIndex: c.vis })
        settle()
      },
    })
  }, [total, settle, targetFor])

  useImperativeHandle(ref, () => ({ next, prev }), [next, prev])

  return (
    <div
      ref={containerRef}
      onClick={clickToCycle ? next : undefined}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        clickToCycle && 'cursor-pointer',
        className
      )}
      style={{ opacity, visibility: 'hidden' }}
    >
      {cards.map((content, idx) => (
        <div
          key={idx}
          ref={(el) => {
            nodes.current[idx] = el
          }}
          className={cn('absolute overflow-hidden', cardClassName)}
          style={{
            width: cardWidth,
            height: cardHeight,
            borderRadius,
            background: cardColor,
            boxShadow: `0 ${Math.round(shadowBlur * 0.15)}px ${Math.round(
              shadowBlur * 0.5
            )}px rgba(0,0,0,${(shadowOpacity * 0.5).toFixed(
              2
            )}), 0 ${Math.round(
              shadowBlur * 0.4
            )}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`,
            willChange: 'transform, opacity',
          }}
        >
          {content}
        </div>
      ))}
    </div>
  )
})

ClickStack.displayName = 'ClickStack'

export default ClickStack
