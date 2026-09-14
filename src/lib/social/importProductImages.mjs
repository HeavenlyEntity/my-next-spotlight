import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'

/** Read and fully decode the entire input set before any CMS connection or write. */
export async function prepareProductImageAssets(directory, catalog) {
  const assets = []
  for (const item of catalog.filter((entry) =>
    entry.path.startsWith('/products/')
  )) {
    if (!/^[a-z0-9-]+$/.test(item.key)) throw new Error('Invalid artwork key')
    const basename = `${item.key}.png`
    let data
    try {
      data = await readFile(path.join(directory, basename))
      const image = sharp(data, { failOn: 'warning' })
      const metadata = await image.metadata()
      if (
        metadata.format !== 'png' ||
        metadata.width !== 1200 ||
        metadata.height !== 630 ||
        (metadata.pages ?? 1) !== 1
      ) {
        throw new Error('dimensions')
      }
      await image.raw().toBuffer()
    } catch {
      throw new Error(
        `Invalid or missing ${basename}: expected a complete 1200 × 630 PNG`
      )
    }
    const hash = createHash('sha256').update(data).digest('hex')
    assets.push({
      key: item.key,
      slug: item.path.slice('/products/'.length),
      title: item.title,
      filename: `amware-og-${item.key}-${hash}.png`,
      data,
    })
  }
  if (!assets.length) throw new Error('No product artwork in the catalog')
  return assets
}

/** Store I/O is injected so dry-run and retry behavior can be verified without a CMS. */
export async function importProductImages({ store, assets, apply = false }) {
  const plan = []
  // Finish all reads before uploading, so lookup failures cannot cause a partial import.
  for (const asset of assets) {
    const product = await store.findProduct(asset.slug)
    const media = product ? await store.findMedia(asset.filename) : undefined
    let action = !product
      ? 'missing-product'
      : product.ogImage != null
      ? media?.id === product.ogImage
        ? 'already-assigned'
        : 'preserved-custom'
      : media
      ? 'would-assign-existing'
      : 'would-upload-and-assign'
    plan.push({ asset, product, media, action })
  }
  const results = []
  for (const item of plan) {
    let { action, media } = item
    if (apply && action.startsWith('would-')) {
      media ??= await store.upload(item.asset)
      const assigned = await store.assignIfEmpty(item.product.id, media.id)
      action = assigned ? 'assigned' : 'preserved-concurrent-change'
    }
    results.push({
      slug: item.asset.slug,
      filename: item.asset.filename,
      productID: item.product?.id,
      mediaID: media?.id,
      action,
    })
  }
  return results
}
