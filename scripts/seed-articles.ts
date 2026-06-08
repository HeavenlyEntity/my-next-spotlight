import { getPayload } from 'payload'
import glob from 'fast-glob'
import { readFileSync } from 'fs'
import path from 'path'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })
  const dir = path.join(process.cwd(), 'src/pages/articles')
  const files = await glob(['*.mdx', '*/index.mdx'], { cwd: dir })

  for (const file of files) {
    const src = readFileSync(path.join(dir, file), 'utf8')
    const match = src.match(/export const meta = (\{[\s\S]*?\n\})/)
    if (!match) {
      console.warn(`No meta found in ${file}; skipping`)
      continue
    }
    // Files are trusted (our own content); meta is a plain object literal.
    // eslint-disable-next-line no-new-func
    const meta = new Function(`return (${match[1]})`)() as {
      title: string
      date: string
      author?: string
      description?: string
      keywords?: string[] | string
      canonical?: string
    }

    const slug = file.replace(/(\/index)?\.mdx$/, '')

    const keywords = Array.isArray(meta.keywords)
      ? meta.keywords.map((k) => ({ keyword: k }))
      : typeof meta.keywords === 'string'
      ? meta.keywords.split(',').map((k) => ({ keyword: k.trim() }))
      : []

    const data = {
      title: meta.title,
      slug,
      publishedDate: meta.date,
      author: meta.author || 'Alec Mingione',
      description: meta.description,
      keywords,
      canonical: meta.canonical,
      mdxSlug: slug,
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length) {
      await payload.update({
        collection: 'articles',
        id: existing.docs[0].id,
        data,
      })
      console.log(`Updated: ${slug}`)
    } else {
      await payload.create({ collection: 'articles', data })
      console.log(`Created: ${slug}`)
    }
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
