import Head from 'next/head'
import { useRouter } from 'next/compat/router'

import { Container } from '@/components/Container'
import { formatDate } from '@/lib/formatDate'
import { Prose } from '@/components/Prose'

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArticleLayout({
  children,
  meta,
  isRssFeed = false,
  previousPathname,
}) {
  let router = useRouter()
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  let resolveUrl = (url) => {
    if (!url) {
      return undefined
    }

    if (/^https?:\/\//.test(url)) {
      return url
    }

    if (url.startsWith('/') && siteUrl) {
      return `${siteUrl}${url}`
    }

    return undefined
  }
  let canonicalUrl = resolveUrl(meta.canonical)
  let keywords = Array.isArray(meta.keywords)
    ? meta.keywords.join(', ')
    : meta.keywords
  let ogImage = resolveUrl(meta.og_image)

  if (isRssFeed) {
    return children
  }

  return (
    <>
      <Head>
        <title>{`${meta.title} - Alec Mingione`}</title>
        <meta name="description" content={meta.description} />
        {meta.author && <meta name="author" content={meta.author} />}
        {keywords && <meta name="keywords" content={keywords} />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && meta.og_image_alt && (
          <meta property="og:image:alt" content={meta.og_image_alt} />
        )}
        {meta.date && (
          <meta property="article:published_time" content={meta.date} />
        )}
        {meta.author && (
          <meta property="article:author" content={meta.author} />
        )}
        {meta.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta
          name="twitter:card"
          content={ogImage ? 'summary_large_image' : 'summary'}
        />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Head>
      <Container className="mt-16 overflow-x-auto lg:mt-32">
        <div className="relative">
          <div className="mx-auto max-w-2xl">
            {previousPathname && (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back to articles"
                className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 lg:absolute lg:-left-5 lg:top-0 lg:mb-0 xl:top-0 xl:left-0"
              >
                <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />
              </button>
            )}
            <article>
              <header className="flex flex-col">
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
                  {meta.title}
                </h1>
                <time
                  dateTime={meta.date}
                  className="order-first flex items-center text-base text-zinc-400 dark:text-zinc-500"
                >
                  <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                  <span className="ml-3">{formatDate(meta.date)}</span>
                </time>
              </header>
              <Prose className="mt-8">{children}</Prose>
            </article>
          </div>
        </div>
      </Container>
    </>
  )
}
