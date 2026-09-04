import { fmtMoney, fmtPct } from '@/components/founders/format'

/*
 * The second half of the desk, shown rather than described.
 *
 * WHY THIS IS HERE AT ALL. The landing's anchor used to be the gap figure
 * alone, which is the equity calculator's output. With two live tools that
 * showed half the desk and left the reader to take the cash half on trust. The
 * two figures together say what the desk does without a paragraph claiming it:
 * this is the gap, and this is what you ask for because of it.
 *
 * ROWS, NEVER CARDS, AND NO FILL. Same rules as the real ladder next door
 * (DESIGN.md: cards earn their existence; the accent is budgeted). The middle
 * rung is dominant by weight, never by a teal fill that would read as
 * "selected" and quietly recommend an ask to someone who has not used the tool
 * yet.
 *
 * AT REST. The landing's motion budget is three and it is already spent: the
 * heading fades up, the gap figure's marker springs into the band, the CTA
 * chevron slides on hover. A fourth thing moving would make the page busy on
 * the one screen that has to feel calm.
 *
 * SERVER-RENDERED, ON PURPOSE. The rows are computed in the page from
 * `computeAsk(EXAMPLE_READ)` and passed down as plain data, so the landing
 * never ships `negotiation.js` or the salary bands to the browser and the
 * figures can never disagree with the tool they advertise.
 */

export function ExampleLadder({ rungs, note, dominantId = 'target' }) {
  if (!rungs?.length) return null

  return (
    <figure className="m-0 max-w-2xl">
      <figcaption className="amw-kicker mb-4">
        The same example, priced as an ask
      </figcaption>
      <div className="border-[var(--amw-line)] border-t">
        {rungs.map((rung) => {
          const dominant = rung.id === dominantId
          const ink = dominant
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-600 dark:text-zinc-400'
          return (
            <div
              key={rung.id}
              className="border-[var(--amw-line)] grid grid-cols-[minmax(0,1fr)_5rem_4rem] items-baseline gap-x-4 border-b py-3 sm:grid-cols-[minmax(0,1fr)_7rem_5rem] sm:gap-x-6"
            >
              <span className={`amw-kicker ${dominant ? ink : ''}`}>
                {rung.label}
              </span>
              <span
                className={`amw-price text-right text-base tabular-nums sm:text-lg ${ink} ${
                  dominant ? 'font-medium' : ''
                }`}
              >
                {fmtMoney(rung.cash)}
              </span>
              <span
                className={`amw-price text-right text-base tabular-nums sm:text-lg ${ink} ${
                  dominant ? 'font-medium' : ''
                }`}
              >
                {fmtPct(rung.equityPct)}
              </span>
            </div>
          )
        })}
      </div>
      {note && (
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {note}
        </p>
      )}
    </figure>
  )
}
