# Plan: Founders' Desk — Job Offer Calculator (locked)

Reviewed by /plan-eng-review on 2026-09-04
Branch: feat/payload-cms-integration
Repo: HeavenlyEntity/my-next-spotlight
Sibling: docs/plans/founders-desk-equity-calculator.md (IMPLEMENTED 2026-09-03)
Design system: DESIGN.md
Status: LOCKED — 16 decisions resolved, 17 outside-voice findings folded. Blocked on T0.

## What this is

The equity calculator answers **"is this equity fair for the work I am doing?"** It ends with a range and a verdict.

The job offer calculator answers the next question: **"so what do I ask for, in cash and in equity, and where do I stop?"** It ends with a ladder of three rungs the user can say out loud, and a chart showing where the offer sits against named companies.

They are two framings of one engine, not two engines.

## Decisions (D1-D16)

| #   | Decision                                                                                                                             | Source                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| D1  | Full scope in v1: ask ladder + industry + geography + comparison plot. Scope reduction offered and declined.                         | Step 0                          |
| D2  | Company figures refresh via a **script**, with a visible as-of date and a self-warning banner past six months.                       | Architecture 1                  |
| D3  | Store **persists by default** (sessionStorage) with a clear button. Desk and equity copy change to "nothing leaves your browser".    | Architecture 2                  |
| D4  | Cash band bucket comes from **`read.classification.class`**, never the raw joining input.                                            | Architecture 3                  |
| D5  | The floor's reality check values equity at **zero**. Refined by D10: this is a note, not the floor equation.                         | Architecture 4                  |
| D6  | The store **subsumes** `handoff.js` storage. `briefForContact()` survives as pure formatting.                                        | Code quality 1                  |
| D7  | The chart is **hand-built on the desk's figure grammar**, not pulled from PaceUI or React Bits.                                      | Code quality 2                  |
| D8  | Refresh script gets a **fixture parser test plus live sanity checks** that refuse to write bad data.                                 | Tests 1                         |
| D9  | Number inputs **commit on blur or Enter**, matching the existing slider convention.                                                  | Performance 1                   |
| D10 | **Each rung recomputes the equity band at its own cash.** Fixes incoherent pairs and the floor collapse.                             | Outside voice 2                 |
| D11 | Plot draws **cash bars plus a scenario-driven equity layer**. Rendered for the engineer seat, withheld for the others.               | Outside voice 10, 11            |
| D12 | **Land the existing work first.** The founders feature is entirely untracked.                                                        | Outside voice 17                |
| D13 | **Geography is an input** alongside industry, because it moves cash more.                                                            | Outside voice 13                |
| D14 | Cold start asks the **two classification gates** on step 1.                                                                          | Outside voice 4                 |
| D15 | Seven mechanical defects folded: field names, shares mode, clear semantics, table shapes, refresh script, storage merge, test paths. | Outside voice 5,7,9,12,14,15,16 |
| D16 | Cold start also asks the **responsibility chips**; the gates alone leave non-formation paths pending.                                | classify.js:58                  |

## The relationship between the two tools

**One engine, consumed twice.** `computeRead()` already returns the band, the adjustments, the dilution series and the exit scenarios. The job offer calculator re-derives none of it.

```
                    +-----------------------------------------+
  store (shared) -->| computeRead(inputs)                     |
                    |   band . adjustments . range . scenarios|
                    +---------------+-------------------------+
                                    |  called once per rung, at that rung's cash
                                    v
  SALARY_BANDS[role][bucket][stage] --> computeAsk(read, prefs) --> Ladder
  INDUSTRY[key][role]  ------------->     { ceiling, target, floor,
  GEO[key]             ------------->       trade, bands, flags, sentences }
```

**The two hand-offs**, both against the live store, so nothing is re-typed and the tools cannot disagree:

| From                          | Control                                |
| ----------------------------- | -------------------------------------- |
| Equity results, verdict layer | "Turn this into an ask ->"             |
| Job offer ladder              | "See how the equity band was sized ->" |

## The ladder (D10, the load-bearing correction)

**The bug the outside voice caught.** The equity band is computed _from_ the user's offered salary: `adjustments.js:52` sets `gap = marketSalary - offeredSalary`, converts it to points, and adds it to the band. So `range.hi` already assumes the pay cut in the current offer. Pairing it with a recommended p75 salary prices equity against a cash number that rung does not use. It also collapsed the floor: with equity at zero, "cash >= market cash" solves to p50, making floor and target identical.

**The fix.** Each rung runs the engine at its own cash number.

```
rung      cash                          equity
--------------------------------------------------------------------------------
ceiling   p75 x industry x geo          range.hi of computeRead({..., offeredSalary: cash_ceiling})
target    p50 x industry x geo          range.mid of computeRead({..., offeredSalary: cash_target})
floor     p25 x industry x geo          range.lo of computeRead({..., offeredSalary: cash_floor})
```

Three engine passes per read. The engine is pure and cheap, and this is what it was built to do.

