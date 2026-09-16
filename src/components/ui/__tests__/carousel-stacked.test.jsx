import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { CarouselStacked } from '../carousel-stacked'

const geometry = {
  dx: 40,
  dy: 20,
  curve: 0.8,
  rotation: 6,
  scaleStep: 0.08,
  minScale: 0.7,
}

function renderFan() {
  return render(
    <CarouselStacked
      items={[{ id: 'a' }, { id: 'b' }]}
      renderCard={() => <div>card</div>}
      size={{ w: 200, h: 300 }}
      height={400}
      geometry={geometry}
    />
  )
}

describe('CarouselStacked stacking', () => {
  it('isolates the fan so card and grab layers cannot paint over the site header', () => {
    const { container } = renderFan()
    const fan = container.firstElementChild
    const grab = container.querySelector('.cursor-grab')
    const cards = [
      ...container.querySelectorAll('.pointer-events-none.absolute'),
    ]

    expect(fan).toHaveClass('isolate')
    expect(grab).toBeTruthy()
    expect(grab.className).not.toMatch(/z-\[1[0-9]{2,}\]/)

    const overlayZ = Number(
      [...grab.classList]
        .find((cls) => /^z-\[?\d+\]?$/.test(cls))
        ?.match(/\d+/)?.[0]
    )
    expect(overlayZ).toBeGreaterThan(0)
    expect(overlayZ).toBeLessThan(50)

    for (const card of cards) {
      const z = Number(card.style.zIndex)
      expect(Number.isFinite(z)).toBe(true)
      expect(z).toBeLessThan(50)
    }
  })
})
