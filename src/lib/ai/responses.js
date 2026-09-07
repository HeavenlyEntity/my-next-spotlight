export function exportResponse(
  text,
  type = 'text/markdown',
  status = 200,
  links = ''
) {
  if (new TextEncoder().encode(text).length > 4 * 1024 * 1024)
    return new Response(
      'Document exceeds the export limit. Use the subject indexes.',
      {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    )
  return new Response(text, {
    status,
    headers: {
      'Content-Type': type + '; charset=utf-8',
      'Cache-Control':
        status === 200 ? 'public, max-age=0, s-maxage=60' : 'no-store',
      ...(status === 503 ? { 'Retry-After': '60' } : {}),
      ...(links ? { Link: links } : {}),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
export function exportKey(segments) {
  if (
    !Array.isArray(segments) ||
    segments.some((s) => !s || s === '.' || s === '..' || /[\\/%]/.test(s))
  )
    return null
  const key = segments.join('/')
  return key.endsWith('.md') ? key.slice(0, -3) : null
}
