'use client'

import { useId, useRef } from 'react'
import { Check } from 'lucide-react'

/* Choice groups for the equity wizard, built on the amw chip vocabulary.
   - mode="single": a radiogroup (aria-checked, arrow keys move and select).
   - mode="multi":  toggle buttons (aria-pressed).
   - variant="segmented": the same single-select fused into one pill row.
   Selection is never colour alone: the selected chip carries a check glyph.
   Options: [{ id, label, description?, disabled? }]. */

const CHIP = 'amw-chip amw-chip--input text-zinc-800 dark:text-zinc-200'

export function ChipGroup({
  label,
  labelId,
  options,
  value,
  onChange,
  mode = 'single',
  variant = 'chips',
  className = '',
  describeSelected = false,
}) {
  const autoId = useId()
  const groupLabelId = labelId ?? `${autoId}-label`
  const refs = useRef([])
  const isSingle = mode === 'single'
  const selectedSet = isSingle
    ? new Set(value ? [value] : [])
    : new Set(value ?? [])

  function select(option) {
    if (option.disabled) return
    if (isSingle) {
      onChange(option.id)
      return
    }
    const next = new Set(selectedSet)
    if (next.has(option.id)) next.delete(option.id)
    else next.add(option.id)
    onChange(Array.from(next))
  }

  function onKeyDown(event, index) {
    if (!isSingle) return
    const enabled = options
      .map((option, i) => (option.disabled ? null : i))
      .filter((i) => i !== null)
    const position = enabled.indexOf(index)
    let target = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      target = enabled[(position + 1) % enabled.length]
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      target = enabled[(position - 1 + enabled.length) % enabled.length]
    } else if (event.key === 'Home') {
      target = enabled[0]
    } else if (event.key === 'End') {
      target = enabled[enabled.length - 1]
    }
    if (target === null) return
    event.preventDefault()
    refs.current[target]?.focus()
    onChange(options[target].id)
  }

  const selectedOption = isSingle
    ? options.find((option) => option.id === value)
    : null

  const anySelected = isSingle && Boolean(value)

  return (
    <div className={className}>
      {label && (
        <p id={groupLabelId} className="amw-kicker mb-2">
          {label}
        </p>
      )}
      <div
        role={isSingle ? 'radiogroup' : 'group'}
        aria-labelledby={label ? groupLabelId : undefined}
        className={
          variant === 'segmented' ? 'amw-segmented' : 'flex flex-wrap gap-2'
        }
      >
        {options.map((option, index) => {
          const selected = selectedSet.has(option.id)
          /* Roving tabindex: the selected radio is tabbable; with nothing
             selected the first enabled radio is. */
          const tabIndex = isSingle
            ? selected || (!anySelected && index === 0)
              ? 0
              : -1
            : 0
          return (
            <button
              key={option.id}
              ref={(node) => {
                refs.current[index] = node
              }}
              type="button"
              role={isSingle ? 'radio' : undefined}
              aria-checked={isSingle ? selected : undefined}
              aria-pressed={isSingle ? undefined : selected}
              aria-disabled={option.disabled || undefined}
              tabIndex={tabIndex}
              onClick={() => select(option)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`${CHIP} ${selected ? 'amw-chip--accent' : ''}`}
            >
              {selected && (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
      {describeSelected && selectedOption?.description && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {selectedOption.description}
        </p>
      )}
    </div>
  )
}
