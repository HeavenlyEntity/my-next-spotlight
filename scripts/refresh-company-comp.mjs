#!/usr/bin/env node
/*
 * Refresh the named-company figures the market comparison plot draws.
 *
 * Usage:
 *   node scripts/refresh-company-comp.mjs --dry-run     inspect, write nothing
 *   node scripts/refresh-company-comp.mjs               refresh and write
 *   node scripts/refresh-company-comp.mjs --from <dir>  parse saved page text
 *
 * WHAT THIS PROTECTS AGAINST. Not the loud failure. If Levels.fyi redesigns and
 * the parser throws, somebody notices in the first minute. The expensive
 * failure is a regex that still matches, picks up the wrong number, and writes
 * it into the data file with today's date stamped on it. The gate in
 * company-comp-parse.js exists for that case, and this script refuses to write
 * anything unless every single row passes it. A partial write would leave the
 * file internally inconsistent while looking freshly updated, which is worse
 * than not refreshing at all.
 *
 * IT ONLY EVER TOUCHES company-comp-figures.js. Every note, level name and
 * liquidity kind is curated in company-comp.js and cannot be clobbered here.
 *
 * THE DATE COMES FROM THE CLOCK. Levels.fyi prints today's date in its own
 * "Last updated" field because that is the page-generation timestamp, so it
 * would stamp today forever and the staleness banner would never fire.
 */

import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import {
  asOfStamp,
  gate,
  parseLevelsPage,
} from '../src/lib/founders/equity/company-comp-parse.js'
import { FIGURES } from '../src/lib/founders/equity/company-comp-figures.js'

const run = promisify(execFile)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const TARGET = path.join(
  ROOT,
  'src/lib/founders/equity/company-comp-figures.js'
)

const BROWSE = path.join(
  process.env.HOME ?? '',
  '.claude/skills/gstack/browse/dist/browse'
)

const L = 'https://www.levels.fyi/companies'
const swe = (slug, level) =>
  `${L}/${slug}/salaries/software-engineer/levels/${level}`
const mgr = (slug, level) =>
  `${L}/${slug}/salaries/software-engineering-manager/levels/${level}/locations/united-states`

/* Which page each row comes from. Row ids match company-comp.js exactly; a
   mismatch is caught before anything is fetched. */
