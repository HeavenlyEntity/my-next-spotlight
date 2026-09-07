export function getSiteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const url = new URL(value)
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error('Invalid origin')
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      throw new Error('Local origin')
    return url.origin
  } catch {
    return 'https://www.amware.dev'
  }
}
export const siteOrigin = getSiteOrigin()
