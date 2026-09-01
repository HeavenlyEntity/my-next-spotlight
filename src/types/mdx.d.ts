declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const meta: {
    title: string
    date: string
    author?: string
    description?: string
    keywords?: string[] | string
    canonical?: string
    og_image?: string
    og_image_alt?: string
    tags?: string[]
  }
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}
