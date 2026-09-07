import { documentIndex } from '@/lib/ai/documents'
export default async function sitemap() {
  const docs = await documentIndex()
  return [
    ...new Map(
      docs.map((doc) => [
        doc.source,
        {
          url: doc.source,
          ...(doc.modified ? { lastModified: doc.modified } : {}),
        },
      ])
    ).values(),
    { url: docs[0].machine },
  ]
}
