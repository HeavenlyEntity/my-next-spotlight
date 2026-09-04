/* The job offer wizard's step registry.
 *
 * Three questions, not two. The plan started at two, then the engineering
 * review added the classification gates and the responsibility chips so a cold
 * start could produce a real read. Each addition was locally right and nobody
 * re-totalled: step one ended up holding eight controls and roughly thirty tap
 * targets, which on a phone is about 1,400px of scrolling before the Next
 * button. The design review split it (DD9).
 *
 * The grouping is not arbitrary. Step one is the classification cluster, the
 * answers that decide whether this person is being paid a founder's rate or a
 * market one, which is a 30-40% swing. Step two is everything about the
 * company. Step three is what they were actually offered.
 */

export const OFFER_STEPS = [
  {
    id: 'seat',
    index: 1,
    eyebrow: 'Your seat',
    title: 'What are you being hired to be?',
    lead: 'These answers decide whether the market pays you a founder’s rate or a hire’s. It is the widest gap in the whole read.',
    next: 'Next: the company',
    fields: [
      'role',
      'joining',
      'fullTimeOnSigning',
      'finalTechnicalSay',
      'responsibilities',
    ],
    pending: 'Your seat and what you own',
  },
  {
    id: 'company',
    index: 2,
    eyebrow: 'The company',
    title: 'Where is this company?',
    lead: 'Stage moves the numbers most. Industry and location are smaller corrections, and both default to no adjustment at all.',
    next: 'Next: the offer',
    fields: ['stage', 'industry', 'geo'],
    pending: 'Stage, industry and location',
  },
  {
    id: 'offer',
    index: 3,
    eyebrow: 'The offer',
    title: 'What did they offer?',
    lead: 'Leave anything blank you have not been told yet. The ask still works; it just cannot compare.',
    next: 'See my ask',
    fields: [
      'offerMode',
      'offeredEquityPct',
      'optionCount',
      'fullyDilutedShares',
      'strikePrice',
      'offeredSalary',
      'vestingYears',
    ],
    pending: 'What they offered',
  },
  {
    id: 'ask',
    index: 4,
    eyebrow: 'Your ask',
    title: 'Your ask',
    lead: null,
    next: null,
    fields: [],
    pending: null,
  },
]

export const offerStepByIndex = (index) =>
  OFFER_STEPS.find((step) => step.index === index)

/** Steps after `currentIndex` that still hold inputs. */
export const offerPendingAfter = (currentIndex) =>
  OFFER_STEPS.filter((step) => step.index > currentIndex && step.pending)

/* Options for the two selects. Kept beside the steps so the labels and the
   engine keys cannot drift apart. */

export const INDUSTRY_OPTIONS = [
  { value: 'saas', label: 'SaaS or general B2B software' },
  { value: 'ai', label: 'AI or machine learning' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'health', label: 'Health tech' },
  { value: 'other', label: 'Something else, or not sure' },
]

export const GEO_OPTIONS = [
  { value: 'bay_nyc', label: 'Bay Area or New York' },
  { value: 'us_hub', label: 'Another US tech hub' },
  { value: 'us_other', label: 'Elsewhere in the US' },
  { value: 'remote_national', label: 'Remote, paid a national rate' },
]

export const SEAT_OPTIONS = [
  { id: 'cto', label: 'CTO' },
  { id: 'engineer', label: 'Software engineer' },
  { id: 'ceo_builder', label: 'CEO who builds' },
]

export const JOINING_OPTIONS = [
  { id: 'formation', label: 'Co-founding at formation' },
  {
    id: 'fractional_conversion',
    label: 'Converting from fractional or contract',
  },
  { id: 'hired_after', label: 'Hired after formation' },
]

export const STAGE_OPTIONS = [
  { id: 'preseed', label: 'Pre-seed' },
  { id: 'seed', label: 'Seed' },
  { id: 'series_a', label: 'Series A' },
  { id: 'series_b_plus', label: 'Series B or later' },
]

export const YES_NO = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
]

/* `[]` cannot mean both "not answered yet" and "none of these", so the chip
   group carries an explicit none option and the store records that the question
   was answered. Design review DD12. */
export const NONE_OF_THESE = '__none__'
