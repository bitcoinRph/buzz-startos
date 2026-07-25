// Here we define any constants or functions that are shared by multiple components
// throughout the package codebase.

import { T } from '@start9labs/start-sdk'

export const webPort = 3000
export const healthPort = 8080
export const postgresPort = 5432
export const redisPort = 6379
export const s3Port = 9000

export const dbUser = 'buzz'
export const dbName = 'buzz'
export const s3User = 'buzz'
export const s3Bucket = 'buzz-media'

/** Host id of the MultiHost binding created in interfaces.ts. */
export const uiMultiHostId = 'ui-multi'

/**
 * Build an HTTP(S) origin from a raw HostnameInfo entry. Prefers TLS when the
 * binding exposes an ssl port; onion hostnames use plain http (Tor provides
 * the transport security).
 */
export function originFromHostname(h: T.HostnameInfo): string | null {
  if (h.kind === 'onion') {
    const port = h.hostname.port
    return `http://${h.hostname.value}${port && port !== 80 ? `:${port}` : ''}`
  }
  const hn = h.hostname
  const value = hn.kind === 'ipv6' ? `[${hn.value}]` : hn.value
  if (hn.sslPort) {
    return `https://${value}${hn.sslPort !== 443 ? `:${hn.sslPort}` : ''}`
  }
  if (hn.port) {
    return `http://${value}${hn.port !== 80 ? `:${hn.port}` : ''}`
  }
  return null
}

/**
 * Pick the canonical HTTP(S) origin for this deployment from the raw
 * hostname info of the ui-multi host binding.
 *
 * Buzz resolves the community (tenant) from the connection host, and the
 * relay seeds exactly one community for the host in RELAY_URL at startup, so
 * one address must be chosen as canonical. Preference order: clearnet domain,
 * then LAN (.local), then Tor (.onion), then raw IP.
 */
export function pickCanonicalOrigin(
  hostnames: T.HostnameInfo[],
): string | null {
  const domain = hostnames.find(
    (h) => h.kind === 'ip' && h.hostname.kind === 'domain',
  )
  const local = hostnames.find(
    (h) => h.kind === 'ip' && h.hostname.kind === 'local',
  )
  const onion = hostnames.find((h) => h.kind === 'onion')
  const ip = hostnames.find(
    (h) =>
      h.kind === 'ip' &&
      (h.hostname.kind === 'ipv4' || h.hostname.kind === 'ipv6'),
  )
  const chosen = domain ?? local ?? onion ?? ip
  return chosen ? originFromHostname(chosen) : null
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

/**
 * Resolve the deployment's canonical HTTP(S) origin the same way main.ts does,
 * so actions (invite links, RELAY_URL for buzz-admin) agree with the running
 * relay: user override first, then the ui-multi host binding, then localhost.
 *
 * `callback` is passed to getHostInfo — main.ts passes effects.constRetry to
 * re-run on host changes; one-shot actions omit it.
 */
export async function resolveCanonicalOrigin(
  effects: T.Effects,
  relayHostOverride: string | undefined,
  callback?: () => void,
): Promise<string> {
  const override = relayHostOverride
    ? originFromOverride(relayHostOverride)
    : null
  if (override) return override
  const uiHost = await effects
    .getHostInfo({ hostId: uiMultiHostId, callback })
    .catch(() => null)
  const hostnames = uiHost?.hostnameInfo?.[webPort] ?? []
  return pickCanonicalOrigin(hostnames) ?? `http://localhost:${webPort}`
}

/**
 * The community lookup key stored in `communities.host` — the origin's host
 * plus an explicit non-default port, lowercased. Mirrors the relay's
 * `relay_url_authority` + `normalize_host`.
 */
export function communityHostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host.toLowerCase()
  } catch {
    return ''
  }
}
