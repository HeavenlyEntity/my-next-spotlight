# TODOS

## Founders' Desk

### Move founder benchmarks into a Payload global

**What:** A `FounderBenchmarks` Payload global mirroring the desk's four benchmark datasets, read at build time with the JS files as fallback: `benchmarks.js` (team pools, equity bands, dilution, leaver terms), `salary-bands.js` (cash bands by role/bucket/stage, industry multipliers by role, geography multipliers), and `company-comp.js` (eleven companies' base/stock/bonus for the comparison plot). Every row keeps `source` / `asOf` / `confidence`.

**Why:** Carta, Ravio, and Index publish yearly. Today a refresh is a code change and a deploy; the admin already exists.

**Context:** v1 ships the versioned JS files on purpose (design doc Open Question 1; equity eng review D13). The job offer calculator's eng review (2026-09-04) quadrupled the scope: three more datasets, and the company figures decay quarterly rather than yearly, so the trigger arrives much sooner than the original "first yearly refresh". Decision D2 of that review ships `scripts/refresh-company-comp.mjs` first, which covers the fastest-decaying dataset without a CMS. That makes this global a convenience rather than a rescue, but it is now a bigger job than the entry originally implied. Keep the row shapes from the JS files as the field schema so file and global never diverge; delete the files once the global is the source of truth.

**Effort:** L (was M, before three datasets were added)
**Priority:** P3
**Depends on:** Founders' Desk v1 shipped; job offer calculator shipped; benchmark row shapes stable.

### Source the engineer and CEO-builder benchmark rows

**What:** Replace the `confidence: 'inferred'` rows for `engineer` (founding engineer, hired, hire) and `ceo_builder` in `benchmarks.js` with figures from Carta engineer grant data, Pave, or Index's engineer tables, and flip them to `sourced`.

**Why:** With per-row provenance, those rows print "inferred" inline on the results page. A founding engineer who sees that trusts the tool less than a CTO does.

**Context:** Design doc Open Question 3; eng review D14. Data change only, no code. The CTO wedge launches without it.

**Effort:** S
**Priority:** P2
**Depends on:** Provenance row shape (`source`, `asOf`, `confidence`) landed.

### Buy a compensation data account for real executive quartiles

**What:** Get a Carta Total Comp, Pave, or Ravio account and replace the `interpolated` p25/p75 rows for the `cto` and `ceo_builder` seats in `salary-bands.js` with real percentiles, flipping them to `sourced`.

**Why:** The ask ladder's ceiling and floor rungs for executives rest on a spread derived from the CEO seat's published range and applied across seats. The tool prints "interpolated" next to them, which is honest but weak on a page whose pitch is that every number is checkable. The engineer seat has better data than the executive seats, and the executive seats are the desk's core audience.

**Pros:** turns two of the three rungs from derived to sourced for the seats the desk is aimed at.
**Cons:** a paid account, usually sold as an annual seat for what is a periodic need; the figures still need re-encoding by hand on each refresh.

**Context:** Four research passes on 2026-09-04 established this as a verified negative, not a gap. Kruze Consulting publishes real payroll by stage but averages only, and says so. Carta returns 403 to automated fetching, Ravio returns 429, and Pave's VCECS executive dataset is partner-only with no public figures. Levels.fyi is the only free source with true percentiles and has no startup-stage CTO cut. Index Ventures' Rewarding Talent salary tables are 2018 data and must not be used. This was option B of decision D2 in the job offer calculator eng review, deferred in favour of shipping a labeled spread.

**Effort:** S once an account exists (data change only, no code)
**Priority:** P2
**Depends on:** a budget decision. Nothing technical.

### PDF attachment on the contact form for the printed brief

**What:** A PDF-only file input on `ContactForm.jsx`, stored via the existing Media collection and linked from `ContactSubmissions`.

**Why:** v1 asks the founder to paste numbers into a message template; attaching the brief they already printed is less friction and gives the full read with the lead.

**Context:** Design doc and eng review D11/D15 kept v1 to subject + template + "Copy brief as text". Revisit after the first ten offer-review leads show whether pasting is enough. Needs size limits, a spam story, a `ContactSubmissions` schema change and migration, and confirmation that unauthenticated Media uploads are acceptable.

**Effort:** M
**Priority:** P3
**Depends on:** Founders' Desk v1 CTA shipped; Media upload path for unauthenticated users confirmed.

## Completed
