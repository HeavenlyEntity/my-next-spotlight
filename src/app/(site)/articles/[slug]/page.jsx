import { notFound } from 'next/navigation'
import { getAllArticles } from '@/lib/getAllArticles'

export const dynamicParams = false

export async function generateStaticParams() {
  const articles = await getAllArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

async function loadArticle(slug) {
  try {
    const mod = await import(`@/content/articles/${slug}/index.mdx`)
    return { meta: mod.meta, Post: mod.default }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const loaded = await loadArticle(slug)
  if (!loaded) return {}
  const { meta } = loaded
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const canonical = meta.canonical
  const ogImage =
    meta.og_image && siteUrl && meta.og_image.startsWith('/')
      ? `${siteUrl}${meta.og_image}`
      : meta.og_image
  const keywords = Array.isArray(meta.keywords)
    ? meta.keywords
    : meta.keywords
    ? String(meta.keywords)
        .split(',')
        .map((k) => k.trim())
    : undefined
  return {
    title: meta.title,
    description: meta.description,
    authors: meta.author ? [{ name: meta.author }] : undefined,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: 'article',
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: meta.og_image_alt }] : undefined,
      publishedTime: meta.date,
      tags: meta.tags,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: meta.title,
      description: meta.description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const loaded = await loadArticle(slug)
  if (!loaded) notFound()
  const { Post } = loaded
  return <Post />
}
