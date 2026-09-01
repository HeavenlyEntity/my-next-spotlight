import { buildFeed } from '@/lib/buildFeed'

export const revalidate = 3600

export async function GET() {
  const feed = await buildFeed()
  return new Response(feed.json1(), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  })
}
