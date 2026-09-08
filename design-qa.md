# Masterpiece interlude — design QA

final result: pass (closed 2026-09-08)

## Scope and visual targets

Homepage-only dot matrix between the existing CTA and footer. Latest user correction: fill the central paper width, matching the site's responsive gutters, rather than the viewport width.

Source visual truth:

- `/Users/mipi-founder/.codex/generated_images/01a07898-2daa-77c2-a016-f7ad56468cbe/exec-ecbab4aa-4250-4ff8-8888-5604656eaff9.png` — approved Builder storyboard.
- `/Users/mipi-founder/.codex/generated_images/01a07898-2daa-77c2-a016-f7ad56468cbe/exec-f6ff700d-5c5a-47fe-bf17-dbc20bcc538a.png` — scene spanning the gap; width superseded by paper-width instruction.

The user approved a Canvas renderer and animated monochrome pixel figures. Original homepage CTA, branding and footer content take precedence over generated incidental text/layout changes.

## Browser evidence

Implementation URL: http://localhost:3000/

Earlier browser captures were displayed in the task at desktop 1280 × 720 and mobile 390 × 844. No standalone screenshot file was saved. Source boards and browser viewports differ, so no exact pixel-density-normalized comparison is claimed. Final combined source/implementation comparison remains pending.

Observed before the server stopped:

- All four scenes rendered in the browser.
- Raft waves span the scene; inactive dots fill the entire section.
- Dark mode uses white active dots; light mode uses black active dots.
- Refreshes selected different scenes, including raft, dreamer, painter and builder.
- Pause and resume worked.
- Paper-width adjustment measured 1152px wide at x=64 on a 1280px viewport, matching the existing paper gutters. The adjusted standby grid was visually observed.

## Findings and fixes

- Mobile Builder thought bubble initially clipped its left border. Fixed by constraining bubble center to the available columns. Regression test now verifies both complete borders. Final post-fix mobile browser capture is pending.
- User requested paper-width alignment after the viewport-wide implementation. Added the same responsive wrapper as the site paper and changed light background to white. Follow-up code review found no issues.
- Final browser recheck failed with `net::ERR_CONNECTION_REFUSED` on port 3000. No server was started, per workspace instructions.

## Fidelity surfaces

- Typography: dedicated 5×7 dot lettering; thought copy matches the approved Builder story.
- Layout: fixed reserved section height with full paper-width grid; figure remains legible on mobile; original CTA and footer are preserved.
- Colors: white/light and zinc-900/dark backgrounds match the paper. Active dots reverse contrast with theme.
- Artwork: crowned figures, desk, monitor, easel, raft and airplane are animated on a shared snapped pixel lattice as approved in the implementation plan.
- Content: four refresh variants; Builder reads “What if…” / “One more detail.” / “There it is.” / “Worth the effort.” Finished monitor artwork persists during celebration.

## Completed checks

- ESLint passed for all changed JavaScript/JSX files.
- Prettier applied to changed files.
- TypeScript `--noEmit` passed.
- Eight focused tests passed, covering scene selection, phases, scene output, completed artwork persistence, bubble bounds, pause/offscreen cleanup, hidden-tab suspension and reduced motion.
- Required code-quality reviewer completed initial and follow-up reviews without blocking findings.
- `git diff --check` passed.

## Final visual pass (2026-09-08)

Run against the dev server on port 3000, which was down with `ERR_CONNECTION_REFUSED` when this report was first written. That was the only thing blocking it; every code gate had already passed.

- **Paper seams.** Measured, not eyeballed. At 1280px the section sits at x=64 with width 1152, which is exactly the paper's own x and width. At 768px it keeps the 32px `sm:px-8` gutters; at 390px it is full-bleed by design. Page overflow is 0 at all three widths.
- **Desktop scene.** Captured the dreamer variant at 1280x800 @2x. Speech bubble borders complete on all four sides, inactive dot field fills the section, active dots black on the light paper.
- **Mobile Builder bubble.** Captured at 390x844 @2x. The "WHAT IF..." bubble draws all four borders with the left edge clear of the section boundary, so the clipping this report recorded is confirmed fixed in the browser and not only in the regression test.
- **Console.** The only errors are `THREE.WebGLRenderer: A WebGL context could not be created` from the footer's 3D crown, which is the headless sandbox having no GPU. `CrownBoundary` catches it and renders the flat mark. Nothing from the interlude.

Reserved-height section, pause control and the `sr-only` description all render as described above. No further verification outstanding.