**What the ladder now says, honestly.** Ask for more cash and the equity you can defend goes _down_, because the pay-cut argument weakens. Ask for less and it goes up. The ceiling's equity number is smaller than the naive version, and the screen states that rather than hiding it.

> Both numbers on a rung are computed together. Push the cash up and the equity you can defend comes down, because part of the case for equity is that you took less cash. This is the trade, priced.

**The floor's reality check (D5 survives as a note, not the equation):**

> If this equity turns out to be worth nothing, you took home the cash alone. Only you know your runway. This is where the math stops defending the offer, not where your life does.

**The trade rate, generated from `EXCHANGE_RATES`:**

| Stage         | Points per $10k given up | From the table      |
| ------------- | ------------------------ | ------------------- |
| pre-seed      | 0.15                     | $50,000 = 0.75 pts  |
| seed          | 0.10                     | $50,000 = 0.50 pts  |
| Series A      | 0.075                    | $100,000 = 0.75 pts |
| Series B plus | 0.04                     | $100,000 = 0.40 pts |

The falling rate is its own lesson: trading salary for equity is a good deal early and a bad one late. At Series B and later the ladder says so in one line.

## Architecture

### Files

| Path                                                       | What                                                                   | New? |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| `src/lib/founders/equity/salary-bands.js`                  | `SALARY_BANDS[role][bucket][stage]`, `INDUSTRY[key][role]`, `GEO[key]` | new  |
| `src/lib/founders/equity/negotiation.js`                   | `computeAsk(read, prefs)` -> frozen Ladder. Pure, never throws.        | new  |
| `src/lib/founders/equity/company-comp.js`                  | Levels.fyi reference rows + `AS_OF`, generated by the refresh script   | new  |
| `src/lib/founders/offer-store.js`                          | Zustand store, sessionStorage, `clear()` removes the key               | new  |
| `scripts/refresh-company-comp.mjs`                         | Regenerates `company-comp.js`, sanity-gated                            | new  |
| `src/app/(site)/founders/job-offer/page.jsx`               | Route + metadata                                                       | new  |
| `src/app/(site)/founders/job-offer/JobOfferCalculator.jsx` | Two-step wizard + ladder + plot                                        | new  |
| `src/components/founders/ladder/*.jsx`                     | `AskLadder`, `Rung`, `TradeRate`, `FloorNote`                          | new  |
| `src/components/founders/market-plot.jsx`                  | Stacked bars on the desk's figure grammar                              | new  |
| `src/lib/founders/handoff.js`                              | Storage removed; `briefForContact()` stays as pure formatting          | edit |
| `src/app/(site)/contact/ContactForm.jsx`                   | Reads the store instead of the stash                                   | edit |
| `src/lib/founders/__tests__/handoff.test.js`               | Storage tests removed, formatting tests stay                           | edit |
| `src/lib/founders/tools.js`                                | Registry entry (O1)                                                    | edit |
| `src/components/founders/results/verdict.jsx`              | "Turn this into an ask" CTA                                            | edit |
| `src/app/(site)/founders/page.jsx`                         | Privacy copy per D3, second live tool                                  | edit |
| `src/app/(site)/founders/equity/page.jsx`                  | Privacy copy per D3                                                    | edit |
| `vitest.config.mjs`                                        | UI project also discovers `src/app/**/__tests__/**/*.test.jsx`         | edit |

### The store (D3, D15)

Field names must match what `normalizeInputs()` consumes. `normalize.js:133` reads `src.role`; `normalize.js:135` reads `src.stage`. A store using `seat` and `stageKey` would silently default every non-CTO seat to CTO and every stage to pre-seed.

```js
// src/lib/founders/offer-store.js
const INITIAL = {
  role: 'cto',
  joining: 'fractional_conversion',
  stage: 'preseed',
  industry: 'saas',
  geo: 'us_national',
  responsibilities: [],
  fullTimeOnSigning: null,
  finalTechnicalSay: null, // D14, D16
  offerMode: 'percent',
  offeredEquityPct: null,
  optionCount: null,
  fullyDilutedShares: null,
  strikePrice: null, // D15 #7
  offeredSalary: null,
  vestingYears: 4,
}
useOfferStore = create(
  persist(
    (set) => ({
      ...INITIAL,
      set: (patch) => set(patch),
      clear: () => {
        useOfferStore.persist.clearStorage()
        set(INITIAL)
      }, // D15 #9
    }),
    { name: 'amw:offer', storage: createJSONStorage(() => sessionStorage) }
  )
)
```

`clear()` removes the key rather than writing defaults back, and the equity wizard's sync must not re-hydrate immediately after: guard the sync on a cleared tick.

The equity wizard keeps its reducer for step index, scenario overrides and the fractional sliders. Those never enter the store.

### Engine contract

```js
/**
 * @param {object} read   a computeRead() result, for classification and the base inputs
 * @param {object} prefs  { industry, geo, computeRead }  computeRead injected for testability
 * @returns {{
 *   ceiling: Rung, target: Rung, floor: Rung,
 *   trade:  { unitDollars, unitPts, perTenK, sentence },
 *   bands:  { cash: {p25,p50,p75,source,asOf,confidence},
 *             industry: {key,multiplier,source,asOf,confidence},
 *             geo: {key,multiplier,source,asOf,confidence} },
 *   flags:  Array<{ id, text, promoted }>,
 *   sentences: { ceiling, target, floor, tradeWarning }
 * }}
 * Rung = { cash, equityPct, cites: string[], read: object }
 */
export function computeAsk(read, prefs) {}
```

