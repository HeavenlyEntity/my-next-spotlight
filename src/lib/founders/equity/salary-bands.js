/*
 * Founders' Desk — cash salary bands, industry and geography multipliers.
 *
 * Data only: no logic beyond pure lookups, no imports. Every leaf carries
 * { source, asOf, confidence } so the results screen can print provenance
 * inline, matching the convention in benchmarks.js.
 *
 * THREE THINGS TO KNOW BEFORE EDITING
 *
 * 1. Baseline is US NATIONAL, base cash only.
 *    Base cash, never total compensation. This tool prices equity on its own
 *    axis, so a total-comp figure would count equity twice. Levels.fyi's
 *    startup pages are total comp and must never be pasted in here; they
 *    belong to the comparison plot.
 *    Pave publishes US Tier 1 (SF, NYC, Seattle), so its figures are divided
 *    by TIER1 to reach the national baseline the GEO table multiplies from.
 *    Kruze's client base skews coastal; those figures are left as published
 *    and flagged rather than adjusted, because their actual mix is unknown.
 *
 * 2. `bucket` is founding vs hired, and it comes from the engine's computed
 *    classification, never from the raw joining input. Kruze's founding CTO
 *    runs 30-40% below a non-founding one, and that discount is this tool's
 *    whole thesis.
 *
 * 3. p25 and p75 are DERIVED almost everywhere. No free source publishes
 *    quartiles for these seats by stage: Carta returns 403, Ravio rate-limits,
 *    Pave's executive set is partner-only, and Kruze publishes averages and
 *    says so. The spread below comes from the range widths Kruze does publish
 *    for the CEO seat. Rows whose p50 is sourced still carry a derived spread,
 *    which is why confidence is per row and the UI renders `est.` on derived
 *    rungs.
 */

/* Pave states its benchmark is US Tier 1; this is the Bay/NYC multiplier used
   to bring it back to the national baseline. Must match GEO.bay_nyc. */
const TIER1 = 1.12

/* Half-width of the band around p50, by stage, from the range widths Kruze
   publishes for the CEO seat. Pre-seed is widest because every dataset shows
   it as the noisiest cell. */
const SPREAD = Object.freeze({
  preseed: 0.18,
  seed: 0.13,
  series_a: 0.12,
  series_b_plus: 0.14,
})

const KRUZE_CTO = 'Kruze Consulting, Startup CTO Salary Guide'
const KRUZE_SUITE = 'Kruze Consulting, Startup C-Suite Salary Guide'
const KRUZE_CEO = 'Kruze Consulting, Startup CEO Salary Report'
const KRUZE_FOUNDER = 'Kruze Consulting, founder pay by amount raised'
const PAVE_ENG = 'Pave, founding engineer benchmark (n=569, 354 companies)'
const DERIVED = 'AMWARE, derived — see the note on the row'

const k = (n) => Math.round(n / 1000) * 1000

/**
 * Build one band row. `p50` is the researched median; p25 and p75 come from
 * the stage spread and are always derived.
 * @param {number} p50
 * @param {string} stage
 * @param {string} source
 * @param {string} asOf
 * @param {'sourced'|'interpolated'|'estimate'} confidence of the p50
 * @param {string} [note] how a non-sourced p50 was derived
 */
const band = (p50, stage, source, asOf, confidence, note = null) =>
  Object.freeze({
    p25: k(p50 * (1 - SPREAD[stage])),
    p50: k(p50),
    p75: k(p50 * (1 + SPREAD[stage])),
    source,
    asOf,
    confidence,
    /* p25 and p75 are derived even when p50 is sourced. */
    spreadConfidence: 'interpolated',
    note,
  })

export const BUCKETS = Object.freeze(['founding', 'hired'])

/* The engine's classification decides the bucket. A pending classification
   falls back to `hired`, because "market" means what the seat pays someone
   who is simply hired into it. */
export const CLASS_TO_BUCKET = Object.freeze({
  founder: 'founding',
  founding_executive: 'founding',
  hired_executive: 'hired',
  hire: 'hired',
  unknown: 'hired',
})

