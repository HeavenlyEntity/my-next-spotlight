'use client'

import { useState } from 'react'
import { createCheckout } from '@/lib/commerce/checkout'
import { Button } from '@/components/Button'

export function BuyButton({
  itemType,
  slug,
  isBoilerplate = false,
  label = 'Buy now',
}) {
  const [submitting, setSubmitting] = useState(false)
  return (
    <form
      action={createCheckout}
      onSubmit={() => setSubmitting(true)}
      className="mt-8"
    >
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="slug" value={slug} />
      {isBoilerplate && (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            GitHub username (for repo access)
          </span>
          <input
            type="text"
            name="githubUsername"
            required
            placeholder="your-github-username"
            className="w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200"
          />
        </label>
      )}
      <Button
        type="submit"
        disabled={submitting}
        className="disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Redirecting…' : label}
      </Button>
    </form>
  )
}