Same discipline as `computeRead`: pure, frozen, never throws, never NaN, falls back to a default ladder on internal failure.

### Data shapes (D15 #12)

A flat `SALARY_BANDS[seat][stage]` cannot key on computed classification, and a scalar industry multiplier cannot express curves that run in opposite directions by seat.

```js
SALARY_BANDS = { cto: { founding: { preseed: {p25,p50,p75,source,asOf,confidence}, ... },
                        hired:    { ... } },
                 engineer: { ... }, ceo_builder: { ... } }

INDUSTRY = { ai:      { engineer: {m:1.10}, cto: {m:1.05}, ceo_builder: {m:1.05} },
             fintech: { engineer: {m:1.02}, cto: {m:1.27}, ceo_builder: {m:1.27} },
             health:  { engineer: {m:1.00}, cto: {m:1.00}, ceo_builder: {m:0.82} },
             saas:    { ... }, other: { ... } }

GEO = { bay_nyc: {m:1.12}, us_hub: {m:1.00}, us_other: {m:0.90}, remote_national: {m:0.97} }
```

Every leaf carries `source`, `asOf`, `confidence`. `bucket` resolves from `read.classification.class`: the founding-executive family maps to `founding`, the hire families map to `hired`.

## Salary bands

### The quartile problem (option A, chosen)

Kruze publishes stage-by-stage cash from real payroll, but publishes **averages, not quartiles**. Carta returns 403, Ravio 429, Pave's executive set is partner-only. So executive p50 is sourced, p25/p75 are derived from a documented spread and labeled `interpolated`, and the tool renders that label. Real quartiles arrive when an account exists.

### Executive figures (sourced)

| Seat | Stage     | Figure   | Note                           |
| ---- | --------- | -------- | ------------------------------ |
| CTO  | seed      | $155,000 | average                        |
| CTO  | Series A  | $196,000 | average                        |
| CTO  | Series B+ | $238,000 | average                        |
| CEO  | seed      | $153,000 | average, mixes founder + hired |
| CEO  | Series A  | $203,000 | average, mixes founder + hired |
| CEO  | Series B+ | $216,000 | average, mixes founder + hired |

Kruze Consulting, C-Suite Salary Guide and CEO Salary Report, 2026. CTO pre-seed is not published; Kruze starts at seed.

### The founder discount (the strongest finding)

| Cut        | Founding CTO | Non-founding CTO | Discount |
| ---------- | ------------ | ---------------- | -------- |
| All stages | $139,000     | $213,000         | 35%      |
| Seed       | $133,000     | $190,000         | 30%      |
| Series A   | $177,000     | $293,000         | 40%      |

Kruze Consulting, Startup CTO Salary Guide, 2024. This is why the band keys on the computed class.

### Engineer band (base cash, US, senior)

| Stage     | p25       | p50       | p75       | Confidence                        |
| --------- | --------- | --------- | --------- | --------------------------------- |
| pre-seed  | ~$146,000 | ~$167,000 | ~$192,000 | estimate / interpolated           |
| seed      | ~$163,000 | $187,000  | $215,000  | p50 and p75 sourced, p25 estimate |
| Series A  | ~$180,000 | ~$207,000 | ~$238,000 | interpolated                      |
| Series B+ | ~$187,000 | ~$215,000 | ~$247,000 | interpolated                      |

Anchored on Pave's founding-engineer benchmark (US Tier 1, Feb 2025, n=569 across 354 companies), shaped by stage multipliers Levels.fyi and Ravio independently agree on.

### The unit trap

Levels.fyi publishes true quartiles by startup stage, but the figure is **base plus annualized stock plus bonus**. It cannot be the cash band: this tool prices equity separately, so using it would count equity twice. Those figures belong to the comparison plot, where total comp is the right unit.

### Caveats that must reach the sources note

- CEO rows are an **upper bound** for a founder-CEO. Kruze makes no founder split for CEOs; Pilot's founder-only survey (n=1,844) puts the median at $75,000.
- Kruze and Pilot **disagree roughly 2x** on founder pay, methodologically. Never average them. Kruze is the spine; Pilot is named in the disclosure.
- Every stage figure is a **mean, biased upward**. Where both are published the delta is 0.6% (CTO) and 3.6% (CEO). Apply the shift and say so.
- Do **not** encode the apparent Series A CTO drop ($223k -> $196k) as a trend; it is more likely a cohort-mix change.
- The founding-engineer title moves cash **down** and equity **up**. The tool must not let anyone read it as a raise.

## Industry

**"AI pays 3x" is true only of OpenAI and Anthropic.** Strip them out and the AI multiplier collapses from about 3.0x to about 1.1x. Scale AI sits at 1.28x, below SaaS companies Databricks and Figma. A large AI multiplier would be wrong for almost every AI startup, which is the population using this tool.

