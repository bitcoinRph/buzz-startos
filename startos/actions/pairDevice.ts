import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import {
  dbName,
  dbUser,
  mobileInviteOriginError,
  postgresPort,
  redisPort,
  resolveCanonicalOrigin,
  toWebsocketUrl,
} from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  nsec: Value.text({
    name: 'Your Nostr secret key (nsec) — optional',
    description:
      'Paste your nsec… to sign in on the phone as your existing identity. ' +
      'Leave blank to generate a fresh device identity. This key is embedded ' +
      'in the pairing code, so treat the code like a password.',
    default: null,
    required: false,
    masked: true,
  }),
})

/**
 * Resolve the identity to hand the phone: either the user's pasted nsec, or a
 * freshly generated device key. Returns the bech32 nsec (for the payload) and
 * the hex pubkey (for membership admission).
 */
function resolveKeypair(inputNsec?: string): { nsec: string; pubkey: string } {
  const trimmed = inputNsec?.trim()
  if (trimmed) {
    let decoded: ReturnType<typeof nip19.decode>
    try {
      decoded = nip19.decode(trimmed)
    } catch {
      throw new Error('That does not look like a valid nsec… secret key.')
    }
    if (decoded.type !== 'nsec') {
      throw new Error(`Provide an nsec… secret key, not a ${decoded.type}.`)
    }
    const sk = decoded.data
    return { nsec: trimmed, pubkey: getPublicKey(sk) }
  }
  const sk = generateSecretKey()
  return { nsec: nip19.nsecEncode(sk), pubkey: getPublicKey(sk) }
}

export const pairDevice = sdk.Action.withInput(
  'pair-mobile-device',

  async ({ effects }) => ({
    name: i18n('Pair Mobile Device'),
    description: i18n(
      'Generate a QR/pairing code that connects the Buzz mobile app directly to this relay, without an invite link. Recommended for iOS.',
    ),
    warning:
      'The pairing code contains a private key. Anyone who scans it gains ' +
      'this identity — show it only to your own device and do not screenshot ' +
      'or share it.',
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({ nsec: undefined }),

  async ({ effects, input }) => {
    const store = await storeJson.read((s) => s).once()
    const relayKey = store?.relayPrivateKey
    const pgPassword = store?.postgresPassword
    if (!relayKey || !pgPassword) {
      throw new Error(
        'Runtime secrets are not initialized yet. Start the service once, then try again.',
      )
    }

    const origin = await resolveCanonicalOrigin(
      effects,
      store?.relayHostOverride,
    )

    // The mobile app rejects non-HTTPS, loopback, and private-IP relay URLs
    // (pairing_provider.dart `_validateRelayUrl`). Refuse to mint a code the
    // phone would reject, and point the operator at Set Canonical Address.
    const originError = mobileInviteOriginError(origin)
    if (originError) {
      throw new Error(originError)
    }

    const { nsec, pubkey } = resolveKeypair(input.nsec ?? undefined)

    // On a closed relay the phone's NIP-42 auth is rejected unless the device
    // identity is an admitted member, and the app validates credentials before
    // it stores the community — so admit the identity now (unless it is already
    // the owner, who is bootstrapped separately).
    const closed = Boolean(store?.closedMembership && store?.ownerPubkey)
    let admitted = false
    if (closed && pubkey !== store?.ownerPubkey) {
      const env = {
        DATABASE_URL: `postgres://${dbUser}:${pgPassword}@127.0.0.1:${postgresPort}/${dbName}`,
        REDIS_URL: `redis://127.0.0.1:${redisPort}`,
        // buzz-admin resolves the community from RELAY_URL's host, so it must
        // match exactly what the relay daemon uses.
        RELAY_URL: toWebsocketUrl(origin),
        BUZZ_RELAY_PRIVATE_KEY: relayKey,
      }
      const { stderr, exitCode } = await sdk.SubContainer.withTemp(
        effects,
        { imageId: 'buzz' },
        null,
        'pair-admit',
        async (sub) =>
          sub.exec(
            [
              '/usr/local/bin/buzz-admin',
              'add-member',
              '--pubkey',
              pubkey,
              '--role',
              'member',
            ],
            { env },
          ),
      )
      if (exitCode !== 0) {
        throw new Error(
          stderr.toString().trim() ||
            `Failed to admit the device (buzz-admin exited ${exitCode}).`,
        )
      }
      admitted = true
    }

    // The mobile app's direct-pairing path accepts `buzz://<base64url(json)>`,
    // decodes it, and stores `relayUrl` verbatim. We hand it an https:// origin
    // (which the app maps to wss://) — unlike invite links, which the app
    // stores as wss:// and then wrongly downgrades to ws://.
    const payload = Buffer.from(
      JSON.stringify({ relayUrl: origin, nsec, pubkey }),
    ).toString('base64url')
    const code = `buzz://${payload}`
    const npub = nip19.npubEncode(pubkey)

    const message =
      `On your phone, open Buzz's pairing screen and scan this QR (or paste ` +
      `the code). It connects the app to ${origin} as ${npub}. ` +
      (admitted ? 'This identity was admitted to your closed relay. ' : '') +
      `For a .local address the phone must be on your LAN and trust this ` +
      `server's Root CA. The code contains a private key — keep it secret.`

    return {
      version: '1' as const,
      title: 'Mobile Pairing Code',
      message,
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: 'Pairing code (scan in Buzz)',
            description: 'Contains a private key. Treat it like a password.',
            value: code,
            masked: false,
            copyable: true,
            qr: true,
          },
          {
            type: 'single',
            name: 'Device identity (npub)',
            description: null,
            value: npub,
            masked: false,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
