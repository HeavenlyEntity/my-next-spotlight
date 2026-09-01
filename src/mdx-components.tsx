import type { ComponentType } from 'react'

type MDXComponents = Record<string, ComponentType<Record<string, unknown>>>

// Required by @next/mdx for the App Router. Article typography comes from the
// `Prose`/`prose` wrapper in ArticleLayout, so keep element mapping minimal here.
const components: MDXComponents = {}

export function useMDXComponents(inherited: MDXComponents = {}): MDXComponents {
  return { ...components, ...inherited }
}