| Industry         | Engineer | CTO / CEO               | Evidence                                                                 |
| ---------------- | -------- | ----------------------- | ------------------------------------------------------------------------ |
| SaaS / B2B       | 1.00x    | 1.00x                   | baseline                                                                 |
| AI / ML          | 1.10x    | ~1.05x                  | Levels.fyi 1.12x, Ravio 1.12x IC, Wellfound 1.09x; manager premium 1.03x |
| Fintech          | 1.02x    | 1.27x                   | Ravio: engineers at parity, US executives +27%                           |
| Health tech      | 1.00x    | 0.82x early / 1.35x mid | Wellfound parity for IC; Thelander for CEO by stage                      |
| Other / not sure | 1.00x    | 1.00x                   | and the ladder says so                                                   |

**Seniority curves run in opposite directions.** AI's premium grows with IC seniority (1.06 entry to 1.19 staff) and nearly vanishes for managers (1.03). Fintech is the mirror: parity for engineers, largest at executive. One curve cannot serve both, which is why the table is keyed by role.

**Frontier labs are a flag, not an industry.** OpenAI and Anthropic appear in the plot as reference points, never as a multiplier a pre-seed AI startup inherits.

**Equity by industry: a verified negative, not a gap.** Carta publishes no public sector split for equity levels. Index Ventures is explicitly sector-agnostic. Levels.fyi has no SaaS/AI/fintech taxonomy. Radford has it, fully paywalled. Only growth rates are public, so the multiplier touches **cash only** and equity gets a cited directional note:

> AI startups have been raising equity grants faster than cash: median initial grants up 31% over two years against 11% across all startups, and up 59% at companies valued under $10M. There is no published grant-size benchmark by industry at a given stage, so this tool does not adjust your equity band for it. Ask for the number, and know the direction is moving your way.

**Version and date-stamp the multipliers.** The Levels.fyi AI median swung $295k to $228.5k to $277k across 2024-2025, and the entry-level premium fell from 10.74% to 6.2% in a year. Every multiplier carries an `asOf`.

**Two traps, recorded so nobody re-sources them.** `levels.fyi/companies/fintech/salaries` is a company literally named FINTECH. And "crypto pays 30-50% more" and "fintech CTOs earn 15-25% above market" trace to content farms with no methodology.

## Geography (D13)

Geography moves cash more than industry does, so omitting it while adding industry raised total error.

| Bucket                | Multiplier | Evidence                                                                     |
| --------------------- | ---------- | ---------------------------------------------------------------------------- |
| Bay Area / New York   | ~1.12x     | Google L5 $428,550 US vs $473,447 Bay (+10.5%); Microsoft NYC +13.6%         |
| Other US tech hub     | 1.00x      | Microsoft Seattle $242,636 vs US $244,303                                    |
| Elsewhere in the US   | ~0.90x     | Microsoft outside high-cost $227,966 (-6.7%); Kruze non-Bay hubs -11 to -14% |
| Remote, national rate | ~0.97x     | Recruiting From Scratch: remote $195k vs SF $200k                            |

Pilot's 58% founder spread (SF $103k vs other US $65k) is founder self-payment, not a market rate, so it informs the CEO seat's caveat rather than the multiplier.

## The comparison plot (D11)

**Why the stacked bar could not be drawn as first designed.** A company's equity segment is a dollar figure. The user's is a percentage with no dollar value until something assumes a valuation, a cap table, a strike and an annualization. The first wireframe drew it anyway, at no defensible length.

**The fix: the assumption becomes a control.** Both sides show guaranteed cash. The equity layer is driven by the exit scenario the reader picks, so their bar moves and the RSU bars do not.

```
                guaranteed cash        liquid equity       scenario equity
Netflix L5      ############################                                 $506k  L
Anthropic Sr    ################                    :::::::::::::            $591k  T
Google L5       ###########                --------                          $429k  L
Microsoft 63    #########     -                                              $244k  L
------------- market: senior engineer $312k --------------------------------
YOUR OFFER      ##########                          :::::::::::::::          O
                              < [ $0 ][ conservative ][ base ][ upside ] >
                                        your bar moves; theirs do not
```

At the $0 card their bar collapses to salary alone. That is the most useful thing this chart can show anyone, and it reuses `SCENARIO_VALUATIONS` and the dilution series that already exist and are tested.

### Seat relevance, resolved by research (2026-09-04)

The outside voice was right that senior-engineer rows are not a comparison for a CTO. The research pass that followed found the fix: **Levels.fyi does publish a manager and director ladder**, on a separate URL path from the software-engineer pages. Nine companies carry it under one identical methodology with a full base/stock/bonus split.

| Seat          | Comparator ladder                       | Status                                 |
| ------------- | --------------------------------------- | -------------------------------------- |
| `engineer`    | IC ladder (senior software engineer)    | renders                                |
| `cto`         | Leadership ladder (manager to director) | renders, labeled as leadership not CTO |
| `ceo_builder` | none                                    | withheld with an explanation           |

