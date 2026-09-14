# Product social images and portrait release

Approved scope: connect the seven WareKit social images to editable Payload media relationships; publish the approved social preview collection and metadata on main; add Alec's existing portrait to Home and About. Preserve current main's kit-sales hold and unrelated work.

Base: `origin/main` at `9d8ef43`. Implementation worktree: `codex/amware-og-cms`. The older `codex/warekit-delivery` branch contains unrelated release work and is not being merged wholesale. Only approved social-image work is being carried forward.

## Tasks

| Task                          | State    | Success criterion                                                                  |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------- |
| Portrait covers               | Complete | Home/About use the existing face image; no headline or face clipping               |
| Port social metadata          | Complete | All 24 assets and existing metadata preserved on latest main                       |
| Editable product field        | Complete | Payload Product has optional Social preview image; populated upload wins           |
| Import and schema preparation | Complete | Explicit apply, repeatable, no replacement of custom images or publication changes |
| Review and local verification | Complete | Focused tests, lint, formatting, types and independent review pass                 |
| CMS assignment                | Complete | Seven uploaded assets assigned and fetched back; second run changes nothing        |
| Main push                     | Complete | Normal fast-forward push; remote SHA verified                                      |

## Baseline CMS evidence

Read-only query found all seven WareKit product slugs, all drafts. The separately published Switch Clone guide has an existing hero image. Product and Media identifiers are integers; Products does not yet have an `og_image_id` column. No product content or database schema was modified during this inventory.

The unrelated guide must retain relevant imagery, not inherit a NetSuite kit headline. Existing custom social images should always win over the generated defaults. CMS uploads must not alter price, status, hero image or checkout settings.

## Completed verification

The reviewed additive schema was applied. Media IDs 4–10 were uploaded through Payload and linked to all seven existing kit products. A second apply reported all seven already assigned. Full-row hashes, excluding only `og_image_id`, remained identical for all eight products. All seven public media URLs returned byte-identical PNGs. See `cms-assignment-report.json`.

44 focused tests passed, alongside changed-file ESLint, formatting, TypeScript, independent review and the production webpack build (all 38 static pages generated). New generated Payload types required three runtime-neutral type corrections. The build also exposed the existing RSS legacy-renderer incompatibility; the reviewed streaming-renderer fix preserves feed content and passed the final build.

The importer uses a dedicated Media/S3 configuration, two database connections, explicit schema safeguards, redacted logging and explicit exit after awaited completion/output flushing. Initial runtime-loading and connection-pool failures occurred before any product assignments; the corrected command completed and passed the repeat-run check.

## Main publication

Implementation commit `c0b20485e1b1f6500a9b8b7533b5ef268970db5b` was pushed normally to `origin/main`, and the remote branch SHA was read back and matched. All tasks above are complete. Hosted deployment and social-platform cache refresh are separate from the verified Git push.
