import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {
  prepareProductImageAssets,
  importProductImages,
} from '../importProductImages.mjs'

const dirs = []
afterEach(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { recursive: true, force: true }))
  )
  dirs.length = 0
})
async function assetsDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'amware-og-'))
  dirs.push(dir)
  return dir
}
const catalog = [
  { key: 'first', path: '/products/first', title: 'First kit' },
  { key: 'last', path: '/products/last', title: 'Last kit' },
]
async function png(dir, key, width = 1200) {
  await sharp({
    create: { width, height: 630, channels: 3, background: '#663388' },
  })
    .png()
    .toFile(path.join(dir, `${key}.png`))
}

function memoryStore(
  products = [
    { id: 1, slug: 'first', ogImage: null, heroImage: 99, status: 'draft' },
  ]
) {
  const state = { products: structuredClone(products), media: [], uploads: 0 }
  return {
    state,
    async findProduct(slug) {
      return state.products.find((item) => item.slug === slug)
    },
    async findMedia(filename) {
      return state.media.find((item) => item.filename === filename)
    },
    async upload(asset) {
      const media = { id: 10 + state.media.length, filename: asset.filename }
      state.media.push(media)
      state.uploads++
      return media
    },
    async assignIfEmpty(id, mediaID) {
      const item = state.products.find((item) => item.id === id)
      if (item.ogImage != null) return false
      item.ogImage = mediaID
      return true
    },
  }
}
const prepared = [
  {
    slug: 'first',
    key: 'first',
    title: 'First',
    filename: 'amware-og-first-hash.png',
    data: Buffer.from('png'),
  },
]

describe('product social image asset preflight', () => {
  it('validates every input before accepting a set and uses deterministic content names', async () => {
    const dir = await assetsDir()
    await png(dir, 'first')
    await png(dir, 'last')
    const a = await prepareProductImageAssets(dir, catalog)
    const b = await prepareProductImageAssets(dir, catalog)
    expect(a.map((item) => item.filename)).toEqual(
      b.map((item) => item.filename)
    )
    expect(a[0].filename).toMatch(/^amware-og-first-[a-f0-9]{64}\.png$/)
    expect(a[0].data.length).toBeGreaterThan(0)
  })
  it('rejects a missing final asset', async () => {
    const dir = await assetsDir()
    await png(dir, 'first')
    await expect(prepareProductImageAssets(dir, catalog)).rejects.toThrow(
      'last.png'
    )
  })
  it('rejects incorrect dimensions and corrupt PNG files', async () => {
    const dir = await assetsDir()
    await png(dir, 'first', 600)
    await expect(prepareProductImageAssets(dir, catalog)).rejects.toThrow(
      '1200 × 630'
    )
    await writeFile(path.join(dir, 'first.png'), 'not a PNG')
    await expect(prepareProductImageAssets(dir, catalog)).rejects.toThrow(
      'first.png'
    )
  })
})
describe('product social image administrative import', () => {
  it('defaults to a plan without creating media or editing products', async () => {
    const store = memoryStore()
    const before = structuredClone(store.state)
    const result = await importProductImages({ store, assets: prepared })
    expect(result).toMatchObject([
      { slug: 'first', action: 'would-upload-and-assign' },
    ])
    expect(store.state).toEqual(before)
  })
  it('uploads once, assigns only ogImage, and is idempotent on a rerun', async () => {
    const store = memoryStore()
    await importProductImages({ store, assets: prepared, apply: true })
    expect(store.state.products).toEqual([
      { id: 1, slug: 'first', ogImage: 10, heroImage: 99, status: 'draft' },
    ])
    const result = await importProductImages({
      store,
      assets: prepared,
      apply: true,
    })
    expect(store.state.uploads).toBe(1)
    expect(result[0].action).toBe('already-assigned')
  })
  it('preserves custom previews and reports missing products without creating them', async () => {
    const store = memoryStore([{ id: 1, slug: 'first', ogImage: 4 }])
    const result = await importProductImages({
      store,
      assets: [...prepared, { ...prepared[0], slug: 'missing' }],
      apply: true,
    })
    expect(result.map((item) => item.action)).toEqual([
      'preserved-custom',
      'missing-product',
    ])
    expect(store.state.products).toEqual([{ id: 1, slug: 'first', ogImage: 4 }])
    expect(store.state.media).toEqual([])
  })
  it('reuses a previous upload after a partially completed run', async () => {
    const store = memoryStore()
    store.state.media.push({ id: 24, filename: prepared[0].filename })
    await importProductImages({ store, assets: prepared, apply: true })
    expect(store.state.products[0].ogImage).toBe(24)
    expect(store.state.uploads).toBe(0)
  })
  it('preserves a preview changed by an editor between planning and assignment', async () => {
    const store = memoryStore()
    const upload = store.upload
    store.upload = async (asset) => {
      store.state.products[0].ogImage = 77
      return upload(asset)
    }
    const result = await importProductImages({
      store,
      assets: prepared,
      apply: true,
    })
    expect(store.state.products[0].ogImage).toBe(77)
    expect(result[0].action).toBe('preserved-concurrent-change')
  })
})
