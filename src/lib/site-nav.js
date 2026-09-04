import {
  DESK_HREF,
  REVIEW_HREF,
  liveTools,
  soonTools,
} from '@/lib/founders/tools'

/* The site's navigation, shaped for the template's card menu: four cards,
   each one job. Live founder tools come from the desk registry so a tool
   promoted to live appears here without a second edit. */

export const CONTACT_EMAIL = 'amware.develop@gmail.com'

export const SOCIAL_LINKS = [
  { id: 'x', label: 'Follow on X', href: 'https://x.com/AmwareDotDev' },
  {
    id: 'linkedin',
    label: 'Follow on LinkedIn',
    href: 'https://www.linkedin.com/in/alec-mingione-90bb63aa/',
  },
  {
    id: 'github',
    label: 'Follow on GitHub',
    href: 'https://github.com/HeavenlyEntity',
  },
]

export function menuCards() {
  return [
    {
      id: 'catalog',
      title: 'Catalog',
      links: [
        { label: 'Boilerplates & Products', href: '/products', badge: null },
        { label: 'Services', href: '/services', badge: null },
        { label: 'Courses', href: '/courses', badge: null },
      ],
    },
    {
      id: 'founders',
      title: "Founders' Desk",
      links: [
        ...liveTools().map((tool) => ({
          label: tool.label,
          href: tool.href,
          badge: 'new',
        })),
        { label: 'Review my offer', href: REVIEW_HREF, badge: null },
        { label: 'The desk', href: DESK_HREF, badge: null },
      ],
      footnote: `Coming: ${soonTools()
        .map((tool) => tool.label)
        .join(' · ')}`,
    },
    {
      id: 'explore',
      title: 'Explore',
      links: [
        { label: 'About', href: '/about', badge: null },
        { label: 'Articles', href: '/articles', badge: null },
        { label: 'Projects', href: '/projects', badge: null },
        { label: 'Uses', href: '/uses', badge: null },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      links: [],
      email: CONTACT_EMAIL,
      socials: SOCIAL_LINKS,
    },
  ]
}

/* Every route the menu links to, for the registry test. */
export function menuHrefs() {
  return menuCards().flatMap((card) => card.links.map((link) => link.href))
}