/*
 * Kruze publishes a founding vs non-founding CTO split (2024) and a mixed
 * stage table (2026). Where the published split is stable it is used directly.
 * At Series A it is not: the same report shows the CTO figure moving $223k to
 * $196k between editions, which reads as a cohort-mix change rather than a
 * real decline, so that cell uses the stable all-stage ratio against the 2026
 * spine instead of the published $293k.
 *
 *   all-stage 2024 split: founding $139k, non-founding $213k
 *   all-stage 2026 mixed median: $166k
 *   founding/mixed = 0.837   hired/mixed = 1.283
 */
export const SALARY_BANDS = Object.freeze({
  cto: Object.freeze({
    founding: Object.freeze({
      preseed: band(
        100_000,
        'preseed',
        DERIVED,
        '2024',
        'estimate',
        'Kruze starts at seed. Seed founding CTO $133k discounted by the ~0.75 seed-to-pre-seed step the founder pay-by-raise data implies.'
      ),
      seed: band(133_000, 'seed', KRUZE_CTO, '2024', 'sourced'),
      series_a: band(177_000, 'series_a', KRUZE_CTO, '2024', 'sourced'),
      series_b_plus: band(
        k(238_000 * 0.837),
        'series_b_plus',
        DERIVED,
        '2026',
        'interpolated',
        'Kruze 2026 Series B mixed median $238k times the all-stage founding/mixed ratio 0.837.'
      ),
    }),
    hired: Object.freeze({
      preseed: band(
        k(190_000 * (100 / 133)),
        'preseed',
        DERIVED,
        '2024',
        'estimate',
        'Seed non-founding CTO $190k carried down by the same seed-to-pre-seed step used for the founding row.'
      ),
      seed: band(190_000, 'seed', KRUZE_CTO, '2024', 'sourced'),
      series_a: band(
        k(196_000 * 1.283),
        'series_a',
        DERIVED,
        '2026',
        'interpolated',
        'The published 2024 figure ($293k) sits against a 2026 mixed median of $196k and is flagged as cohort-mixed, so this uses the stable all-stage hired/mixed ratio 1.283 instead.'
      ),
      series_b_plus: band(
        k(238_000 * 1.283),
        'series_b_plus',
        DERIVED,
        '2026',
        'interpolated',
        'Kruze 2026 Series B mixed median $238k times the all-stage hired/mixed ratio 1.283.'
      ),
    }),
  }),

  /*
   * ENGINEER — one band per stage, deliberately identical across buckets.
   *
   * No public source splits engineer cash by founding versus hired. Pave
   * documents founding engineers taking cash concessions for ownership, which
   * points the opposite way to the CTO discount, but publishes no paired
   * figures. Inventing a split here would be the same error the plan refuses
   * for equity-by-industry, so both buckets share one band and the equity side
   * carries the founding-engineer difference.
   *
   * Anchor: Pave founding-engineer p50 $187k, US Tier 1, Feb 2025, divided by
   * TIER1 for the national baseline. Stage shape from the multipliers
   * Levels.fyi and Ravio independently agree on (0.895 / 1.0 / 1.105 / 1.147).
   */
  engineer: (() => {
    const seedNational = 187_000 / TIER1
    const shape = {
      preseed: 0.895,
      seed: 1,
      series_a: 1.105,
      series_b_plus: 1.147,
    }
    const rows = Object.freeze({
      preseed: band(
        seedNational * shape.preseed,
        'preseed',
        DERIVED,
        '2025',
        'interpolated',
        'Pave seed anchor scaled by the Levels.fyi pre-seed stage multiplier 0.895. Every dataset shows pre-seed as the noisiest cell.'
      ),
      seed: band(
        seedNational,
        'seed',
        PAVE_ENG,
        '2025',
        'sourced',
        'Pave publishes $187k p50 for US Tier 1; divided by 1.12 for the national baseline.'
      ),
      series_a: band(
        seedNational * shape.series_a,
        'series_a',
        DERIVED,
        '2025',
        'interpolated',
        'Pave seed anchor scaled by the Levels.fyi Series A stage multiplier 1.105.'
      ),
      series_b_plus: band(
        seedNational * shape.series_b_plus,
        'series_b_plus',
        DERIVED,
        '2025',
        'interpolated',
        'Pave seed anchor scaled by the Levels.fyi Series B multiplier 1.147. Growth flattens after Series A in both the US and UK data.'
      ),
    })
    return Object.freeze({ founding: rows, hired: rows })
  })(),

  /*
   * CEO WHO BUILDS.
   *
   * Kruze's CEO stage table makes no founder versus hired split, so it is an
   * upper bound for a founder-CEO and is used for the hired bucket. The
   * founding bucket uses Kruze's founder pay by amount raised, which is the
   * closest published proxy for a founder paying themselves.
   *
   * Pilot's founder-only survey (n=1,844) puts the all-founder median at $75k
   * with 80% of VC-backed founders between $50k and $100k. Kruze is the spine
   * because it reads payroll rather than self-report; Pilot is named in the
   * sources disclosure. The two must never be averaged: they measure different
   * populations and disagree by roughly 2x.
   */
  ceo_builder: Object.freeze({
    founding: Object.freeze({
      preseed: band(
        106_000,
        'preseed',
        KRUZE_FOUNDER,
        '2024',
        'sourced',
        'Founders who had raised under $2M. A raise band, not a stage label.'
      ),
      seed: band(
        135_000,
        'seed',
        KRUZE_FOUNDER,
        '2024',
        'sourced',
        'Founders who had raised $2-5M.'
      ),
      series_a: band(
        171_000,
        'series_a',
        KRUZE_FOUNDER,
        '2024',
        'sourced',
        'Founders who had raised $5-10M.'
      ),
      series_b_plus: band(
        k(216_000 * 0.837),
        'series_b_plus',
        DERIVED,
        '2026',
        'interpolated',
        'No raise band published above $10M. Kruze 2026 Series B CEO $216k times the founding/mixed ratio 0.837.'
      ),
    }),
    hired: Object.freeze({
      preseed: band(
        k(153_000 * 0.75),
        'preseed',
        DERIVED,
        '2026',
        'estimate',
        'Kruze CEO table starts at seed. Seed $153k carried down by the same step used for the CTO rows.'
      ),
      seed: band(153_000, 'seed', KRUZE_CEO, '2026', 'sourced'),
      series_a: band(203_000, 'series_a', KRUZE_CEO, '2026', 'sourced'),
      series_b_plus: band(
        216_000,
        'series_b_plus',
        KRUZE_CEO,
        '2026',
        'sourced'
      ),
    }),
  }),
})

