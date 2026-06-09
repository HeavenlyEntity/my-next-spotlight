// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleLayout } from '@/components/SimpleLayout'
import { Button } from '@/components/Button'

const fieldClasses =
  'min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] text-zinc-800 shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  )
}

export default function ContactForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      subject: form.get('subject'),
      message: form.get('message'),
    }

    try {
      const res = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Submission failed')
      router.push('/thank-you')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <SimpleLayout
      title="Get in touch"
      intro="Have a question, proposal, or just want to say hello? Fill out the form below and I'll get back to you."
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-3xl p-6 ring-1 ring-zinc-200 dark:ring-zinc-700 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Name">
            <input
              type="text"
              name="name"
              required
              autoComplete="name"
              placeholder="Your name"
              className={fieldClasses + ' w-full'}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={fieldClasses + ' w-full'}
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field label="Subject">
            <input
              type="text"
              name="subject"
              placeholder="What's this about?"
              className={fieldClasses + ' w-full'}
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field label="Message">
            <textarea
              name="message"
              required
              rows={6}
              placeholder="Tell me a little about it…"
              className={fieldClasses + ' w-full resize-y'}
            />
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </Button>
        </div>
      </form>
    </SimpleLayout>
  )
}
