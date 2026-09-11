import React from 'react'

/*
 * Backtick spans inside a PLAIN TEXT field.
 *
 * The rich text editor has a code button and stores formatting properly, so
 * a description needs none of this. But a feature bullet is a `text` field --
 * there is no editor and no formatting to store, so `pnpm dev` typed into one
 * arrives here as six literal characters and renders as six literal
 * characters. Someone writing technical copy reasonably expects otherwise.
 *
 * This is the whole convention: single backticks, inline code, nothing else.
 * It is not a markdown parser and should not grow into one -- a field that
 * needs bold and links wants to be rich text instead.
 */

const SPAN = /`([^`\n]+)`/g

export function inlineCode(text) {
  if (typeof text !== 'string' || !text.includes('`')) return text

  const out = []
  let last = 0
  let match

  SPAN.lastIndex = 0
  while ((match = SPAN.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index))
    out.push(
      <code
        key={`${match.index}-${match[1]}`}
        className="amw-mono rounded bg-zinc-900/[0.06] px-1 py-0.5 text-[0.9em] dark:bg-zinc-100/10"
      >
        {match[1]}
      </code>
    )
    last = match.index + match[0].length
  }

  /* An unpaired backtick stays literal rather than swallowing the rest of the
     line. Half a convention is worse than none: the author sees the stray
     character and fixes it, instead of wondering where their sentence went. */
  if (last < text.length) out.push(text.slice(last))

  return out
}
