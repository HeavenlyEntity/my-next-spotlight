# Customer transaction journey UX plan

Date: September 10, 2026
Status: Ready for implementation. This plan does not implement anything.

## Outcome

The two paths a customer can take to give AMWARE money work end to end, tell
them what is happening at every step, and let them recover from their own
mistakes without emailing for help.

Path A is self-serve: a digital product or boilerplate, bought in one sitting.
Path B is an engagement: an intro call, then a deposit.

Scope is the journey's UX. It is not the GitHub invite or licence key build
(unbuilt, planned separately), and not the glyph interlude.

## The journey as it stands

Traced through the code on 2026-09-10.

| #   | Step                                 | Surface                                 | State                                                                |
| --- | ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------- |
| 1   | See the price                        | `pricing.jsx`, `/products`              | Works                                                                |
| 2   | Open the product                     | `/products/[slug]`                      | Works                                                                |
| 3   | Enter GitHub username (boilerplates) | `BuyButton.jsx`                         | No validation, no format help                                        |
| 4   | Submit                               | `createCheckout` server action          | **Throws on every failure**                                          |
| 5   | Pay                                  | Creem hosted page                       | Works. Email is collected here, not by us                            |
| 6   | Return                               | `/checkout/success`, `/checkout/cancel` | Static. Knows nothing about the order                                |
| 7   | Receive                              | Access-link or boilerplate email        | Works for guides. Boilerplate email promises an invite nothing sends |
| 8   | Open                                 | `/access/[token]`                       | Works                                                                |
| 9   | Recover                              | `/access/resend`                        | Works, but the only field has no label                               |

Path B (engagement) is not connected at all: the CTA reads "Book an intro
call" and links to `/services`, there is no Cal.com booking, and no deposit
product exists in Creem.

## Findings, worst first

Severities are from the skill's UX dataset, not invented here.

### F1 — A correctable mistake destroys the session (High)

`createCheckout` throws for every failure, including two the buyer can fix
themselves: a missing GitHub username, and an item not yet purchasable. A
thrown server action hits the Next error boundary, so the buyer gets a generic
error page, loses the page they were on, and is given no way back.

Dataset: _Error Placement_ (High) — each invalid field needs an inline error
connected to that field. _Error Recovery_ (Medium) — provide clear next steps.

Fix: `createCheckout` returns a typed result instead of throwing for
user-correctable cases. `BuyButton` renders the message beside the field it
belongs to, wired with `aria-describedby` and announced with `role="alert"`.
Genuine server faults keep throwing — those are not the buyer's to fix.

### F2 — The GitHub username is unvalidated and unconfirmed (High)

It is a free-text box with a placeholder and no rules. GitHub usernames are
1–39 characters of alphanumerics and single hyphens. A typo is accepted,
charged for, and only discovered when an invite fails to arrive — at which
point the buyer has no way to correct it and no idea anything is wrong.

Fix: `pattern` plus `maxLength` on the input for browser-native validation,
a visible hint naming the format, and a confirmation step showing the exact
username before payment. Post-purchase, the success page shows the username
used and offers a correction route. This is the single field in the whole
journey where a typo costs real money.

### F3 — The success page knows nothing about the purchase (Medium)

It is a static sentence: "Check your email for your access link (or your
repository invitation for boilerplates)." It does not know which was bought,
so it describes both and commits to neither. It does not name the address the
email went to, which is the one fact a buyer needs when nothing arrives —
and the address was typed at Creem, not here, so a typo there is invisible.

Dataset: _Confirmation Messages_ (Medium) — confirm completed actions.

Fix: read the Creem `request_id` from the return URL, look the purchase up,
and state what was bought, which email it went to, and what happens next.
Keep a generic fallback for when the lookup fails; never block the page on it.

### F4 — Cancel is a dead end (Medium)

"No charge was made. Browse products." It drops the buyer at the catalogue
rather than back at the thing they nearly bought, and does not acknowledge
that abandoning was reasonable.

Fix: return them to the product, keep the GitHub username they already typed,
and say plainly that nothing was charged.

Dataset: _Redundant Entry_ (Medium, WCAG 2.2 A) — do not make people retype
what they already gave you in the same process.

