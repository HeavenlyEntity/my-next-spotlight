import React, { useCallback, useEffect, useRef } from 'react'

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
}

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
}

function GlowCard({
  children,
  className = '',
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false,
  style,
  ...rest
}) {
  const cardRef = useRef(null)
  const innerRef = useRef(null)

  const rafIdRef = useRef(null)

  const handlePointerMove = useCallback((e) => {
    // Only react to hover-capable pointers
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (rafIdRef.current) return
    const target = cardRef.current
    if (!target) return
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    rafIdRef.current = requestAnimationFrame(() => {
      target.style.setProperty('--x', x.toFixed(1))
      target.style.setProperty('--y', y.toFixed(1))
      target.style.setProperty('--xp', (x / rect.width).toFixed(3))
      target.style.setProperty('--yp', (y / rect.height).toFixed(3))
      rafIdRef.current = null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const { base, spread } = glowColorMap[glowColor]

  const getSizeClasses = () => {
    if (customSize) return ''
    return sizeMap[size]
  }

  const getInlineStyles = () => {
    const baseStyles = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '2', // Slightly thinner border
      '--backdrop': 'hsl(0 0% 60% / 0.08)', // More subtle backdrop
      '--backup-border': 'var(--backdrop)',
      '--size': '150', // Smaller spotlight for better performance
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 120) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.08)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: '100% 100%',
      backgroundPosition: '0 0',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'manipulation',
      willChange: 'transform, filter',
      contain: 'layout paint style',
    }

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height
    }

    return baseStyles
  }

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: 0 0;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
    
    [data-glow] [data-glow] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }
    
    [data-glow] > [data-glow]::before {
      inset: -10px;
      border-width: 10px;
    }
  `

  // Inject shared styles once to avoid duplicating <style> for every card
  useEffect(() => {
    if (typeof document === 'undefined') return
    const STYLE_ID = 'glow-card-shared-styles'
    const existing = document.getElementById(STYLE_ID)
    if (!existing) {
      const el = document.createElement('style')
      el.id = STYLE_ID
      el.textContent = beforeAfterStyles
      document.head.appendChild(el)
    }
  }, [])

  return (
    <>
      <div
        ref={cardRef}
        data-glow
        style={{ ...getInlineStyles(), ...(style || {}) }}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl 
          relative 
          grid 
          grid-rows-[1fr_auto] 
          shadow-[0_1rem_2rem_-1rem_black] 
          p-4 
          gap-4 
          hover:backdrop-blur-sm
          ${className}
        `}
        onPointerMove={handlePointerMove}
        {...rest}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  )
}

export { GlowCard }


