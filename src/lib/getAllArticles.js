import glob from 'fast-glob'
import * as path from 'path'

async function importArticle(articleFilename) {
  let { meta, default: component } = await import(
    `../content/articles/${articleFilename}`
  )
  return {
    ...meta,
    slug: articleFilename.replace(/(\/index)?\.mdx$/, ''),
    component,
  }
}

export async function getAllArticles() {
  let articleFilenames = await glob(['*/index.mdx'], {
    cwd: path.join(process.cwd(), 'src/content/articles'),
  })

  let articles = await Promise.all(articleFilenames.map(importArticle))

  return articles.sort((a, z) => new Date(z.date) - new Date(a.date))
}
