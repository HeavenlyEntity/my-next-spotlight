'use client'

/* A number input that commits on blur or Enter, never per keystroke.
 *
 * Two reasons, and the second is the important one. Per-keystroke writes churn
 * sessionStorage, which is only a performance nuisance. But they also put
 * half-typed values into shared state: typing "180000" briefly means 1, 18,
 * 180. On a page about someone's salary, a reload at the wrong moment would
 * bring back $18. Design review DD9.
 *
 * `key={value}` remounts the input when the value changes from outside, so a
 * cleared store actually clears the field.
 */

const inputClass =
  'border-[var(--amw-line-strong)] bg-[var(--amw-card)] focus:border-[var(--amw-accent)] focus:ring-[var(--amw-accent)]/20 amw-mono w-full rounded-md border px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-4'

export function NumberField({
  id,
  label,
  value,
  onCommit,
  hint,
  prefix,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        {prefix && (
          <span className="amw-mono text-sm text-zinc-500">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          key={value ?? 'empty'}
          defaultValue={value ?? ''}
          placeholder={placeholder}
          onBlur={(event) =>
            onCommit(
              event.target.value === '' ? null : Number(event.target.value)
            )
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={inputClass}
        />
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {hint}
        </p>
      )}
    </div>
  )
}
