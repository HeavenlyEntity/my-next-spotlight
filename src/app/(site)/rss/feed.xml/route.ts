import { buildFeed } from '@/lib/buildFeed'

export const revalidate = 3600

export async function GET() {
  const feed = await buildFeed()
  return new Response(feed.rss2(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