/*
 * INDUSTRY — a multiplier on cash only, keyed by role.
 *
 * "AI pays 3x" is true only of OpenAI and Anthropic. Strip those two out and
 * the vertical multiplier collapses to about 1.1x; Scale AI sits at 1.28x,
 * below the SaaS companies Databricks and Figma. A large AI multiplier would
 * be wrong for almost every AI startup, which is the population using this.
 *
 * The curves run in OPPOSITE directions by seat, which is why this is keyed by
 * role: AI's premium grows with IC seniority (1.06 entry to 1.19 staff) and
 * nearly vanishes for managers (1.03); fintech is the mirror, parity for
 * engineers and largest at executive.
 *
 * Equity is deliberately NOT adjusted. Verified negative: no public source
 * publishes grant size by industry at a fixed stage. Carta has no sector split,
 * Index Ventures is explicitly sector-agnostic, Levels.fyi has no such
 * taxonomy, and Radford is paywalled. Only growth rates are public.
 */
const ind = (multiplier, source, asOf, confidence) =>
  Object.freeze({ multiplier, source, asOf, confidence })

const LEVELS_AI = 'Levels.fyi AI engineer compensation trends'
const RAVIO_AI = 'Ravio, 2026 compensation trends'
const RAVIO_FIN = 'Ravio, fintech compensation benchmarks'
const WELLFOUND = 'Wellfound hiring data'
const THELANDER = 'J. Thelander private company compensation survey'

