import { describe, it, expect, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ unstable_cache: (fn) => fn }))
vi.mock('react', () => ({ cache: (fn) => fn }))
vi.mock('../../getPayloadClient', () => ({
  getPayloadClient: async () => ({
    find: async ({ collection }) => ({
      docs:
        collection === 'articles'
          ? [
              {
                status: 'published',
                title: 'CMS article',
                slug: 'neatsuite-http',
                description: 'CMS description',
                content: null,
              },
            ]
          : [],
      hasNextPage: false,
    }),
  }),
}))
import {
  getDocument,
  documentIndex,
  documentMarkdown,
  discovery,
} from '../documents.js'
describe('document registry', () => {
  it('retains namespace distinctions and real file articles', async () => {
    const docs = await documentIndex()
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length)
    expect(docs.some((d) => d.id === 'articles/neatsuite-http')).toBe(true)
    expect(docs.some((d) => d.id === 'blog/neatsuite-http')).toBe(true)
    const article = await getDocument('articles/neatsuite-http')
    expect(article.body).toContain('createClient')
    expect(documentMarkdown(article)).toContain(article.source)
  })
  it('returns missing for unknown URLs and invalid pages', async () => {
    expect(await getDocument('access/private')).toBeNull()
    expect(await getDocument('articles', 900)).toBeNull()
    expect(await getDocument('articles', -1)).toBeNull()
  })
  it('keeps discovery aliases identical and declares only implemented formats', async () => {
    expect(await discovery('llms.txt')).toBe(await discovery('llm.txt'))
    expect(await discovery('llms.txt')).toContain(
      'https://www.amware.dev/services.md'
    )
    expect(await discovery('agents.md')).not.toContain('Accept:')
  })
})
