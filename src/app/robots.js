import { siteOrigin } from '@/lib/site-origin'
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/access/',
          '/checkout/',
          '/machine-export/',
        ],
      },
    ],
    sitemap: siteOrigin + '/sitemap.xml',
  }
}