export const INDUSTRIES = Object.freeze([
  'saas',
  'ai',
  'fintech',
  'health',
  'other',
])

export const INDUSTRY = Object.freeze({
  saas: Object.freeze({
    engineer: ind(1.0, 'baseline', '2026', 'sourced'),
    cto: ind(1.0, 'baseline', '2026', 'sourced'),
    ceo_builder: ind(1.0, 'baseline', '2026', 'sourced'),
  }),
  ai: Object.freeze({
    /* Three independent sources converge: Levels.fyi 1.12x at engineer level,
       Ravio 1.12x IC base, Wellfound 1.09x. */
    engineer: ind(
      1.1,
      `${LEVELS_AI} / ${RAVIO_AI} / ${WELLFOUND}`,
      '2025',
      'sourced'
    ),
    /* Ravio puts the AI premium at 1.03x for managers. Executives sit between
       that and the IC figure with no direct measurement. */
    cto: ind(1.05, RAVIO_AI, '2025', 'interpolated'),
    ceo_builder: ind(1.05, RAVIO_AI, '2025', 'interpolated'),
  }),
  fintech: Object.freeze({
    engineer: ind(1.02, RAVIO_FIN, '2026', 'sourced'),
    /* Ravio: US fintech executives +27% across all functions, not CTO
       specifically. */
    cto: ind(1.27, RAVIO_FIN, '2025', 'interpolated'),
    ceo_builder: ind(1.27, RAVIO_FIN, '2025', 'interpolated'),
  }),
  health: Object.freeze({
    /* The health-tech discount narrative is not supported for engineers: the
       only apples-to-apples IC comparison shows parity. */
    engineer: ind(1.0, WELLFOUND, '2026', 'estimate'),
    cto: ind(1.0, WELLFOUND, '2026', 'estimate'),
    /* Digital health CEOs run 0.82x tech early stage and reverse to 1.35x by
       mid stage. The early-stage figure is used because this tool's population
       skews early; the reversal is named in the sources disclosure. */
    ceo_builder: ind(0.82, THELANDER, '2025', 'interpolated'),
  }),
  other: Object.freeze({
    engineer: ind(1.0, 'no adjustment applied', '2026', 'sourced'),
    cto: ind(1.0, 'no adjustment applied', '2026', 'sourced'),
    ceo_builder: ind(1.0, 'no adjustment applied', '2026', 'sourced'),
  }),
})

/*
 * GEOGRAPHY — a multiplier on cash, baseline US national.
 *
 * Geography moves cash more than industry does, which is why adding industry
 * without this would have raised total error rather than lowering it.
 *
 * Pilot's 58% founder spread (SF $103k against $65k elsewhere) is founder
 * self-payment rather than a market rate, so it informs the CEO caveat and not
 * these multipliers.
 */
const geo = (multiplier, source, asOf, confidence) =>
  Object.freeze({ multiplier, source, asOf, confidence })

const LEVELS_METRO = 'Levels.fyi metro breakdowns (Google L5, Microsoft 63)'
const KRUZE_GEO = 'Kruze Consulting, engineer pay by geography'
const RFS = 'Recruiting From Scratch, founding engineer postings'

export const GEOS = Object.freeze([
  'bay_nyc',
  'us_hub',
  'us_other',
  'remote_national',
])

export const GEO = Object.freeze({
  /* Google L5 runs $428,550 nationally against $473,447 in the Bay (+10.5%);
     Microsoft's senior figure reaches +13.6% in New York. */
  bay_nyc: geo(1.12, LEVELS_METRO, '2026', 'sourced'),
  /* Microsoft Seattle $242,636 against a US median of $244,303. */
  us_hub: geo(1.0, LEVELS_METRO, '2026', 'sourced'),
  /* Microsoft outside high-cost areas $227,966 (−6.7%); Kruze puts non-Bay
     hubs 11-14% below the Bay. */
  us_other: geo(0.9, `${LEVELS_METRO} / ${KRUZE_GEO}`, '2026', 'interpolated'),
  /* Remote prices close to national rather than at a deep discount: $195k
     against $200k in San Francisco. */
  remote_national: geo(0.97, RFS, '2026', 'interpolated'),
})