**There is no CTO row anywhere, and that is a verified negative.** Levels.fyi has no CTO track for any named company. The obvious escape hatch, SEC proxy disclosure, also fails at this tier: Microsoft's FY2025 proxy does not list its CTO as a named executive officer, and Netflix's 2026 proxy names six executive officers, none of whom is its CTO. At mega-cap scale the CTO is essentially never a top-five NEO, so proxies disclose nothing. The axis is therefore labeled **"engineering leadership, manager to director"**, never "CTO".

**Scope bands, because level codes are not equivalent.** Anchor the comparison on scope:

| Scope band          | Google | Meta | Amazon    | Microsoft      | Apple | Stripe | Databricks | Salesforce        |
| ------------------- | ------ | ---- | --------- | -------------- | ----- | ------ | ---------- | ----------------- |
| First-line manager  | L5     | M0   | L5 SDM    | 64             | M1/M2 | M0     | M2         | Manager           |
| Manager of managers | L6-L7  | M1   | L7 Sr SDM | 66             | M3    | M2     | M4         | Senior Manager    |
| Director            | L8     | D1   | Director  | 67 Sr Director | D1    | M3     | M5         | Director / Sr Dir |

**The director rung is the honest comparator for a startup CTO.** Someone running 30 to 100 engineers is applying into a D1 or L8 seat, not a VP seat. Those cluster at $1.27M to $1.45M a year at Google, Meta, Apple and Amazon.

**Leadership reference data (Levels.fyi, US, retrieved 2026-09-04).** Director rung shown; the component carries all three bands.

| Company    | Level           | Base       | Stock/yr   | Bonus    | Total      |
| ---------- | --------------- | ---------- | ---------- | -------- | ---------- |
| Apple      | D1              | $361,333   | $913,333   | $176,250 | $1,450,916 |
| Meta       | D1              | $303,091   | $1,069,091 | $62,000  | $1,434,182 |
| Google     | L8              | $373,889   | $874,861   | $126,653 | $1,375,403 |
| Amazon     | Director (L8)   | $307,478   | $958,617   | $0       | $1,266,095 |
| Netflix    | Director        | $1,210,000 | $0         | $0       | $1,210,000 |
| Databricks | M5              | $304,000   | $858,000   | $35,800  | $1,200,000 |
| Salesforce | Senior Director | $338,000   | $176,000   | $81,200  | $595,000   |
| Microsoft  | 67 Sr Director  | $255,215   | $197,917   | $76,208  | $529,340   |

**Three things the leadership rows need on screen.**

1. **Microsoft and Salesforce are not broken.** Their directors land near $530k to $595k against $1.27M to $1.45M elsewhere, because they genuinely grant far less RSU value. The stacked segments show why; a totals-only chart would read as an error.
2. **Netflix cannot share the encoding.** Its rows are 100% base with zero stock, which is policy, not missing data. It gets its own mark.
3. **Every director row is thin-n.** Meta's M2 ($1.56M) exceeds its own D1 ($1.43M), which is a level inversion and near-certain small-sample noise. Director and above carry a low-confidence marker.

**OpenAI and Anthropic are excluded from the leadership ladder.** OpenAI's manager page renders one row, mislabeled with an IC title. Anthropic publishes no leveled manager rows at all, only an unitemized band. Both still appear on the IC ladder for the engineer seat.

**Reference data (Levels.fyi, US medians, 2026).** Attribution required by their license.

| Company            | Level   | Base     | Stock/yr | Bonus   | Total    | Stock share | Badge |
| ------------------ | ------- | -------- | -------- | ------- | -------- | ----------- | ----- |
| Netflix            | L5      | $506,226 | $0       | $0      | $506,226 | 0%          | L     |
| Anthropic          | Senior  | $328,462 | $262,885 | $0      | $591,347 | 44%         | T     |
| OpenAI             | L4      | $272,800 | $379,500 | $0      | $652,300 | 58%         | T     |
| Google             | L5      | $228,551 | $169,062 | $30,937 | $428,550 | 39%         | L     |
| Meta               | E5      | $225,197 | $175,148 | $24,531 | $424,876 | 41%         | L     |
| Slack (Salesforce) | Senior  | $229,966 | $54,625  | $30,041 | $314,632 | 17%         | L     |
| Stripe             | L3      | $225,555 | $183,700 | $29,181 | $438,436 | 42%         | T     |
| Apple              | ICT4    | $219,483 | $121,333 | $16,102 | $356,918 | 34%         | L     |
| Databricks         | L5      | $214,659 | $434,919 | $18,284 | $667,862 | 65%         | T     |
| Amazon             | SDE III | $210,046 | $170,319 | $0      | $380,365 | 45%         | L     |
| Microsoft          | 63      | $186,208 | $34,585  | $23,058 | $243,851 | 14%         | L     |

Market reference line: senior engineer $312,000 (Levels.fyi 2025 pay report).

**Badges:** **L** liquid public RSU, **T** private and tender-dependent, **O** options with a strike, which is what the user holds.