### F5 — The resend field has no label (High)

`/access/resend` has a single `type="email"` input with a placeholder and no
`<label>`. Placeholder-only labelling is the dataset's _Input Labels_ failure:
the accessible name disappears the moment the field has content.

Fix: a real `<label>`, plus `autoComplete="email"` so a browser can fill it —
this is the recovery path, reached by someone already frustrated.

### F6 — No feedback after resend (Medium)

The form submits and nothing visibly changes. There is no success state, no
failure state, and no live region, so a screen reader user gets nothing.

Dataset: _Submit Feedback_ (Medium), _Error Messages_ (High) — errors must be
announced via `role="alert"` or a live region.

Fix: return a result and render it in an `aria-live="polite"` region. The copy
must not leak whether an email exists in the database; "if that address has a
purchase, a link is on its way" is both safer and honest.

### F7 — The boilerplate email promises what nothing delivers (High)

`sendBoilerplateConfirmationEmail` says an invitation will arrive "shortly".
No code sends one. It cannot fire today because no boilerplate product exists,
but it fires for the first buyer of the $249 boilerplate.

Fix: until the invite is built, the email must describe the real process —
that access is granted manually and when to expect it. A promise the system
cannot keep is worse than a slower promise it can.

### F8 — Path B does not exist (High)

The retainer CTA says "Book an intro call" and goes to `/services`. There is
no booking and no deposit product, so the most valuable journey on the site —
$3,000 to $12,000 a month — has no working path.

Fix: point the CTA at the real Cal.com link, and give the booking page a
short honest description of what the call is and what starting costs. Add
the $1,500 deposit as a Creem product once the API key has write scope.

## Cross-cutting requirements

- Every new interactive element: visible label, `aria-describedby` for hints
  and errors, `role="alert"` or a live region for anything announced.
- Every error states the cause and the recovery, not just the failure.
- No new colour-only signalling: an error is text plus an icon, never a red
  border alone.
- Contrast measured on painted pixels in both themes, not read off tokens.
- Touch targets stay at or above 44px on every control added or touched.
- Every page in the journey verified at 375px and desktop with no horizontal
  overflow.

## Implementation order

Ordered by damage prevented per unit of work.

1. **F1** — stop throwing on correctable errors. Everything else assumes a
   buyer who can still see the page.
2. **F2** — validate and confirm the GitHub username, before a boilerplate is
   ever published at $249.
3. **F7** — correct the email copy. One string, prevents a broken promise.
4. **F5, F6** — label the resend field and give it feedback. Small, and it is
   the path someone reaches when already frustrated.
5. **F3** — make the success page specific.
6. **F4** — make cancel return people where they were.
7. **F8** — wire the engagement path once the Cal.com URL and Creem write
   scope exist.

Items 1 to 6 are self-contained. Item 7 is blocked on two things outside the
codebase.

## Verification

- Unit: `createCheckout` returns rather than throws for each correctable case
  and still throws for genuine faults. GitHub username validation accepts
  valid handles including single hyphens and 39 characters, rejects leading
  and trailing hyphens, doubles and over-length.
- Browser: complete a real sandbox purchase through the ngrok tunnel and read
  the success page it produces. Submit the buy form with an empty and an
  invalid username and confirm the error appears beside the field, is
  announced, and does not lose the page. Submit the resend form and confirm
  the result is announced.
- Accessibility: keyboard-only pass through the whole journey. Confirm focus
  moves to the error on failed submit and is never obscured.
- Both themes, 375px and desktop, contrast measured on painted pixels.

## Open questions

1. **Should we collect the email before Creem?** Creem collects it, so a typo
   there is invisible to us and the buyer. Collecting it first lets the
   success page confirm it and the resend path match it, at the cost of one
   more field before payment.
2. **What happens when a GitHub username turns out to be wrong?** Self-serve
   correction needs an authenticated surface the buyer does not currently
   have. A "reply to this email" route may be the honest answer for now.
3. **Does the deposit get its own product page**, or is it a link sent after
   the call? A public $1,500 page invites people to pay before the call, which
   is the order we deliberately avoided.

Do not edit this plan during implementation; report scope conflicts separately.
