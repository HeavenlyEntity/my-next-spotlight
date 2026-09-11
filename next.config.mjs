import nextMDX from '@next/mdx'
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // GitHub avatars, shown so a buyer can confirm the account that will
        // receive repository access is theirs. Scoped to this one host and
        // path: a wildcard here would let any URL in the app proxy arbitrary
        // remote images through our own optimiser.
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...[
          'index',
          'about',
          'services',
          'projects',
          'articles',
          'blog',
          'products',
          'courses',
          'contact',
          'agents',
          'sitemap',
        ].map((name) => ({
          source: `/${name}.md`,
          destination: `/machine-export/${name}.md`,
        })),
        ...['articles', 'blog', 'products', 'courses'].map((name) => ({
          source: `/${name}/:slug.md`,
          destination: `/machine-export/${name}/:slug.md`,
        })),
      ],
    }
  },
  experimental: {
    scrollRestoration: true,
  },
}

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['@mapbox/rehype-prism'],
  },
})

export default withPayload(withMDX(nextConfig))