export const SALARY_SOURCES = Object.freeze([
  Object.freeze({
    id: 'kruze_cto',
    name: KRUZE_CTO,
    asOf: '2024',
    url: 'https://kruzeconsulting.com/blog/startup-cto-salary/',
  }),
  Object.freeze({
    id: 'kruze_suite',
    name: KRUZE_SUITE,
    asOf: '2026',
    url: 'https://kruzeconsulting.com/blog/startup-c-suite-salary-guide/',
  }),
  Object.freeze({
    id: 'kruze_ceo',
    name: KRUZE_CEO,
    asOf: '2026',
    url: 'https://kruzeconsulting.com/blog/startup-ceo-salary-report/',
  }),
  Object.freeze({
    id: 'pave_eng',
    name: PAVE_ENG,
    asOf: '2025',
    url: 'https://www.pave.com/blog-posts/how-much-comp-should-the-first-engineer-get',
  }),
  Object.freeze({
    id: 'pilot_founder',
    name: 'Pilot, Founder Salary Report (n=1,844) — named for contrast, never averaged with Kruze',
    asOf: '2025',
    url: 'https://pilot.com/report/founder-salary-2025',
  }),
  Object.freeze({
    id: 'ravio_ai',
    name: RAVIO_AI,
    asOf: '2025',
    url: 'https://ravio.com/blog/ai-compensation-and-talent-trends',
  }),
  Object.freeze({
    id: 'ravio_fintech',
    name: RAVIO_FIN,
    asOf: '2026',
    url: 'https://ravio.com/salary-benchmarks/fintech',
  }),
  Object.freeze({
    id: 'levels_ai',
    name: LEVELS_AI,
    asOf: '2025',
    url: 'https://www.levels.fyi/blog/ai-engineer-compensation-trends-q3-2025.html',
  }),
  Object.freeze({
    id: 'thelander',
    name: THELANDER,
    asOf: '2025',
    url: 'https://jthelander.com/2025/08/digital-health-ceo-compensation-vs-biotech-and-tech-2025-benchmark-data/',
  }),
])

export const SALARY_BANDS_UPDATED_AT = '2026-09'

/**
 * Map a computed classification to a band bucket.
 * @param {string} className one of CLASSES, or 'unknown' when still pending
 * @returns {'founding'|'hired'}
 */
export function bucketFor(className) {
  return CLASS_TO_BUCKET[className] || 'hired'
}

/**
 * The cash band for a seat, bucket and stage. Never throws: an unknown
 * combination falls back to the hired bucket, then to the seed row, so the
 * ladder always has something to render.
 * @returns {object} a frozen band row
 */
export function bandFor(role, bucket, stage) {
  const byRole = SALARY_BANDS[role] || SALARY_BANDS.cto
  const byBucket = byRole[bucket] || byRole.hired
  return byBucket[stage] || byBucket.seed
}

/**
 * The multiplier a seat gets from its industry, and from where it is.
 * @returns {{ industry: object, geo: object, combined: number }}
 */
export function multipliersFor(role, industry, geoKey) {
  const i =
    (INDUSTRY[industry] && INDUSTRY[industry][role]) ||
    INDUSTRY.other[role] ||
    INDUSTRY.other.engineer
  const g = GEO[geoKey] || GEO.us_hub
  return Object.freeze({
    industry: i,
    geo: g,
    combined: Number((i.multiplier * g.multiplier).toFixed(4)),
  })
}

/**
 * The engine's single market salary: what this seat pays someone simply hired
 * into it, at the national baseline. Replaces the old MARKET_SALARY table so
 * the equity calculator and the job offer calculator can never disagree about
 * what "market" means.
 *
 * The founder discount is exactly the gap between this and the founding band,
 * which is the tool's thesis: taking a founder's salary is the pay cut that
 * earns the equity.
 * @returns {number} USD
 */
export function marketSalaryFor(role, stage) {
  return bandFor(role, 'hired', stage).p50
}
