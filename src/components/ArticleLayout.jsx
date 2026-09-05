import { ArticleLayoutFull } from '@/components/ArticleLayoutFull'

/* Deliberately NOT a client component. The RSS feed calls this from the server
   with `isRssFeed`, which needs nothing but the children back; only the page
   chrome below needs the router, and that lives in its own client module. */
export function ArticleLayout({ children, meta, isRssFeed = false }) {
  if (isRssFeed) {
    return children
  }

  return <ArticleLayoutFull meta={meta}>{children}</ArticleLayoutFull>
}
