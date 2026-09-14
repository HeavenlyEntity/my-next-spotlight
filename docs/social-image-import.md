# Product social previews

The seven WareKit records use the optional **Social preview image** upload field in Payload. This does not replace `heroImage`, change draft/published state, or alter prices, checkout, or product content. A populated custom preview wins; otherwise known WareKit pages use their edition artwork. Other products retain their hero image or fall back to AMWare branding.

From the repository root, with the environment file supplied by the operator:

```sh
pnpm exec tsx --env-file=/absolute/path/to/.env.local scripts/import-product-social-images.ts
```

This default dry run fully decodes all seven 1200 × 630 PNGs before connecting, uses a read-only database session, and reports planned assignments, custom images to preserve, and missing products. It also reports if the schema step is needed. It does not initialize Payload or upload anything.

Before applying, run the reviewed `scripts/sql/product-social-images.sql` through an administrative PostgreSQL client. The idempotent SQL only adds the nullable `products.og_image_id` column, its media foreign key, and the index expected by Payload.

```sh
pnpm exec tsx --env-file=/absolute/path/to/.env.local scripts/import-product-social-images.ts --apply
```

Apply takes an advisory lock to prevent simultaneous imports, uploads through Payload's existing Media configuration and S3 storage, then atomically assigns only empty `og_image_id` fields. Filenames contain the complete SHA-256 content hash, so a rerun reuses an uploaded record after partial completion. Existing previews are preserved, including previews changed by an editor during import. Missing products are reported with a nonzero exit status and never created.

The isolated `scripts/product-social-import.config.mts` intentionally loads only Media with the application's existing S3 environment settings. It disables schema auto-push, database creation, automatic type generation, and provider logging. It avoids the full application's TypeScript/CommonJS loader incompatibility in administrative scripts. The command rejects `PAYLOAD_DROP_DATABASE=true` and has no schema-apply mode. The app's normal Payload configuration remains unchanged.

Apply requires `DATABASE_URI`, `PAYLOAD_SECRET`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Dry run only needs `DATABASE_URI`. Errors identify their stage without printing provider exceptions or secrets. An upload completed before a later failure is retained for a safe retry.
