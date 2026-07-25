import { createHash, createHmac, randomBytes } from 'node:crypto'

/**
 * On-box minting of Buzz relay invite codes.
 *
 * Byte-for-byte compatible with the relay's own `invite_token` module
 * (crates/buzz-relay/src/invite_token.rs). A code is:
 *
 *   base64url(payloadJson) + "." + base64url(HMAC-SHA256(key, payloadJson))
 *
 * where key = SHA256(relayPrivKeyBytes ‖ "buzz-invite-v1") and the payload is
 * the serde-serialized `InvitePayload` (field order c, r, e, n; no spaces).
 *
 * The relay verifies the code by recomputing the same HMAC with its own key,
 * so nothing is written to the database at mint time — admission happens when
 * the invite is claimed (`POST /api/invites/claim`, which is membership-gate
 * exempt and inserts the claiming pubkey as a member).
 */

const KEY_DERIVATION_LABEL = 'buzz-invite-v1'
const MIN_TTL_SECS = 60
const MAX_TTL_SECS = 30 * 24 * 60 * 60

/** SHA256(relayPrivKeyBytes ‖ "buzz-invite-v1"). */
function deriveInviteKey(relayPrivHex: string): Buffer {
  return createHash('sha256')
    .update(Buffer.from(relayPrivHex, 'hex'))
    .update(Buffer.from(KEY_DERIVATION_LABEL))
    .digest()
}

export type MintedInvite = {
  code: string
  expiresAt: number
}

/**
 * Mint a member invite code for `communityUuid`, valid for `ttlSecs`
 * (clamped to 60s .. 30d, matching the relay).
 */
export function mintInvite(
  relayPrivHex: string,
  communityUuid: string,
  ttlSecs: number,
): MintedInvite {
  const ttl = Math.min(
    Math.max(Math.floor(ttlSecs), MIN_TTL_SECS),
    MAX_TTL_SECS,
  )
  const expiresAt = Math.floor(Date.now() / 1000) + ttl

  // Field order MUST match the Rust `InvitePayload` struct (c, r, e, n) so the
  // serialized bytes — and therefore the HMAC — match on the relay side.
  const payload = {
    c: communityUuid,
    r: 'member',
    e: expiresAt,
    n: randomBytes(16).toString('base64url'),
  }
  const payloadBytes = Buffer.from(JSON.stringify(payload))
  const mac = createHmac('sha256', deriveInviteKey(relayPrivHex))
    .update(payloadBytes)
    .digest()

  const code = `${payloadBytes.toString('base64url')}.${mac.toString('base64url')}`
  return { code, expiresAt }
}
