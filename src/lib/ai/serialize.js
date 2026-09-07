import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkGfm from 'remark-gfm-modern'

export function safeUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value))
    return undefined
  if (
    /^(https?:\/\/|mailto:)/i.test(value) ||
    /^\/(?!\/)/.test(value) ||
    value.startsWith('#')
  )
    return value
  return undefined
}
export const plain = (value) =>
  String(value ?? '')
    .replace(/[—–]/g, '-')
    .replace(/[\\`*_[\]<>]/g, '\\$&')
export const link = (label, url) =>
  safeUrl(url) ? `[${plain(label)}](<${url}>)` : plain(label)

// Read literal metadata from the parsed export AST, never evaluate JavaScript.
function literal(node) {
  if (node?.type === 'Literal') return node.value
  if (node?.type === 'ArrayExpression') return node.elements.map(literal)
  if (node?.type === 'ObjectExpression')
    return Object.fromEntries(
      node.properties
        .filter((p) => p.type === 'Property' && !p.computed)
        .map((p) => [p.key.name ?? p.key.value, literal(p.value)])
    )
  return undefined
}
export function serializeMdx(source, sourceUrl) {
  const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)
  const tree = parser.parse(source)
  let meta = {}
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type !== 'ExportNamedDeclaration') continue
      for (const declaration of statement.declaration?.declarations ?? []) {
        if (declaration.id?.name === 'meta')
          meta = literal(declaration.init) ?? {}
      }
    }
  }
  const clean = (nodes) =>
    nodes.flatMap((node) => {
      if (node.type === 'mdxjsEsm') return []
      if (['mdxFlowExpression', 'mdxTextExpression'].includes(node.type))
        return [
          {
            type: 'text',
            value: '[Interactive content: see original article]',
          },
        ]
      if (['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type)) {
        const children = clean(node.children ?? [])
        if (children.length) return children
        const text = {
          type: 'text',
          value: 'Embedded content: see original article.',
        }
        return [
          node.type === 'mdxJsxFlowElement'
            ? { type: 'paragraph', children: [text] }
            : text,
        ]
      }
      if (node.children) node.children = clean(node.children)
      if (['link', 'image', 'definition'].includes(node.type) && node.url) {
        // Relative MDX image imports are not public URLs; retain their captions and source context.
        if (node.type === 'image' && !/^(https?:|\/)/.test(node.url))
          return [
            {
              type: 'text',
              value: `Image: ${
                node.alt || 'illustration'
              } (see original article)`,
            },
          ]
        try {
          node.url = new URL(node.url, sourceUrl).href
        } catch {
          node.url = sourceUrl
        }
        if (!safeUrl(node.url)) node.url = sourceUrl
      }
      return [node]
    })
  tree.children = clean(tree.children)
  return {
    meta,
    markdown: unified().use(remarkStringify).use(remarkGfm).stringify(tree),
  }
}

// Only textual public nodes are serialized. Relationship/upload payloads are never traversed.
export function serializeLexical(data) {
  const render = (node) => {
    if (!node) return ''
    if (node.type === 'text') {
      let value = plain(node.text)
      if (node.format & 16) {
        const raw = String(node.text)
        const ticks = '`'.repeat(
          Math.max(0, ...(raw.match(/`+/g) ?? []).map((s) => s.length)) + 1
        )
        return ticks + ' ' + raw + ' ' + ticks
      }
      if (node.format & 1) value = `**${value}**`
      if (node.format & 2) value = `*${value}*`
      return value
    }
    if (['upload', 'relationship', 'block'].includes(node.type))
      return '\n\n[Embedded resource: see original page]\n\n'
    const children = (node.children ?? []).map(render).join('')
    switch (node.type) {
      case 'root':
        return children
      case 'paragraph':
        return children + '\n\n'
      case 'heading':
        return (
          '#'.repeat(
            Math.min(6, Math.max(2, Number(node.tag?.slice(1)) || 2))
          ) +
          ' ' +
          children +
          '\n\n'
        )
      case 'linebreak':
        return '\n'
      case 'link':
      case 'autolink': {
        const url = node.fields?.url ?? node.url
        return safeUrl(url) ? `[${children}](<${url}>)` : children
      }
      case 'list':
        return (
          (node.children ?? [])
            .map(
              (item, i) =>
                `${node.listType === 'number' ? `${i + 1}.` : '-'} ${render(
                  item
                )
                  .trim()
                  .replace(/\n/g, '\n  ')}`
            )
            .join('\n') + '\n\n'
        )
      case 'listitem':
        return children + '\n'
      case 'quote':
        return (
          children
            .trim()
            .split('\n')
            .map((l) => '> ' + l)
            .join('\n') + '\n\n'
        )
      case 'code': {
        const raw = (node.children ?? [])
          .map((n) => (n.type === 'linebreak' ? '\n' : n.text ?? ''))
          .join('')
        const fence = '`'.repeat(
          Math.max(2, ...(raw.match(/`+/g) ?? []).map((s) => s.length)) + 1
        )
        const language = String(node.language ?? '').replace(
          /[^a-zA-Z0-9_-]/g,
          ''
        )
        return '\n\n' + fence + language + '\n' + raw + '\n' + fence + '\n\n'
      }
      case 'horizontalrule':
        return '\n\n---\n\n'
      default:
        return children || '[Content available on original page]'
    }
  }
  return render(data?.root).trim()
}
