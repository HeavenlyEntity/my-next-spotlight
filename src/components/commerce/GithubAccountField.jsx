'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import {
  checkGithubUsername,
  usernameMessage,
  GITHUB_USERNAME_MAX,
} from '@/lib/commerce/githubUsername'

/* The one field in the purchase where a typo costs money. A wrong username is
   not a failed delivery -- the repository invitation goes to a stranger, and if
   they accept it they have the boilerplate. So the account is looked up and
   shown before payment, and the buyer says yes it is mine.

   The lookup runs here, in the browser, deliberately. Unauthenticated GitHub
   allows 60 requests an hour per IP: from the browser that is 60 per visitor,
   which nobody reaches, while from the server it would be 60 an hour shared
   across every customer and would fail under the lightest traffic.

   It fails open. GitHub being unreachable, rate-limited or slow says nothing
   about whether the username is right, and blocking a sale on our own
   dependency would be the worse mistake. Only a 404 -- GitHub stating the
   account does not exist -- stops the purchase, and the server re-checks the
   same way because nothing here can be trusted. */

const DEBOUNCE_MS = 450

export function GithubAccountField({ serverError, inputRef, onGateChange }) {
  const [value, setValue] = useState('')
  /* One result object carrying the login it describes, rather than a status
     flag sequenced through effects. Status is then derived: if the stored
     result is for the text currently in the box we know the answer, and if it
     is not we are still waiting. That keeps every setState inside the async
     callback, where it belongs, instead of firing synchronously during an
     effect and cascading renders. */
  const [result, setResult] = useState(null)
  const [confirmedFor, setConfirmedFor] = useState(null)

  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const confirmId = `${fieldId}-confirm`
  const localRef = useRef(null)
  const ref = inputRef || localRef

  const login = value.trim()
  const formatProblem = value ? checkGithubUsername(value) : null
  const formatError = formatProblem ? usernameMessage(formatProblem) : null
  // A server error outranks a client one: it is the newer verdict.
  const shownError =
    serverError || (formatProblem !== 'empty' ? formatError : null)

  const current = result && result.forLogin === login ? result : null
  const status = formatProblem ? 'idle' : current ? current.status : 'checking'
  const profile = current?.profile ?? null
  /* Confirmation is tied to the account it was given for, so changing the
     username withdraws it without an effect having to reset anything. */
  const confirmed = Boolean(profile) && confirmedFor === profile.login

  useEffect(() => {
    if (checkGithubUsername(login)) return undefined

    let cancelled = false
    const timer = setTimeout(async () => {
      const settle = (next) => {
        if (!cancelled) setResult({ forLogin: login, ...next })
      }
      try {
        const res = await fetch(
          `https://api.github.com/users/${encodeURIComponent(login)}`,
          { headers: { Accept: 'application/vnd.github+json' } }
        )
        if (res.status === 404)
          return settle({ status: 'missing', profile: null })
        if (!res.ok) return settle({ status: 'unknown', profile: null })
        const data = await res.json()
        settle({
          status: 'found',
          profile: {
            login: data.login,
            name: data.name,
            avatar: data.avatar_url,
            url: data.html_url,
            isOrg: data.type === 'Organization',
          },
        })
      } catch {
        settle({ status: 'unknown', profile: null })
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [login])

  /* The button this gates lives in the parent, so the gate is reported upward
     rather than inferred there. Only a resolved account gates: if the lookup
     never answered, the purchase is not held hostage to our dependency. */
  const blocked = status === 'found' && !confirmed
  useEffect(() => {
    onGateChange?.(blocked)
  }, [blocked, onGateChange])

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        GitHub username (for repo access)
      </label>

      <input
        ref={ref}
        id={fieldId}
        type="text"
        name="githubUsername"
        required
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={GITHUB_USERNAME_MAX}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="your-github-username"
        aria-invalid={shownError || status === 'missing' ? 'true' : undefined}
        aria-describedby={shownError || status === 'missing' ? errorId : hintId}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:outline-hidden focus:ring-4 dark:bg-zinc-700/[0.15] dark:text-zinc-200 ${
          shownError || status === 'missing'
            ? 'border-red-600 focus:border-red-600 focus:ring-red-600/10 dark:border-red-500'
            : 'border-zinc-900/10 focus:border-teal-500 focus:ring-teal-500/10 dark:border-zinc-700'
        }`}
      />

      <p id={hintId} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Letters, numbers and single hyphens. This is where the repository
        invitation is sent.
      </p>

      {(shownError || status === 'missing') && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-sm text-red-700 dark:text-red-400"
        >
          {shownError ||
            `GitHub has no account called “${value.trim()}”. Check the spelling.`}
        </p>
      )}

      {/* Announced politely rather than assertively: the buyer is still typing
          and a live interruption on every keystroke would be hostile. */}
      <div aria-live="polite">
        {status === 'checking' && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Checking GitHub…
          </p>
        )}

        {status === 'unknown' && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Could not reach GitHub to confirm this account. You can still
            continue — the username will be checked again at checkout.
          </p>
        )}

        {status === 'found' && profile && (
          <div className="mt-3 rounded-md border border-zinc-900/10 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <Image
                src={profile.avatar}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {profile.name || profile.login}
                </p>
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-zinc-600 underline dark:text-zinc-400"
                >
                  @{profile.login}
                </a>
              </div>
            </div>

            {profile.isOrg && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                That is an organisation, not a person. Repository invitations go
                to user accounts — use your own username.
              </p>
            )}

            <label
              htmlFor={confirmId}
              className="mt-3 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <input
                id={confirmId}
                type="checkbox"
                checked={confirmed}
                onChange={(e) =>
                  setConfirmedFor(e.target.checked ? profile.login : null)
                }
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>This is my GitHub account.</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
