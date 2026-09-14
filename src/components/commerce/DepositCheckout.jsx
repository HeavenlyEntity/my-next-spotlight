'use client'

import { useState } from 'react'
import { WhopCheckoutEmbed } from '@whop/checkout/react'
import { Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { WHOP_EVENT, whopTrack } from '@/lib/analytics/whop'
import { usd } from '@/lib/commerce/money'

/* The deposit that starts an engagement, paid without leaving the page.
   Whop's checkout mounts in a side sheet from the service's plan id; there
   is no server call first, because the plan is the product and the payment
   webhook finds the service again by that same id.

   PIXEL. Opening the sheet is reported as begin_checkout. The sale is NOT
   reported as purchase: Whop processes it and reports it to the ads
   platforms itself, and its pixel rejects the duplicate. See whop.ts.

   THEME. The embed is an iframe and cannot read the site's tokens, so it is
   told the mode and the accent when it opens. */

const ACCENT = '#14bbac'

function Received({ serviceName, amount, bookingUrl }) {
  return (
    <div role="status" className="mt-2">
      <span className="bg-[var(--amw-accent-soft)] text-[var(--amw-accent-ink)] inline-flex h-11 w-11 items-center justify-center rounded-full">
        <Check className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3
        style={{ fontFamily: 'Layer, sans-serif' }}
        className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        Deposit received.
      </h3>
      <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        {usd(amount)} for {serviceName}, credited in full against your first
        month. A receipt is on its way to your inbox, and I will be in touch
        within one business day.
      </p>
      {bookingUrl && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Not spoken yet?{' '}
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--amw-accent-ink)] underline underline-offset-4"
          >
            Book the intro call
          </a>
          .
        </p>
      )}
    </div>
  )
}

export function DepositCheckout({
  planId,
  serviceName,
  amount = 1500,
  bookingUrl,
  className,
  children,
}) {
  const [open, setOpen] = useState(false)
  const [received, setReceived] = useState(false)
  const [dark, setDark] = useState(false)
  const [origin, setOrigin] = useState('')

  /* Read at the moment of opening, from the click: the embed is an iframe
     that cannot see the page's theme, and the return URL must be absolute.
     Both are settled by then and neither belongs in an effect. */
  const onOpenChange = (next) => {
    if (next) {
      setDark(document.documentElement.classList.contains('dark'))
      setOrigin(window.location.origin)
    }
    setOpen(next)
    if (next && !received) {
      whopTrack(WHOP_EVENT.beginCheckout, {
        value: amount,
        currency: 'USD',
        content_type: 'deposit',
        content_id: planId,
        content_name: serviceName,
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={className}
      >
        {children}
      </button>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-6 sm:max-w-md"
        aria-describedby={undefined}
      >
        <SheetHeader className="p-0 pr-10">
          <SheetTitle
            style={{ fontFamily: 'Layer, sans-serif' }}
            className="text-2xl font-bold tracking-tight"
          >
            Reserve your start
          </SheetTitle>
          <SheetDescription>
            {usd(amount)} deposit for {serviceName}, credited in full against
            your first month.
          </SheetDescription>
        </SheetHeader>

        {received ? (
          <Received
            serviceName={serviceName}
            amount={amount}
            bookingUrl={bookingUrl}
          />
        ) : (
          origin && (
            <div className="mt-2 min-h-[28rem]">
              <WhopCheckoutEmbed
                planId={planId}
                theme={dark ? 'dark' : 'light'}
                themeOptions={{
                  accentColor: ACCENT,
                  borderRadius: 8,
                  buttonText: `Pay ${usd(amount)} deposit`,
                }}
                returnUrl={`${origin}/checkout/deposit`}
                skipRedirect
                onComplete={() => setReceived(true)}
                fallback={
                  <div
                    aria-busy="true"
                    className="bg-[var(--amw-muted)] h-96 animate-pulse rounded-lg"
                  />
                }
              />
            </div>
          )
        )}
      </SheetContent>
    </Sheet>
  )
}
