import ReactDOMServer from 'react-dom/server'
import { Feed } from 'feed'

import { getAllArticles } from './getAllArticles'

export async function buildFeed() {
  let articles = await getAllArticles()
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  let author = { name: 'Alec Mingione', email: 'amware.develop@gmail.com' }

  let feed = new Feed({
    title: author.name,
    description: 'Writing on software design, company building, and more.',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/rss/feed.xml`,
      json: `${siteUrl}/rss/feed.json`,
    },
  })

  for (let article of articles) {
    let url = `${siteUrl}/articles/${article.slug}`
    let html = ReactDOMServer.renderToStaticMarkup(
      <article.component isRssFeed />
    )
    feed.addItem({
      title: article.title,
      id: url,
      link: url,
      description: article.description,
      content: html,
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return feed
}
