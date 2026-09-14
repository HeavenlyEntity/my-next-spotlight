import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import catalog from '../src/lib/social/og-catalog.json'
import {
  prepareProductImageAssets,
  importProductImages,
} from '../src/lib/social/importProductImages.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let stage = 'argument validation'
async function run() {
  const args = process.argv.slice(2)
  if (
    args.some((arg) => arg !== '--apply' && arg !== '--dry-run') ||
    (args.includes('--apply') && args.includes('--dry-run'))
  ) {
    throw new Error('Use --dry-run (default) or --apply')
  }
  const apply = args.includes('--apply')
  stage = 'asset validation (all seven 1200 × 630 PNGs must exist)'
  const assets = await prepareProductImageAssets(
    path.join(root, 'public/images/og/amware'),
    catalog
  )
  if (assets.length !== 7)
    throw new Error('Expected exactly seven product images')
  console.log(
    `Validated ${assets.length} product previews. Mode: ${
      apply ? 'APPLY' : 'DRY RUN'
    }.`
  )
  stage = 'environment validation (PAYLOAD_DROP_DATABASE must not be true)'
  if (process.env.PAYLOAD_DROP_DATABASE === 'true')
    throw new Error('Destructive database option is forbidden')
  const required = apply
    ? [
        'DATABASE_URI',
        'PAYLOAD_SECRET',
        'S3_BUCKET',
        'S3_ENDPOINT',
        'S3_REGION',
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
      ]
    : ['DATABASE_URI']
  if (required.some((name) => !process.env[name]))
    throw new Error('Required configuration is missing')
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URI,
    options: apply ? undefined : '-c default_transaction_read_only=on',
  })
  let payload:
    | Awaited<ReturnType<typeof import('payload')['getPayload']>>
    | undefined
  try {
    stage = 'database connection'
    await client.connect()
    if (apply) {
      const lock = await client.query(
        'SELECT pg_try_advisory_lock(20260913, 630) AS acquired'
      )
      if (!lock.rows[0].acquired)
        throw new Error('Another social image import is active')
    }
    stage =
      'schema inspection (apply scripts/sql/product-social-images.sql before --apply)'
    const schema = await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'og_image_id' AND data_type = 'integer'"
    )
    const hasColumn = schema.rowCount === 1
    if (!hasColumn) {
      console.log('Schema required: scripts/sql/product-social-images.sql')
      if (apply) throw new Error('Missing schema')
    }
    const store = {
      async findProduct(slug: string) {
        const { rows } = await client.query(
          `SELECT id, slug, ${
            hasColumn ? 'og_image_id' : 'NULL::integer'
          } AS "ogImage" FROM public.products WHERE slug = $1`,
          [slug]
        )
        if (rows.length > 1) throw new Error('Duplicate product slug')
        return rows[0]
      },
      async findMedia(filename: string) {
        const { rows } = await client.query(
          'SELECT id, filename FROM public.media WHERE filename = $1',
          [filename]
        )
        if (rows.length > 1) throw new Error('Duplicate media filename')
        return rows[0]
      },
      async upload(asset: { title: string; filename: string; data: Buffer }) {
        stage = 'Payload module loading'
        if (!apply) throw new Error('Writes require --apply')
        if (!payload) {
          console.log('Loading the isolated Payload media configuration.')
          const [{ getPayload }, { default: config }] = await Promise.all([
            import('payload'),
            import('./product-social-import.config.mjs'),
          ])
          // Dedicated config fixes push:false and has no startup migrations.
          stage = 'Payload initialization'
          console.log('Initializing Payload media access.')
          payload = await getPayload({ config })
          console.log('Payload media access ready.')
        }
        stage = 'Payload media upload'
        console.log(`Uploading ${asset.filename}.`)
        const media = await payload.create({
          collection: 'media',
          data: { alt: asset.title },
          file: {
            data: asset.data,
            name: asset.filename,
            mimetype: 'image/png',
            size: asset.data.length,
          },
          overrideAccess: true,
        })
        console.log(`Media upload complete: ${media.id}.`)
        return media
      },
      async assignIfEmpty(id: number, mediaID: number) {
        stage = 'atomic social preview assignment'
        if (!apply) throw new Error('Writes require --apply')
        const result = await client.query(
          'UPDATE public.products SET og_image_id = $1 WHERE id = $2 AND og_image_id IS NULL RETURNING id',
          [mediaID, id]
        )
        return result.rowCount === 1
      },
    }
    stage = 'product and media preflight'
    const result = await importProductImages({ store, assets, apply })
    for (const item of result) console.log(JSON.stringify(item))
    if (result.some((item) => item.action === 'missing-product'))
      process.exitCode = 1
  } finally {
    if (payload) await payload.destroy()
    await client.end()
  }
}

async function finish(code: number) {
  // Flush piped results before exiting; Payload retains its startup pool client.
  await Promise.all(
    [process.stdout, process.stderr].map(
      (stream) =>
        new Promise<void>((resolve) => stream.write('', () => resolve()))
    )
  )
  process.exit(code)
}

run()
  .then(() => finish(Number(process.exitCode ?? 0)))
  .catch(() => {
    // Provider errors can contain credentials or signed storage URLs. Keep them
    // out of output; stage identifies the failed operation for a safe rerun.
    console.error(
      `Social image import failed during ${stage}. No further work was applied; a rerun preserves existing previews and reuses completed uploads.`
    )
    return finish(1)
  })