**Row footnotes.** Netflix pays one cash number by design and is the most liquid figure on the board. Slack is Salesforce stock on a legacy band, above Salesforce's own senior MTS. Amazon backloads vesting 5/15/40/40. Microsoft's 14% stock share makes its total far more robust than Databricks' 65%. **Cursor is excluded**: Levels.fyi has roughly one reported package for it.

**Geography.** These are US medians. The honest range is about -7% to +14%. The AI labs and Netflix are SF-weighted enough that their medians are effectively Bay numbers.

**Freshness (D2), corrected by research.** `company-comp.js` carries an `AS_OF` date, the plot renders it, and it warns on itself past six months.

**The correction:** the "Last updated" string on a Levels.fyi page is a **render artifact**. Every page fetched on 2026-09-04 printed "Last updated: September 4, 2026", which is the page-generation date, not a data vintage. Levels.fyi publishes neither the submission window nor the per-level sample size. So the refresh script must stamp `AS_OF` with its own **retrieval date** and the label must read "rolling, retrieved <date>". A script that trusted the page's own string would stamp today's date forever and the staleness banner would never fire, which is the exact silent-decay failure D2 exists to prevent. The sanity gate (D8) must assert that `AS_OF` is the retrieval date and not a parsed value.

## Failure modes

| Codepath                     | Realistic production failure                        | Test | Error handling                    | User sees                             |
| ---------------------------- | --------------------------------------------------- | ---- | --------------------------------- | ------------------------------------- |
| `computeAsk` band lookup     | No row for role x bucket x stage                    | yes  | yes, falls back                   | Ladder with a "band unavailable" note |
| `computeAsk` per-rung read   | Injected `computeRead` throws                       | yes  | yes, frozen fallback              | Ladder from default inputs            |
| Store hydration              | Malformed sessionStorage JSON from an older schema  | yes  | yes, reset to INITIAL             | Empty wizard, no crash                |
| `clear()`                    | Equity sync re-hydrates right after clearing        | yes  | yes, cleared tick                 | Answers stay cleared                  |
| Contact prefill (regression) | Store empty on a direct /contact/offer-review visit | yes  | yes                               | Empty template, as today              |
| Refresh script parse         | Levels.fyi redesigns, regex matches the wrong text  | yes  | yes, sanity gate refuses to write | Nothing; the old file stands          |
| Plot scenario layer          | Scenario valuation missing for the declared path    | yes  | yes, falls back to acquisition    | Bar renders at the fallback           |
| Plot for CTO / CEO seat      | Engineer comparators shown to an executive          | yes  | n/a                               | Plot withheld with an explanation     |

No critical gaps: every failure above has a test, error handling, and a visible outcome.

## Tests

