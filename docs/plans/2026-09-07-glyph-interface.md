# Glyph interface implementation plan

Date: September 7, 2026
Status: Ready for implementation. This plan does not implement the feature.

## Outcome

A pixel-field panel on the homepage, in the gap between the call-to-action
section (`FinalCTA`, the last thing `HomeContent` renders) and the `Footer` that
the site layout renders under it. It reads as a Nothing Phone glyph
surface: a regular grid of cells with a clear inactive state and a lit active
state, animating a short scene.

Two scenes exist. One is chosen per page load, at random, on the client. Scene A
is a person on a raft on the ocean, relaxing, who then cheers to the reader.
Scene B is a person on the right of the field painting a picture on an easel, in
a room that reads as a foyer.

The panel is decorative. It carries no navigation, no link, and no information
the page states nowhere else.

## Prior art in this repo

There is no earlier glyph plan. Searched `docs/`, `TODOS.md`, `DESIGN.md`, all
branches via `git log --all`, the `product-page-designs` worktree, and the
`minimal` template: nothing describes a glyph or pixel interface for the
navigation or anywhere else.

The closest existing work, and the precedent this plan follows, is the machine
view's block-glyph wordmark (`.machine-glyph` in `src/styles/machine.css`,
markup in `src/app/(machine)/layout.jsx`). Two lessons carry over:

1. A character-cell face must own every glyph it draws. JetBrains Mono is served
   as a latin subset with no U+2500–U+259F, so block characters silently fell
   back to a different font at a different advance. **This panel must not be
   built from text glyphs.** It draws its own cells.
2. The AMWARE banner is `aria-hidden` with the accessible name on its anchor.
   The same split applies here.

The second precedent is `src/components/brand/amware-creed.jsx`: one `rAF` loop
writing directly to DOM refs, never through React state, gated on
`IntersectionObserver` and `prefers-reduced-motion`. The animation loop here
follows that shape.

## Rendering decision

**Canvas 2D, not a DOM grid and not SVG.**

The field is roughly 64×24 cells at desktop. As DOM nodes that is ~1,500
elements whose classes would change every frame; style recalculation at that
volume is the wrong trade for a decorative panel, and it puts 1,500 nodes into
the accessibility tree that all have to be hidden again. Canvas draws the same
field in one element.

The cost is that cells are painted, not styled, so the inactive and active
appearances live in JS constants rather than CSS. Accept that, and read the two
colours from CSS custom properties at draw time so the panel still answers to
the theme (see Visual specification).

## Scene model

Scenes are pure functions of time. No frame data is hand-authored as bitmaps.

Define in `src/lib/glyph/scenes.js`:

```
sceneRaft(grid, tMs) -> Set of lit cell indices
scenePainter(grid, tMs) -> Set of lit cell indices
```

Each takes the grid dimensions and elapsed milliseconds and returns which cells
are lit. Pure, deterministic, no DOM, no randomness inside the function. This is
the unit that gets tested.

Figures are small sprite matrices (a raft, a seated body, a raised arm, an
easel, a standing body) expressed as coordinate offsets and stamped onto the
field at a computed position. The ocean is a sine function of column and time.
The painter's canvas fills in stroke by stroke as a function of time.

Scene A beats: drift in on the swell (0–3s), rest (3–6s), the figure raises an
arm and holds it (6–7.5s), lowers it (7.5–8s), loop.

Scene B beats: figure at the easel on the right third, arm moves in short
strokes, painted area accumulates left-to-right until the picture is complete
(~8s), a beat of stillness, loop.

Both loop rather than play once. A one-shot animation that has already finished
before the reader scrolls to it is a panel showing nothing.

## Random selection without a hydration mismatch

The server cannot pick the scene. If it did, the client would pick a different
one and React would report a mismatch — the same failure already fixed once in
this codebase (`6fe1226`).

Use `useMounted()` from `src/hooks/use-client-value.js`. Render the field's
static frame on the server and during the hydrating render, then select the
scene and start the loop after mount. `Math.random()` is called only inside the
post-mount effect, never during render.

## Component structure

```
src/lib/glyph/
  scenes.js           pure scene functions and sprite data
  grid.js             grid sizing, cell geometry, index helpers
  __tests__/scenes.test.js
src/components/landing/glyph-field.jsx
                      client component: canvas, rAF loop, observers
```

The split is not stylistic. `vitest.config.mjs` scopes its `engine` project to
`src/lib/**/__tests__/**/*.test.js` and its `ui` project to
`src/components/**/__tests__/**/*.test.jsx` and `src/app/**`. Pure `.test.js`
files under `src/components/` match neither project and would never run — they
would not fail, they would silently not exist. The scene logic therefore lives
under `src/lib/`, which is also where this repo already keeps pure engine code
(`src/lib/founders/`).

