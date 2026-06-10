import crypto from 'crypto'

export type AccessTokenPayload = {
  purchaseId: string | number
  itemType: 'product' | 'course' | 'service'
  itemId: string | number
  jti: string
  exp: number // epoch ms
}

const SECRET = process.env.ACCESS_TOKEN_SECRET || ''
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function sign(data: string): string {
  return b64url(crypto.createHmac('sha256', SECRET).update(data).digest())
}

export function createAccessToken(
  input: Omit<AccessTokenPayload, 'jti' | 'exp'> & { ttlMs?: number }
): { token: string; jti: string; exp: number } {
  if (!SECRET) throw new Error('ACCESS_TOKEN_SECRET is not configured')
  const jti = crypto.randomUUID()
  const exp = Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)
  const payload: AccessTokenPayload = {
    purchaseId: input.purchaseId,
    itemType: input.itemType,
    itemId: input.itemId,
    jti,
    exp,
  }
  const body = b64url(JSON.stringify(payload))
  const token = `${body}.${sign(body)}`
  return { token, jti, exp }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  if (!token || !SECRET) return null
  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) return null
  const body = token.slice(0, dotIdx)
  const sig = token.slice(dotIdx + 1)
  if (!body || !sig || sig.includes('.')) return null
  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let payload: AccessTokenPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
  return payload
}
