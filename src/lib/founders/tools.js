/* The Founders' Desk tool registry. One source of truth for the nav
   dropdown (live tools only), the desk eyebrow row, the landing's
   "coming to the desk" line, and the tests that assert every live tool
   has a real route. Icons are lucide names resolved by the components. */

export const TOOLS = [
  {
    id: 'equity',
    label: 'Equity calculator',
    href: '/founders/equity',
    icon: 'Percent',
    status: 'live',
    kicker: '/founders/equity · no account',
    blurb: 'Are you being sized as a hire while doing founder work?',
  },
  {
    id: 'dilution',
    label: 'Dilution modeler',
    href: null,
    icon: 'TrendingDown',
    status: 'soon',
    kicker: 'soon',
    blurb: 'Your stake through seed, A, B, C and an IPO.',
  },
  {
    /* Absorbs the old "Salary ⇄ equity" slot: the ask ladder is that trade
       priced at both ends, so shipping both would advertise one idea twice. */
    id: 'job-offer',
    label: 'Job offer calculator',
    href: '/founders/job-offer',
    icon: 'ArrowLeftRight',
    status: 'live',
    kicker: '/founders/job-offer · no account',
    blurb: 'What to ask for, in cash and equity, and where to stop.',
  },
  {
    id: 'glossary',
    label: 'Offer glossary',
    href: null,
    icon: 'BookOpen',
    status: 'soon',
    kicker: 'soon',
    blurb: 'Every term on a term sheet, in plain words.',
  },
  {
    id: 'vesting',
    label: 'Vesting timeline',
    href: null,
    icon: 'CalendarClock',
    status: 'soon',
    kicker: 'soon',
    blurb: 'Cliffs, acceleration, and what you keep if you leave.',
  },
]

export const DESK_HREF = '/founders'

export const REVIEW_HREF = '/contact/offer-review'

export const liveTools = () => TOOLS.filter((tool) => tool.status === 'live')

export const soonTools = () => TOOLS.filter((tool) => tool.status === 'soon')