`GlyphField` is placed in `src/app/(site)/HomeContent.jsx` immediately after
`<FinalCTA />`, as the last element of the page body. It takes no props.

## Behaviour requirements

- The `rAF` loop runs only while the panel intersects the viewport
  (`IntersectionObserver`) and only while the document is visible
  (`visibilitychange`). It is cancelled on unmount.
- Under `prefers-reduced-motion: reduce` the loop never starts. The panel paints
  one composed frame — for scene A the figure mid-cheer, for scene B the
  finished painting — so the reader sees a resolved image rather than an empty
  grid or a blank canvas.
- The canvas is `aria-hidden="true"`. A visually hidden sibling carries a
  sentence describing the chosen scene, so the panel is not silent to a screen
  reader. Reuse the `.sr-only` pattern already in the site layer.
- The canvas is backed by a device-pixel-ratio-aware backing store: set
  `width`/`height` to CSS size × `devicePixelRatio`, capped at 2, and scale the
  context. An unscaled canvas renders soft cells on every retina display.
- Resize is handled with a `ResizeObserver` that recomputes the grid and
  repaints. Column count is derived from available width so cells stay square.
- The panel never causes horizontal overflow at any width. This has bitten the
  homepage before (`b6147f2`).

## Visual specification

- Cells are circles, not squares. The Nothing glyph reads as dots.
- Grid: cell pitch 12px desktop, 9px below `md`. Column count is
  `floor(width / pitch)`; row count is fixed at 24 desktop, 16 below `md`, so the
  panel's height is predictable and the scenes have a known aspect.
- Inactive cell: the page's line token at low alpha — visible as texture, never
  as content. Active cell: the accent, at full strength, with no glow, no blur,
  no shadow. The lit state carries itself by contrast against the unlit field.
- Both colours are read from computed CSS custom properties at draw time
  (`--amw-line`, `--amw-accent`) so light and dark themes are correct without a
  second palette in JS.
- The panel sits inside the same `max-w-6xl` container as its neighbours, so it
  aligns with every section above it. Whether it carries a `SectionEyebrow` at
  all is open question 1; build it unlabelled and add the eyebrow only if that
  question is answered the other way.

## Verification

Tests (`src/lib/glyph/__tests__/scenes.test.js`, engine project — these are pure
functions and need no jsdom):

- Both scene functions are deterministic: the same `(grid, t)` returns the same
  set, called twice.
- Every returned index is within `0 <= i < cols * rows`. No scene ever lights a
  cell outside the field, at any `t` sampled across a full loop and at several
  grid sizes including the narrowest mobile grid.
- Scene A lights strictly more cells during its cheer window than during its
  rest window, which is the beat the animation exists to deliver.
- Scene B's painted region is monotonically non-decreasing across the stroke
  phase, so the picture never un-paints itself.
- Both loop: the set at `t` equals the set at `t + period`.

These sit at `src/lib/glyph/__tests__/scenes.test.js` so the `engine` project
picks them up, for the reason given under Component structure.

After implementation:

1. `npx eslint` on changed files.
2. `npx prettier --write` on changed files.
3. `npx tsc --noEmit`.
4. `npx vitest run` — full suite, not just the new file.
5. `pnpm build`.
6. In the browser on the running dev server: both scenes (force each by
   temporarily pinning the selection), light and dark themes, 375px and desktop,
   `prefers-reduced-motion` on, and a check that the page has no horizontal
   overflow at 375px.
7. Confirm the loop stops when the panel is scrolled out of view and when the
   tab is hidden — assert the rAF handle is null, do not assume it.

## Open questions

These are decisions for Alec, not assumptions to make silently:

1. **Section index and label.** SEC.06 is already taken by the FAQ (`FIELD
MANUAL`), so a labelled panel would be SEC.07. It can also render unlabelled
   as a full-bleed band with no eyebrow at all, which is the recommendation: an
   eyebrow makes a decorative panel look like it carries information.
2. **Height.** 24 rows at a 12px pitch is ~290px plus padding. Taller reads more
   like a display panel and costs more page.
3. **Interactivity.** The brief says the figure cheers _to the user_. That could
   stay on a timer, or fire on hover or on entering the viewport. Timer is the
   recommendation; hover on a decorative band is a discovery most readers never
   make.
4. **Scene rotation.** Random per load means a reader can see the same scene
   twice running. An alternating cookie or `sessionStorage` value guarantees a
   change, at the cost of storage the panel does not otherwise need.

## Implementation order

Grid geometry and helpers → scene functions and their tests → canvas renderer
with the loop and observers → placement on the homepage → theme, reduced motion
and responsive passes → browser verification.

Preserve unrelated current work. Do not edit this plan during implementation;
report any unavoidable scope conflict separately.
