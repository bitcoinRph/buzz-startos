// Here we define any constants or functions that are shared by multiple components
// throughout the package codebase.

export const webPort = 3000
export const healthPort = 8080
export const postgresPort = 5432
export const redisPort = 6379
export const s3Port = 9000

export const dbUser = 'buzz'
export const dbName = 'buzz'
export const s3User = 'buzz'
export const s3Bucket = 'buzz-media'

/**
 * Pick the canonical HTTP(S) origin for this deployment from the exported
 * interface URLs.
 *
 * Buzz resolves the community (tenant) from the connection host, and the
 * relay seeds exactly one community for the host in RELAY_URL at startup, so
 * one address must be chosen as canonical. Preference order: clearnet domain,
 * then LAN (.local), then Tor (.onion), then raw IP.
 */
export function pickCanonicalOrigin(urls: string[]): string | null {
  const parsed = urls.flatMap((u) => {
    try {
      return [new URL(u)]
    } catch {
      return []
    }
  })
  const isOnion = (u: URL) => u.hostname.endsWith('.onion')
  const isLocal = (u: URL) => u.hostname.endsWith('.local')
  const isIp = (u: URL) =>
    /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname.includes(':')

  const domain = parsed.find(
    (u) => u.protocol === 'https:' && !isOnion(u) && !isLocal(u) && !isIp(u),
  )
  const local = parsed.find((u) => u.protocol === 'https:' && isLocal(u))
  const onion = parsed.find(isOnion)
  const chosen = domain ?? local ?? onion ?? parsed[0]

  return chosen ? chosen.origin : null
}

/**
 * Normalize a user-provided host override into an HTTP(S) origin.
 * Accepts a bare hostname or a full URL. Onion hosts default to http.
 */
export function originFromOverride(override: string): string | null {
  const trimmed = override.trim()
  if (!trimmed) return null
  const bareHost = trimmed.replace(/\/.*$/, '')
  const withScheme = trimmed.includes('://')
    ? trimmed
    : `${bareHost.endsWith('.onion') ? 'http' : 'https'}://${trimmed}`
  try {
    return new URL(withScheme).origin
  } catch {
    return null
  }
}

/** Convert an http(s) origin to the equivalent ws(s) URL. */
export function toWebsocketUrl(origin: string): string {
  return origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
}
