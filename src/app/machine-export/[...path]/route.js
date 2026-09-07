import { getDocument, discovery, documentMarkdown } from '@/lib/ai/documents'
import { exportKey, exportResponse } from '@/lib/ai/responses'
import { siteOrigin } from '@/lib/site-origin'

export async function GET(request, { params }) {
  const { path } = await params
  const key = exportKey(path)
  if (!key) return exportResponse('Document not found.', 'text/plain', 404)
  try {
    if (['agents', 'sitemap'].includes(key))
      return exportResponse(await discovery(key + '.md'))
    const page = Number(new URL(request.url).searchParams.get('page') ?? 1)
    const doc = await getDocument(key === 'index' ? 'home' : key, page)
    if (!doc) return exportResponse('Document not found.', 'text/plain', 404)
    if (doc.warnings?.length)
      return exportResponse(
        'Some source content is temporarily unavailable. Retry in one minute.',
        'text/plain',
        503
      )
    return exportResponse(
      documentMarkdown(doc),
      'text/markdown',
      200,
      `<${
        doc.id === 'home' ? doc.machine : doc.source
      }>; rel="canonical", <${siteOrigin}/llms.txt>; rel="describedby"`
    )
  } catch {
    return exportResponse(
      'Source content is temporarily unavailable. Retry in one minute.',
      'text/plain',
      503
    )
  }
}
