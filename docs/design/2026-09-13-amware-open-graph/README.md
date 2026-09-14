# AMWare Open Graph collection

24 finished PNGs at 1200 × 630: 17 public page covers and seven WareKit edition covers. Open `index.html` for the responsive review gallery, or `contact-sheet.png` for the full collection. Each gallery image links to its production PNG.

## Design

The existing AMWare crown anchors the identity. Inter matches the site typography. Deep green-black, warm paper and a restrained mint accent create light and dark compositions within one family. Home and About feature Alec’s existing smiling blue-suit portrait, placed in full against the mint disc. The remaining artwork is deliberately graphic: brand seals, system steps, editorial folios, decision diagrams and layered kit covers. Illustrations are conceptual, not screenshots or claims about included functionality. Headlines, the portrait on Home/About and the crown remain recognizable at feed size.

React Pro and React Team are marked planned; WareKit commerce is marked in development. The images contain no price, performance guarantee, licensing saving, availability CTA or invented customer evidence. Release labels reflect the inspected edition definitions, not a live CMS readiness query. Regenerate those covers when the release status changes.

## Coverage and metadata

- Public home, About, Story, Services, Speaking, Uses, Courses, Blog, Articles, Founders, Equity, Job Offer, Contact, Offer Review, Projects, Products and Pricing each use their own image.
- Product metadata uses the editable Payload Social preview image first. Seven known kit editions use their edition image as a fallback. Other products use their existing hero image, then the neutral Home cover.
- CMS blog posts use their populated `ogImage` upload first; otherwise they use the Blog cover. Existing MDX `og_image` overrides take priority over the Articles cover. Courses use the Courses cover.
- Social titles, descriptions and canonicals are preserved. Both Open Graph and Twitter large-image metadata use the selected artwork.
- Checkout, token access, admin, subscription acknowledgement and machine routes have not been modified. This collection contains no customer-specific information.

The source catalog is `src/lib/social/og-catalog.json`. To revise artwork copy or the family treatment, update the catalog or generator and run:

```sh
node scripts/generate-amware-og.mjs
```

The generator writes all PNGs, the gallery, contact sheet and asset size report. It works offline using bundled fonts, the existing crown and the original portrait; it needs neither CMS access nor a running application. New page keys also need registration in `src/lib/social/metadata.ts` and the page metadata. The optional Product `ogImage` upload field makes each product preview editable in Payload. The administrative importer and reviewed additive SQL attach the seven kit images without changing their draft status. Automatic per-article headline rendering is outside this change. See `cms-release.md` for the CMS assignment and main push record.

## Asset provenance

- Portrait on Home and About: existing `src/images/portrait-bg-removed.png`; original face and cutout retained, resized proportionally with contain fitting. No generated likeness or face crop.
- Crown: existing `src/images/logos/amware-crown-mark.webp`; original shape retained.
- Inter Regular and Bold: pinned `@fontsource/inter@5.2.8` Latin WOFF files, stored in `public/fonts/Inter/`. SIL Open Font License included in that directory. [Fontsource Inter](https://fontsource.org/fonts/inter/install).
- All layouts and geometric illustrations: authored in `scripts/generate-amware-og.mjs`, rendered using the project's existing Next ImageResponse and Sharp dependencies. No new runtime dependency or remote font request.
- Metadata integration follows the [Next.js metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

## Task tracking and verification

- Complete: page and brand audit, 24 cover designs, generation and visual inspection at full and contact-sheet sizes.
- Complete: Open Graph/Twitter metadata integration, CMS/MDX override preservation and 44 focused social-image and seat checks.
- Complete: gallery verification at 390px and 1440px; all 24 image URLs decode to 1200 × 630 with no horizontal overflow. See `gallery-check.json`.
- Complete: changed-code formatting, ESLint and TypeScript checks.
- Complete: independent code and artwork review; approved with no actionable findings. The original 24-cover review approved the initial collection. The Home/About portrait revision is documented below. Review covered source metadata and generated artwork, not deployed social crawlers.
- Verified: CMS uploads and live media delivery. Main publication is recorded in `cms-release.md`; live social-platform recrawls are not part of this verification. The focused release is prepared in `codex/amware-og-cms` from current main, retaining the kit-sales hold and Whop Pixel. The original review copy also remains in `codex/warekit-delivery`. See `cms-release.md` for final publication status.

The existing Speaking page contains inherited marketing copy whose factual claims were not verified in this task. Its new artwork uses neutral topic wording and introduces no such claims.

## Home and About portrait revision

- Replaced the large crown seal only on Home and About with the existing real portrait. Kept the small crown header, Inter typography, palette, copy and title positions.
- Visually inspected both 1200 × 630 covers and 320 × 168 thumbnails (`portrait-thumbnails.png`): full face and original cutout remain visible, with no headline overlap.
- Regenerated the 24-cover gallery, contact sheet and asset report. SHA-256 comparison confirmed only `home.png` and `about.png` changed; the other 22 PNGs remain byte-identical.
- Verified the updated gallery at 390px and 1440px: no horizontal overflow; all 24 images decoded at 1200 × 630. ESLint, Prettier and TypeScript checks passed.
- Largest regenerated PNG: 251,709 bytes.