| #   | Case                                                                        | Project |
| --- | --------------------------------------------------------------------------- | ------- |
| 1   | Rungs ordered: floor <= target <= ceiling on cash                           | node    |
| 2   | Ceiling equity < floor equity, because higher cash weakens the pay-cut case | node    |
| 3   | Each rung's equity equals a read computed at that rung's own cash (D10)     | node    |
| 4   | Floor and target never collapse to the same cash                            | node    |
| 5   | Bucket resolves from `read.classification.class`, not `joining` (D4)        | node    |
| 6   | Two identical conversions, different classes, give different cash bands     | node    |
| 7   | Industry multiplier moves cash, never equity                                | node    |
| 8   | Industry curves are role-keyed: AI favors engineer, fintech favors CTO      | node    |
| 9   | Geography multiplier applies and is labeled                                 | node    |
| 10  | "Other" industry and `us_hub` geo are exactly 1.00 and say so               | node    |
| 11  | Trade rate matches `EXCHANGE_RATES` at every stage                          | node    |
| 12  | Series B+ emits the poor-trade-rate warning                                 | node    |
| 13  | Every band, industry and geo row carries source, asOf, confidence           | node    |
| 14  | No salary entered: cash rungs still render                                  | node    |
| 15  | Shares-mode offer survives the store round trip (D15 #7)                    | node    |
| 16  | `computeAsk` never throws and never yields NaN on garbage input             | node    |
| 17  | Store field names match what `normalizeInputs` consumes (D15 #5)            | node    |
| 18  | `clear()` removes the key; a re-read returns defaults (D15 #9)              | node    |
| 19  | Refresh parser against a saved fixture (D8)                                 | node    |
| 20  | Refresh sanity gate refuses to write on a parse miss (D8)                   | node    |
| 21  | Cold start: two steps, gates and chips present, then the ladder             | jsdom   |
| 22  | Cold start reaches a non-pending classification (D16)                       | jsdom   |
| 23  | Prefilled arrival: ladder on mount, no wizard                               | jsdom   |
| 24  | "Clear my answers" empties both tools and returns to step 1                 | jsdom   |
| 25  | Number inputs commit on blur, not per keystroke (D9)                        | jsdom   |
| 26  | Plot: hover reveals the breakdown; every bar reachable by keyboard          | jsdom   |
| 27  | Plot: scenario change moves only the user's bar                             | jsdom   |
| 28  | Plot: data older than six months renders the staleness banner (D2)          | jsdom   |
| 29  | Plot withheld for CTO and CEO seats with an explanation (D11)               | jsdom   |
| 30  | Reduced motion: rungs and bars mount at rest                                | jsdom   |
| 31  | Print: ladder, citations and as-of line survive                             | jsdom   |
| 32  | **REGRESSION** contact prefill still fills every line via the store         | node    |
| 33  | **REGRESSION** plain /contact/offer-review visit stays empty                | jsdom   |

`vitest.config.mjs` UI project must also include `src/app/**/__tests__/**/*.test.jsx`, or tests beside the calculator never run (D15 #16).

## What already exists (reused, not rebuilt)

| Existing                                                    | Used for                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `computeRead()` and the whole equity engine                 | Band, adjustments, dilution, scenarios. Called per rung. |
| `dollarsToPts` over `EXCHANGE_RATES`                        | The trade rate, generated not hardcoded                  |
| `classify()`                                                | The cash band's bucket (D4)                              |
| `SCENARIO_VALUATIONS` and the dilution series               | The plot's scenario layer                                |
| `GapFigure`                                                 | Axis grammar, tokens, in-view motion, reduced motion     |
| `ChipGroup`, `SliderField`, `WizardShell`, `RailSummaryBar` | Wizard chrome, including the blur-commit convention      |
| `briefForContact()`                                         | Contact formatting, kept while its storage is removed    |
| `tools.js`, `steps.js`, `site-nav.js`                       | Registry-driven nav and the desk eyebrow row             |
| Print CSS and value-free analytics                          | The print sheet and funnel events                        |

## NOT in scope

- **A literal CTO comparator.** Verified negative: no CTO track on Levels.fyi, and CTOs are not named executive officers in proxies (checked Microsoft FY2025 and Netflix 2026). The CTO seat uses the engineering-leadership ladder, labeled as such.
- **CEO comparators for the plot.** No equivalent ladder exists; the plot is withheld for that seat rather than shown wrong.
- **Cursor / Anysphere.** One reported package on Levels.fyi is not a market.
- **Non-US markets and currency conversion.** Every band is USD, US.
- **Industry sub-verticals.** Crypto split from fintech, biotech from health tech: no defensible multiplier found.
- **Levels or ladders for engineers.** One senior seat; level-resolved startup data does not exist publicly.
- **Real quartiles for executives.** Gated behind a paid account. A derived spread ships, labeled.
- **Equity adjusted by industry.** Verified negative: no public grant-size benchmark by industry at a fixed stage.
- **Probability-weighted equity.** Requires the user to estimate their company's odds, which nobody does honestly.
- **Any change to `computeRead`'s outputs.** It is consumed, never modified.

## Worktree parallelization

| Step                             | Modules touched                                        | Depends on |
| -------------------------------- | ------------------------------------------------------ | ---------- |
| T0 land existing work            | whole tree                                             | —          |
| T1 salary + industry + geo data  | `src/lib/founders/equity/`                             | T0         |
| T2 company data + refresh script | `src/lib/founders/equity/`, `scripts/`                 | T0         |
| T3 `computeAsk`                  | `src/lib/founders/equity/`                             | T1         |
| T4 store + storage merge         | `src/lib/founders/`, `src/app/(site)/contact/`         | T0         |
| T5 wizard + ladder UI            | `src/app/(site)/founders/`, `src/components/founders/` | T3, T4     |
| T6 market plot                   | `src/components/founders/`                             | T2, T3     |
| T7 copy, registry, CTAs          | `src/lib/founders/`, `src/app/(site)/founders/`        | T5         |

```
Lane A: T1 -> T3 (sequential, shared equity/)
Lane B: T2 (independent until T6)
Lane C: T4 (independent, touches contact/ alone)
Then:   T5 (needs A + C)  ||  T6 (needs A + B)
Then:   T7
```

Launch A, B and C in parallel worktrees. **Conflict flag:** lanes A and B both write into `src/lib/founders/equity/` but to different new files; keep them separate and the merge is clean. T5 and T6 both touch `src/components/founders/`, again in different files.

## Implementation Tasks

Synthesized from this review's findings. Each derives from a specific finding.

- [ ] **T0 (P1, human: ~1h / CC: ~15min)** — repo — Land the existing founders work in gitmoji-grouped commits before anything new starts
  - Surfaced by: Outside voice 17 — `git ls-files src/components/founders src/lib/founders` returns zero files
  - Files: the whole working tree
  - Verify: `git status` clean; `pnpm test` green on the committed tree
- [ ] **T1 (P1, human: ~1.5 days / CC: ~1h)** — engine data — Encode `SALARY_BANDS[role][bucket][stage]`, `INDUSTRY[key][role]`, `GEO[key]` with per-row provenance
  - Surfaced by: Outside voice 12 — declared shapes cannot express D4 or the seniority curves
  - Files: `src/lib/founders/equity/salary-bands.js`
  - Verify: test 13
- [ ] **T2 (P1, human: ~1 day / CC: ~40min)** — data pipeline — Company comp file plus the refresh script, fixture test and sanity gate
  - Surfaced by: Architecture 1, Tests 1, Outside voice 14
  - Files: `src/lib/founders/equity/company-comp.js`, `scripts/refresh-company-comp.mjs`
  - Verify: tests 19, 20; run the script against a corrupted fixture and confirm it refuses
- [ ] **T3 (P1, human: ~1.5 days / CC: ~1h)** — engine — `computeAsk` with per-rung recomputation
  - Surfaced by: Outside voice 2 — rung pairs computed from different salary assumptions
  - Files: `src/lib/founders/equity/negotiation.js`
  - Verify: tests 1-16
- [ ] **T4 (P1, human: ~1 day / CC: ~40min)** — state — Zustand store with engine-matching field names; storage removed from `handoff.js`; contact form reads the store
  - Surfaced by: Code quality 1, Outside voice 5, 7, 9, 15
  - Files: `src/lib/founders/offer-store.js`, `handoff.js`, `ContactForm.jsx`, `handoff.test.js`
  - Verify: tests 15, 17, 18, 32, 33
- [ ] **T5 (P1, human: ~2 days / CC: ~1.5h)** — UI — Two-step wizard with gates and chips, ladder, blur-commit inputs
  - Surfaced by: Outside voice 4, classify.js:58, Performance 1
  - Files: `src/app/(site)/founders/job-offer/`, `src/components/founders/ladder/`
  - Verify: tests 21-25, 30, 31
- [ ] **T6 (P1, human: ~1.5 days / CC: ~1h)** — UI — Market plot on the desk's figure grammar, scenario layer, badges, staleness banner
  - Surfaced by: Code quality 2, Outside voice 10, 11
  - Files: `src/components/founders/market-plot.jsx`
  - Note: carries two ladders, IC for engineer and leadership for CTO, plus the Netflix special case and thin-n markers
  - Verify: tests 26-29d
- [ ] **T7 (P2, human: ~4h / CC: ~20min)** — copy + registry — Privacy copy on both pages, registry entry, both CTAs
  - Surfaced by: Architecture 2, open question O1
  - Files: `tools.js`, `founders/page.jsx`, `founders/equity/page.jsx`, `verdict.jsx`
  - Verify: registry test asserts every live tool has a route
- [ ] **T8 (P2, human: ~30min / CC: ~5min)** — config — Widen the vitest UI project to discover `src/app/**/__tests__/`
  - Surfaced by: Outside voice 16 — `vitest.config.mjs:18`
  - Files: `vitest.config.mjs`
  - Verify: a test placed under `src/app/` runs

## Wireframes

`~/.gstack/projects/HeavenlyEntity-my-next-spotlight/designs/joboffer-20260903/`

- `joboffer-wireframe.png` — the ladder. Its embedded plot is **superseded** by D11.
- `joboffer-plot-v2.png` — the stacked-bar plot. Its user-equity segment is **superseded** by D11's scenario layer.

Both predate D10 and D11, so treat the layout as current and the numbers as illustrative.

## Open question

- **O1 Registry slot.** Does this absorb the "Salary / equity" coming-soon entry, take a new slot, or do the pair get renamed as two reads? Cosmetic, decidable at T7.

## GSTACK REVIEW REPORT

| Review        | Trigger               | Why                             | Runs | Status       | Findings                                       |
| ------------- | --------------------- | ------------------------------- | ---- | ------------ | ---------------------------------------------- |
| CEO Review    | `/plan-ceo-review`    | Scope & strategy                | 0    | —            | —                                              |
| Codex Review  | `/codex review`       | Independent 2nd opinion         | 1    | issues_found | 17 findings, 17 folded                         |
| Eng Review    | `/plan-eng-review`    | Architecture & tests (required) | 1    | clean        | 25 issues, 0 critical gaps                     |
| Design Review | `/plan-design-review` | UI/UX gaps                      | 1    | clean        | score 6/10 → 9/10, 15 decisions (sibling plan) |
| DX Review     | `/plan-devex-review`  | Developer experience gaps       | 0    | —            | —                                              |

**CODEX:** 17 findings, all folded. The load-bearing one: the ladder's rungs paired an equity range derived from the user's current salary with a recommended p75 salary, which was incoherent and collapsed the floor into the target. Also caught the plot's undrawable equity segment, store field names that would silently default every non-CTO seat, a `clear()` that wrote defaults instead of clearing, test paths that would never be discovered, and an entirely untracked baseline.

**CROSS-MODEL:** Three tensions, all resolved in the outside voice's favour after verification against source. Ladder math (`adjustments.js:52` confirmed the band derives from `offeredSalary`). Plot units (a percentage has no dollar length without an assumed exit; my own wireframe drew one anyway). Adjustment priority (geography moves cash more than industry, so adding industry alone raised total error). No tension was resolved against the outside voice.

**DESIGN REVIEW NOTE:** The clean design review on record is for `docs/plans/founders-desk-equity-calculator.md`, not this plan. This plan's UI has not had a design pass. `/plan-design-review` is recommended before T5.

**VERDICT:** ENG CLEARED — ready to implement, blocked on T0 (land the existing untracked work first).

NO UNRESOLVED DECISIONS
