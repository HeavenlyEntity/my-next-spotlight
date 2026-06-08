import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

// Cache the Payload instance on globalThis so the Postgres pool is reused
// across requests (and across HMR reloads in dev).
type PayloadCache = {
  client: Payload | null
  promise: Promise<Payload> | null
}

const globalForPayload = globalThis as unknown as {
  _payloadClient?: PayloadCache
}

const cache: PayloadCache = globalForPayload._payloadClient ?? {
  client: null,
  promise: null,
}

if (!globalForPayload._payloadClient) {
  globalForPayload._payloadClient = cache
}

export async function getPayloadClient(): Promise<Payload> {
  if (cache.client) return cache.client
  if (!cache.promise) {
    cache.promise = getPayload({ config })
  }
  cache.client = await cache.promise
  return cache.client
}
