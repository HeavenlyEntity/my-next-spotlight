import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/commerce/BuyButton', () => ({
  BuyButton: ({ label }) => <button type="button">{label}</button>,
}))

import {
  CourseCard,
  ProductCard,
  ServiceCard,
} from '@/components/commerce/catalog-cards'

const product = {
  slug: 'saas-kit',
  name: 'SaaS Kit',
  type: 'boilerplate',
  tagline: 'Auth, billing, CMS. Wired.',
  price: 149,
  currency: 'USD',
  creemProductId: 'prod_1',
  heroImage: { url: '/img/kit.webp' },
  techStack: [{ tech: 'Next.js' }, { tech: 'Payload' }],
}

describe('catalog cards', () => {
  it('product card is one stretched link named by the title, with number, price, and stack', () => {
    render(
      <ul>
        <ProductCard product={product} index={0} />
      </ul>
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('SaaS Kit')
    expect(links[0]).toHaveAttribute('href', '/products/saas-kit')
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('$149.00')).toBeInTheDocument()
    expect(screen.getByText('Boilerplate')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Stack' })).toHaveTextContent(
      'Next.js'
    )
  })

  it('product card without a price says pricing soon', () => {
    render(
      <ul>
        <ProductCard product={{ ...product, price: null }} index={3} />
      </ul>
    )
    expect(screen.getByText('pricing soon')).toBeInTheDocument()
    expect(screen.getByText('04')).toBeInTheDocument()
  })

  it('course card links from its title and shows free when unpriced', () => {
    render(
      <ul>
        <CourseCard
          course={{
            slug: 'auth',
            title: 'Auth from scratch',
            level: 'intermediate',
          }}
          index={1}
        />
      </ul>
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/auth')
    expect(screen.getByText('free')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
  })

  it('service card shows the from-price, the description slot, and the quote link without a product id', () => {
    render(
      <ul>
        <ServiceCard
          service={{ slug: 'cto', name: 'Fractional CTO', startingPrice: 3500 }}
          index={0}
          description={<p>Weekly shipping.</p>}
        />
      </ul>
    )
    expect(screen.getByText('$3500.00')).toBeInTheDocument()
    expect(screen.getByText('Weekly shipping.')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /request a quote/i })
    ).toHaveAttribute('href', '/contact')
  })

  it('service card with a product id renders the purchase button instead', () => {
    render(
      <ul>
        <ServiceCard
          service={{
            slug: 'audit',
            name: 'Audit',
            startingPrice: 900,
            creemProductId: 'p',
          }}
        />
      </ul>
    )
    expect(
      screen.getByRole('button', { name: 'Purchase — $900.00' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
