# AMWARE design system (amw)

Transcribed from `src/styles/storefront.css` and the landing template grammar on 2026-09-03. This file is the calibration reference for design reviews and new surfaces. When the CSS changes, change this file in the same commit.

## Tokens

All tokens live on `.amw` and only resolve inside it. Anything portaled out of the page (Radix Select, Dialog, Sheet, Tooltip) must carry `className="amw"` itself.

| Token                                                  | Light                  | Dark                    | Use                                                           |
| ------------------------------------------------------ | ---------------------- | ----------------------- | ------------------------------------------------------------- |
| `--amw-accent`                                         | `#14bbac`              | `#3ce8ce`               | the one accent: primary CTA fill, selected states, band fills |
| `--amw-accent-ink`                                     | `#0d857a`              | `#5eead4`               | accent as text or 1px edges                                   |
| `--amw-accent-soft`                                    | `rgba(20,187,172,.12)` | `rgba(60,232,206,.12)`  | selected chip / segment background, figure band fill          |
| `--amw-line`                                           | `rgba(24,24,27,.10)`   | `rgba(255,255,255,.10)` | hairlines, card borders, disclosures                          |
| `--amw-line-strong`                                    | `rgba(24,24,27,.16)`   | `rgba(255,255,255,.18)` | input borders, secondary buttons                              |
| `--amw-grid`                                           | `rgba(24,24,27,.045)`  | `rgba(255,255,255,.05)` | background grids                                              |
| `--amw-card`                                           | `#ffffff`              | `#0b0b0f`               | raised surfaces: rail, inputs, link cards                     |
| `--amw-card-2`                                         | `#fafafa`              | `#101015`               | chip background                                               |
| `--amw-muted`                                          | `#f4f4f5`              | dark card-2 family      | soft section panels (the template's `rounded-2xl` panels)     |
| `--amw-page`                                           | `#ffffff`              | dark                    | the page surface                                              |
| `--amw-ink`                                            | `#18181b`              | light                   | text and the offer marker                                     |
| `--amw-mut`                                            | `#71717a`              | zinc-400 family         | muted text                                                    |
| `--amw-paper`, `--amw-paper-edge`, `--amw-paper-light` | warm stock             | dark stock              | the About story cards only                                    |
| `--amw-mono`                                           | `var(--font-nav-code)` | same                    | kickers, eyebrows, numbers                                    |

Teal budget: selected controls, the primary CTA of a page, figure bands and their edges, one live status dot. Nowhere else. Body text and headings stay zinc.

## Type

- Display: **Layer** (`style={{ fontFamily: 'Layer, sans-serif' }}`), bold, `tracking-tight`. Page h1 `text-3xl md:text-4xl lg:text-5xl`; hero h1 `text-5xl md:text-8xl tracking-tighter`; section h2 `text-3xl md:text-4xl lg:text-5xl`; verdict numbers `text-5xl md:text-6xl` tabular.
- Body: the site sans (Geist), `text-base leading-relaxed`, zinc-600 (dark zinc-400) for copy, zinc-900 (dark zinc-100) for headings and labels.
- Step questions and card titles: `text-2xl md:text-3xl font-medium tracking-tight`.
- Labels `text-sm font-medium text-zinc-800`; hints `text-xs text-zinc-500` (verify ≥ 4.5:1 on muted panels in dark).
- Mono: `.amw-mono`; `.amw-eyebrow` for `// SEC.XX / LABEL` section eyebrows via `<SectionEyebrow index label />`; `.amw-kicker` for small uppercase tracked labels (`0.18em`). All numbers in mono, tabular.
- Never `system-ui` as a display face; Layer for display, Geist for body, mono for annotation. Three faces max.

## Spacing, radius, layout

- Container `max-w-6xl`, horizontal padding `px-6`; sections `py-16 md:py-24` (`md:py-32` for hero-scale sections).
- Stacks `space-y-6`; form fields `gap-4`; card grids `gap-6`.
- Panels `bg-[var(--amw-muted)] rounded-2xl p-6 md:p-8`; raised cards `bg-[var(--amw-card)] border border-[var(--amw-line)] rounded-2xl p-5`; inputs `rounded-md`; chips and segments `rounded-full`; buttons `rounded-md` that become `rounded-[50px]` on hover.
- Two-column tools: `lg:grid-cols-[minmax(0,1fr)_20rem] gap-8`; single column below `lg`.
- Media flush inside cards, `object-contain`, overlays clipped by the card border.

## Components (vocabulary)

- **Primary action**: `bg-zinc-900 text-white` (dark inverted) or the page's one teal CTA `bg-[var(--amw-accent)] text-zinc-950`; `rounded-md py-3 pl-5 pr-3 font-medium transition-all duration-500 hover:rounded-[50px]`; trailing white circle with a lucide `ChevronRight` that scales on hover.
- **Secondary action**: `border border-[var(--amw-line-strong)] bg-[var(--amw-card)] rounded-md text-sm`.
- **Inputs**: `border-[var(--amw-line-strong)] bg-[var(--amw-card)] rounded-md px-3.5 py-3` with `focus:ring-4 focus:ring-[var(--amw-accent)]/20`; visible labels above; hints below with `aria-describedby`.
- **Chips**: `.amw-chip` is a display tag (12px). Inputs use `.amw-chip--input` (min-height 44px, `text-sm`, `px-4`); selected = `.amw-chip--accent` plus a leading check glyph. Single-select groups are `role="radiogroup"` with arrow keys; multi-select uses `aria-pressed`. Segmented controls are the same component, `variant="segmented"`.
- **Select / Sheet / Slider**: shadcn on the `radix-ui` umbrella, `amw`-scoped (`src/components/ui/select.jsx` is the pattern).
- **Cards**: only when the card is the interaction (project cards with `BorderGlow`, link cards with the chevron circle). Never card grids as layout; never icon-in-circle feature triplets.
- **Catalog cards** (`src/components/commerce/catalog-cards.jsx`): the template's three card shapes on amw tokens. Product = split feature card (`bg-[var(--amw-muted)] rounded-2xl p-2`, copy left, cover right in a `--amw-card` frame, `object-contain`). Course = step card (soft surface, title pinned to the bottom). Service = plan card (`--amw-card` with a hairline, big "from" price, rich-text lists rendered as check marks). One stretched link per card from the title; the chevron pill is decorative. Reveal: fadeInUp with a capped index stagger; hover: scale 1.01 or y -4; both off under reduced motion.
- **Figures**: thin 1px axes in `--amw-line-strong`, band fills `--amw-accent-soft` with `--amw-accent-ink` edges, markers in `--amw-ink`, mono labels. Scale and whitespace carry hierarchy, not shadows.
- **Eyebrows**: every section opens with `<SectionEyebrow index="NN" label="…" />`.

## Motion

- Entrance: fadeInUp `{ opacity: 0, y: 30 } → { opacity: 1, y: 0 }`, `0.6–0.8s`, ease `[0.16, 1, 0.3, 1]`, `whileInView` once at `amount: 0.3`; staggered siblings by `0.1s`.
- Hover: chevron circle `scale-110`; buttons round to a pill over `0.5s`.
- Numbers: values that arrive count up (`CountUp`, React Bits port at `src/components/react-bits/count-up.jsx`, spring, in-view once); values that change live blur-slide per digit (`AnimateDigits`, 21st port at `src/components/founders/animate-digits.jsx`). Never both on the same number. Static numbers stay static.
- Scroll-linked motion only where it carries meaning (story stack, marker entering a band). Two to three intentional motions per page.
- `motion` from `motion/react`, client components only. Every motion has a reduced-motion path: render the resting state, no entrance.

## Do / don't

- Do lead every page with one composition: eyebrow, Layer headline, one sentence, one action.
- Do use utility language on tool screens; product language on landing pages.
- Do keep numbers in mono and tabular.
- Don't use purple gradients, blobs, wavy dividers, emoji as icons, colored left borders, centered-everything, uniform bubbly radii, or three-column icon grids.
- Don't rely on hover to reveal actions; don't convey selection by color alone.
- Don't use placeholder text as the only label.

## Verification on this repo

Never run `pnpm build` while the dev server is on. Verify with per-file `next lint`, prettier, `pnpm test`, and the Vercel preview deployment.
