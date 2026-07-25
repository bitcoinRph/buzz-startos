import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { mintInvite } from '../invite'
import {
  communityHostFromOrigin,
  dbName,
  dbUser,
  postgresPort,
  resolveCanonicalOrigin,
  toWebsocketUrl,
} from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  ttlHours: Value.number({
    name: 'Invite valid for (hours)',
    description:
      'How long the invite link works before it expires. Range 1–720 (30 days).',
    default: 72,
    required: true,
    integer: true,
    min: 1,
    max: 720,
    units: 'hours',
  }),
})

// Guard host before interpolating into SQL. Hostnames only ever contain these
// characters (letters, digits, dot, hyphen, colon+brackets for IPv6[:port]).
const HOST_RE = /^[a-z0-9.\-:[\]]+$/i

export const createInvite = sdk.Action.withInput(
  'create-mobile-invite',

  async ({ effects }) => ({
    name: i18n('Create Mobile Invite'),
    description: i18n(
      'Mint an invite link to add this community to the Buzz mobile app. On a closed relay, claiming the invite also admits the device.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({ ttlHours: 72 }),

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
    const host = communityHostFromOrigin(origin)
    if (!host || !HOST_RE.test(host)) {
      throw new Error(`Could not derive a valid community host from ${origin}`)
    }

    // Look up the community UUID the relay seeded for this host. The community
    // is created on first relay startup, so this is empty only before the relay
    // has ever run against this address.
    const dbUrl = `postgres://${dbUser}:${pgPassword}@127.0.0.1:${postgresPort}/${dbName}`
    const communityId = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      null,
      'invite-lookup',
      async (sub) => {
        const res = await sub.exec([
          'psql',
          dbUrl,
          '-tAc',
          `SELECT id FROM communities WHERE lower(host) = lower('${host}')`,
        ])
        return res.stdout.toString().trim()
      },
    )

    if (!communityId) {
      throw new Error(
        `No community is registered for host "${host}" yet. Ensure the relay has started at this address (Set Canonical Address), then retry.`,
      )
    }

    const { code, expiresAt } = mintInvite(
      relayKey,
      communityId,
      input.ttlHours * 3600,
    )

    const wsUrl = toWebsocketUrl(origin)
    const httpsLink = `${origin}/invite/${code}`
    const appLink = `buzz://join?relay=${encodeURIComponent(wsUrl)}&code=${encodeURIComponent(code)}`
    const expiresIso = new Date(expiresAt * 1000).toISOString()

    return {
      version: '1' as const,
      title: 'Mobile Invite',
      message:
        `Open the invite link on your iPhone (Safari → "Open in Buzz"), or use the buzz:// link directly. ` +
        `Expires ${expiresIso}.`,
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: 'Invite link (open on phone)',
            description: null,
            value: httpsLink,
            masked: false,
            copyable: true,
            qr: true,
          },
          {
            type: 'single',
            name: 'App handoff link (buzz://)',
            description: null,
            value: appLink,
            masked: false,
            copyable: true,
            qr: true,
          },
          {
            type: 'single',
            name: 'Expires',
            description: null,
            value: expiresIso,
            masked: false,
            copyable: false,
            qr: false,
          },
        ],
      },
    }
  },
)
