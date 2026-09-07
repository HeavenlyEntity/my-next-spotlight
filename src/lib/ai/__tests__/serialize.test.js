import { describe, it, expect } from 'vitest'
import { serializeMdx, serializeLexical, safeUrl } from '../serialize.js'
import { exportKey, exportResponse } from '../responses.js'

describe('public text serialization', () => {
  it('reads literal metadata without evaluating exports and preserves real code', () => {
    const source =
      "import Secret from './secret'\n\nexport const meta = { title: 'Example', date: '2026-09-06' }\n\nexport const surprise = process.exit()\n\n# Example\n\n[Source](/about)\n\n```js\nimport real from 'package'\nconsole.log(real)\n```\n\n<Widget />"
    const result = serializeMdx(
      source,
      'https://www.amware.dev/articles/example'
    )
    expect(result.meta.title).toBe('Example')
    expect(result.markdown).toContain("import real from 'package'")
    expect(result.markdown).toContain('https://www.amware.dev/about')
    expect(result.markdown).not.toContain('process.exit')
    expect(result.markdown).not.toContain('./secret')
    expect(result.markdown).toContain('Embedded content')
  })
  it('never serializes embedded private relationship data', () => {
    const body = serializeLexical({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Public', format: 1 }],
          },
          { type: 'relationship', value: { downloadUrl: 'SECRET' } },
        ],
      },
    })
    expect(body).toContain('**Public**')
    expect(body).not.toContain('SECRET')
  })
  it('rejects unsafe link protocols and traversal exports', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeUrl('//evil.test')).toBeUndefined()
    expect(exportKey(['articles', 'valid-slug.md'])).toBe('articles/valid-slug')
    expect(exportKey(['..', 'secret.md'])).toBeNull()
    expect(exportKey(['articles%2Fsecret.md'])).toBeNull()
  })
  it('sets content type, error status and no-store on unavailable responses', () => {
    const response = exportResponse('Unavailable', 'text/plain', 503)
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('retry-after')).toBe('60')
    expect(exportResponse('# Title').headers.get('content-type')).toContain(
      'text/markdown'
    )
  })
})
