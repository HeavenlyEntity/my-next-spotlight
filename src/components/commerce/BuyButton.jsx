'use client'

import { useFormStatus } from 'react-dom'
import { createCheckout } from '@/lib/commerce/checkout'
import { Button } from '@/components/Button'

function SubmitButton({ label }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Redirecting…' : label}
    </Button>
  )
}

export function BuyButton({
  itemType,
  slug,
  isBoilerplate = false,
  label = 'Buy now',
}) {
  return (
    <form action={createCheckout} className="mt-8">
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
      <SubmitButton label={label} />
    </form>
  )
}