const SOURCES = {
  ic: {
    netflix: swe('netflix', 'l5'),
    openai: swe('openai', 'l4'),
    anthropic: `${L}/anthropic/salaries/software-engineer/levels/senior-software-engineer`,
    databricks: swe('databricks', 'l5'),
    stripe: swe('stripe', 'l3'),
    google: swe('google', 'l5'),
    meta: swe('facebook', 'e5'),
    amazon: swe('amazon', 'sde-ii'),
    apple: swe('apple', 'ict4'),
    slack: `${L}/slack/salaries/software-engineer/levels/senior-software-engineer`,
    microsoft: swe('microsoft', 'senior-sde'),
  },
  leadership: {
    apple: mgr('apple', 'd1'),
    meta: mgr('facebook', 'd1'),
    google: mgr('google', 'l8'),
    amazon: mgr('amazon', 'director'),
    netflix: `${L}/netflix/salaries/software-engineering-manager`,
    databricks: mgr('databricks', 'm5'),
    salesforce: mgr('salesforce', 'senior-director'),
    microsoft: mgr('microsoft', 'senior-director'),
  },
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fromDir = args.includes('--from')
  ? args[args.indexOf('--from') + 1]
  : null

const log = (...a) => console.log(...a)
const fail = (msg) => {
  console.error(`\n  REFUSED: ${msg}\n`)
  process.exit(1)
}

/** Page text for one row, from disk or from the browser. */
async function fetchText(ladder, id, url) {
  if (fromDir) {
    const file = path.join(fromDir, `${ladder}-${id}.txt`)
    if (!existsSync(file))
      return { text: null, why: `no saved page at ${file}` }
    return { text: readFileSync(file, 'utf8') }
  }
  if (!existsSync(BROWSE)) {
    return {
      text: null,
      why: `the gstack browse binary is not at ${BROWSE}. This is a local maintenance script; run it on a machine that has it, or pass --from <dir> with saved page text.`,
    }
  }
  try {
    await run(BROWSE, ['goto', url], { timeout: 60_000 })
    /* Levels.fyi renders its figures client-side; the page needs a moment. */
    await new Promise((r) => setTimeout(r, 4500))
    const { stdout } = await run(BROWSE, ['text'], {
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    })
    return { text: stdout }
  } catch (error) {
    return { text: null, why: `fetch failed: ${error.message}` }
  }
}

function checkIdsMatch() {
  const problems = []
  for (const [ladder, rows] of Object.entries(SOURCES)) {
    const known = Object.keys(FIGURES[ladder] ?? {})
    for (const id of Object.keys(rows)) {
      if (!known.includes(id))
        problems.push(`${ladder}.${id} has a URL but no row`)
    }
    for (const id of known) {
      if (!rows[id]) problems.push(`${ladder}.${id} has a row but no URL`)
    }
  }
  if (problems.length)
    fail(`source map and data file disagree:\n  - ${problems.join('\n  - ')}`)
}

function render(figures) {
  const block = (ladder) =>
    Object.entries(figures[ladder])
      .map(
        ([id, f]) =>
          `    ${id}: { base: ${f.base}, stock: ${f.stock}, bonus: ${f.bonus} },`
      )
      .join('\n')

  return `/*
 * GENERATED FILE — do not hand-edit.
 *
 * Written by \`scripts/refresh-company-comp.mjs\`. Only the numbers and the
 * retrieval date live here; every note, level name and liquidity kind is
 * curated in company-comp.js and survives a refresh untouched. Splitting them
 * is what makes the refresh safe to run: it can never clobber prose.
 *
 * \`asOf\` is the RETRIEVAL date. Levels.fyi's own "Last updated" field prints
 * the page-generation timestamp, so trusting it would stamp today forever.
 */

export const FIGURES = {
  asOf: '${figures.asOf}',
  ic: {
${block('ic')}
  },
  leadership: {
${block('leadership')}
  },
}
`
}

async function main() {
  checkIdsMatch()
  log(`\n  Refreshing company figures${dryRun ? ' (dry run)' : ''}`)
  log(`  Source: Levels.fyi. Attribution is required wherever these appear.\n`)

  const next = { asOf: asOfStamp(), ic: {}, leadership: {} }
  const rows = []
  const unreachable = []

  for (const [ladder, entries] of Object.entries(SOURCES)) {
    for (const [id, url] of Object.entries(entries)) {
      const { text, why } = await fetchText(ladder, id, url)
      if (!text) {
        unreachable.push(`${ladder}.${id}: ${why}`)
        continue
      }
      const parsed = parseLevelsPage(text)
      const prev = FIGURES[ladder][id]
      /* checkRow compares against `previous.total`, and the stored rows carry
         only the three components. Without this the drift check would silently
         never fire, which is the exact class of quiet failure this script is
         supposed to prevent. */
      const previous = { ...prev, total: prev.base + prev.stock + prev.bonus }
      rows.push({ id: `${ladder}.${id}`, parsed, previous })
      if (parsed.ok) {
        next[ladder][id] = {
          base: parsed.base,
          stock: parsed.stock,
          bonus: parsed.bonus,
        }
        const before = previous.total
        const drift = ((parsed.total - before) / before) * 100
        log(
          `  ${(ladder + '.' + id).padEnd(24)} $${parsed.total
            .toLocaleString()
            .padStart(10)}  ${drift >= 0 ? '+' : ''}${drift.toFixed(1)}%`
        )
      } else {
        log(`  ${(ladder + '.' + id).padEnd(24)} PARSE FAILED`)
      }
    }
  }

  if (unreachable.length) {
    fail(
      `could not reach every page, and a partial refresh would stamp a fresh date on stale rows:\n  - ${unreachable.join(
        '\n  - '
      )}`
    )
  }

  const verdict = gate(rows)
  if (!verdict.ok) {
    const detail = verdict.failures
      .map((f) => `${f.id}\n      ${f.problems.join('\n      ')}`)
      .join('\n  - ')
    fail(
      `the sanity gate rejected ${verdict.failures.length} row(s):\n  - ${detail}`
    )
  }

  log(`\n  All ${rows.length} rows passed the gate. As of ${next.asOf}.`)
  if (dryRun) {
    log('  Dry run: nothing written.\n')
    return
  }
  writeFileSync(TARGET, render(next), 'utf8')
  log(`  Wrote ${path.relative(ROOT, TARGET)}\n`)
  log('  Now run: npx prettier --write on that file, then pnpm test.\n')
}

main().catch((error) => fail(error.message))
