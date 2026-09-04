/* The equity wizard's step registry. Drives the wizard shell (titles,
   order, progress), the results rail's "still needed" list, and the
   tests. One job per step:
     1 who you are   → role, joining, founders
     2 the work      → stage, gates, responsibilities, fractional fields
     3 the offer     → offer, salary, terms, exit path
     4 the read      → results */

export const STEPS = [
  {
    id: 'seat',
    index: 1,
    eyebrow: 'Who you are',
    title: 'Which seat are you negotiating for?',
    next: 'Next: what you’ve built',
    fields: ['role', 'joining', 'founders'],
    pending: 'Role and how you’re joining',
  },
  {
    id: 'work',
    index: 2,
    eyebrow: 'The work',
    title: 'What have you built and run so far?',
    next: 'Next: what’s on the table',
    fields: [
      'stage',
      'fullTimeOnSigning',
      'finalTechnicalSay',
      'responsibilities',
      'months',
      'hoursPerWeek',
      'ratePerHour',
      'feesBilled',
    ],
    pending: 'Stage and the work',
  },
  {
    id: 'offer',
    index: 3,
    eyebrow: 'The offer',
    title: 'What’s on the table?',
    next: 'See my read',
    fields: [
      'offerMode',
      'offeredEquityPct',
      'optionCount',
      'fullyDilutedShares',
      'strikePrice',
      'offeredSalary',
      'marketSalary',
      'instrument',
      'vestingYears',
      'cliffMonths',
      'path',
    ],
    pending: 'The offer',
  },
  {
    id: 'read',
    index: 4,
    eyebrow: 'Your read',
    title: 'Your read',
    next: null,
    fields: [],
    pending: null,
  },
]

export const stepById = (id) => STEPS.find((step) => step.id === id)

export const stepByIndex = (index) => STEPS.find((step) => step.index === index)

/* Steps after `currentIndex` that still hold inputs, for the rail's
   "still needed" list. */
export const pendingAfter = (currentIndex) =>
  STEPS.filter((step) => step.index > currentIndex && step.pending)
