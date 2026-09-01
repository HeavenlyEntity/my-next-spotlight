'use client'

import type { TextFieldClientProps } from 'payload'

import { FieldLabel, TextInput, useField, useForm } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type CreemProductFieldProps = {
  priceFieldPath: string
  currencyFieldPath?: string
  priceLabelFieldPath?: string
} & TextFieldClientProps

type CreemPriceResponse = {
  price?: number
  currency?: string
  priceLabel?: string
  error?: string
}

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export const CreemProductField: React.FC<CreemProductFieldProps> = ({
  field,
  path,
  readOnly,
  priceFieldPath,
  currencyFieldPath,
  priceLabelFieldPath,
}) => {
  const { label } = field
  const fieldPath = path || field.name

  const { value, setValue } = useField<string>({ path: fieldPath })
  const { dispatchFields } = useForm()

  const [sync, setSync] = useState<SyncState>({ status: 'idle' })

  // Resolve sibling field paths whether the field is top-level or nested.
  const siblingPath = useCallback(
    (name: string) =>
      fieldPath.includes('.')
        ? `${fieldPath.split('.').slice(0, -1).join('.')}.${name}`
        : name,
    [fieldPath]
  )

  // Only fetch when the editor actually changes the Creem ID — never for the
  // value the document loaded with — so an existing price is never clobbered.
  // `userEdited` flips on real input (including paste); Payload hydrates the
  // stored value without setting it, so the initial load is ignored regardless
  // of when the async value resolves.
  const userEdited = useRef(false)
  const lastFetched = useRef<string | null>(null)

  useEffect(() => {
    if (!userEdited.current) return

    const id = (value || '').trim()
    if (!id || id === lastFetched.current) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSync({ status: 'loading' })

      try {
        const res = await fetch(
          `/api/creem/product?product_id=${encodeURIComponent(id)}`,
          { credentials: 'include', signal: controller.signal }
        )
        const data: CreemPriceResponse = await res.json()

        if (!res.ok) {
          throw new Error(data.error || `Lookup failed (${res.status})`)
        }

        // Commit only after a confirmed success so a failed/aborted attempt
        // never suppresses a retry of the same ID.
        lastFetched.current = id

        if (typeof data.price === 'number') {
          dispatchFields({
            type: 'UPDATE',
            path: siblingPath(priceFieldPath),
            value: data.price,
          })
        }
        if (currencyFieldPath && data.currency) {
          dispatchFields({
            type: 'UPDATE',
            path: siblingPath(currencyFieldPath),
            value: data.currency.toUpperCase(),
          })
        }
        if (priceLabelFieldPath && data.priceLabel) {
          dispatchFields({
            type: 'UPDATE',
            path: siblingPath(priceLabelFieldPath),
            value: data.priceLabel,
          })
        }

        setSync({
          status: 'success',
          message:
            typeof data.price === 'number'
              ? `Synced price from Creem: $${data.price.toFixed(2)}${
                  data.currency ? ` ${data.currency.toUpperCase()}` : ''
                }`
              : 'Synced from Creem.',
        })
      } catch (err) {
        if (controller.signal.aborted) return
        setSync({
          status: 'error',
          message: err instanceof Error ? err.message : 'Creem lookup failed',
        })
      }
    }, 700)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [
    value,
    dispatchFields,
    siblingPath,
    priceFieldPath,
    currencyFieldPath,
    priceLabelFieldPath,
  ])

  return (
    <div className="field-type text">
      <FieldLabel htmlFor={`field-${fieldPath}`} label={label} />
      <TextInput
        value={value}
        onChange={(val: unknown) => {
          userEdited.current = true
          setValue(val as string)
        }}
        path={fieldPath}
        readOnly={readOnly}
        placeholder="prod_…"
      />
      {sync.status === 'loading' && (
        <p style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
          Fetching price from Creem…
        </p>
      )}
      {sync.status === 'success' && (
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: 'var(--theme-success-500, #15803d)',
          }}
        >
          {sync.message}
        </p>
      )}
      {sync.status === 'error' && (
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: 'var(--theme-error-500, #b91c1c)',
          }}
        >
          {sync.message}
        </p>
      )}
    </div>
  )
}
