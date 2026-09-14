import type { Metadata } from 'next'
import catalog from './og-catalog.json'

const imageKeys = new Set(catalog.map((item) => item.key))

type SocialImage = {
  url: string
  alt?: string | null
  width?: number
  height?: number
}

/** Payload uploads may be unpopulated IDs; use the branded fallback in that case. */
export function cmsSocialImage(value: unknown): SocialImage | undefined {
  if (!value || typeof value !== 'object' || !('url' in value)) return
  const media = value as SocialImage
  if (typeof media.url !== 'string' || !media.url.trim()) return
  return {
    url: media.url,
    ...(typeof media.alt === 'string' && { alt: media.alt }),
    ...(typeof media.width === 'number' &&
      media.width > 0 && { width: media.width }),
    ...(typeof media.height === 'number' &&
      media.height > 0 && { height: media.height }),
  }
}

/** Add share artwork without changing page copy, canonicals or article metadata. */
export function withSocialImage(
  metadata: Metadata,
  key: string,
  override?: SocialImage
): Metadata {
  const title =
    typeof metadata.title === 'string'
      ? metadata.title
      : metadata.title && 'absolute' in metadata.title
      ? metadata.title.absolute
      : metadata.title && 'default' in metadata.title
      ? metadata.title.default
      : 'AMWare'
  const image = override?.url
    ? { ...override, alt: override.alt || `${title} | AMWare` }
    : {
        url: `/images/og/amware/${imageKeys.has(key) ? key : 'products'}.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: `${title} | AMWare`,
      }

  return {
    ...metadata,
    openGraph: {
      siteName: 'AMWare',
      title,
      description: metadata.description ?? undefined,
      ...(metadata.openGraph || { type: 'website' as const }),
      images: [image],
    },
    twitter: {
      title,
      description: metadata.description ?? undefined,
      ...metadata.twitter,
      card: 'summary_large_image',
      images: [{ url: image.url, alt: image.alt }],
    },
  }
}

/** Kit previews follow the artwork catalog; other products keep their own imagery. */
export function withProductSocialImage(
  metadata: Metadata,
  product: { slug?: string | null; ogImage?: unknown; heroImage?: unknown }
): Metadata {
  const edition = catalog.find(
    (item) => item.path === `/products/${product.slug}`
  )
  return withSocialImage(
    metadata,
    edition?.key ?? 'home',
    cmsSocialImage(product.ogImage) ??
      (edition ? undefined : cmsSocialImage(product.heroImage))
  )
}
