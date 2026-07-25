import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import {
  dbName,
  dbUser,
  postgresPort,
  redisPort,
  resolveCanonicalOrigin,
  toWebsocketUrl,
} from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  operation: Value.select({
    name: 'Operation',
    description: 'List, admit (add), or remove a member.',
    default: 'list',
    values: {
      list: 'List members',
      add: 'Add member',
      remove: 'Remove member',
    },
  }),
  pubkey: Value.text({
    name: 'Member Pubkey (npub or hex)',
    description:
      'Required for Add / Remove. A Nostr public key as npub… or 64-char hex. Ignored for List.',
    default: null,
    required: false,
    masked: false,
  }),
})

export const manageMembers = sdk.Action.withInput(
  'manage-members',

  async ({ effects }) => ({
    name: i18n('Manage Members'),
    description: i18n(
      'List, admit, or remove relay members. Adding a pubkey admits it to a closed community without an invite.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({ operation: 'list' as const, pubkey: undefined }),

  async ({ effects, input }) => {
    const store = await storeJson.read((s) => s).once()
    const relayKey = store?.relayPrivateKey
    const pgPassword = store?.postgresPassword
    if (!relayKey || !pgPassword) {
      throw new Error(
        'Runtime secrets are not initialized yet. Start the service once, then try again.',
      )
    }

    const pubkey = input.pubkey?.trim()
    if (
      (input.operation === 'add' || input.operation === 'remove') &&
      !pubkey
    ) {
      throw new Error(`A pubkey is required to ${input.operation} a member.`)
    }

    const origin = await resolveCanonicalOrigin(
      effects,
      store?.relayHostOverride,
    )
    // buzz-admin resolves the community from RELAY_URL's host, so it must match
    // exactly what the relay daemon uses.
    const relayUrl = toWebsocketUrl(origin)

    const env = {
      DATABASE_URL: `postgres://${dbUser}:${pgPassword}@127.0.0.1:${postgresPort}/${dbName}`,
      REDIS_URL: `redis://127.0.0.1:${redisPort}`,
      RELAY_URL: relayUrl,
      BUZZ_RELAY_PRIVATE_KEY: relayKey,
    }

    const command =
      input.operation === 'add'
        ? [
            '/usr/local/bin/buzz-admin',
            'add-member',
            '--pubkey',
            pubkey!,
            '--role',
            'member',
          ]
        : input.operation === 'remove'
          ? ['/usr/local/bin/buzz-admin', 'remove-member', '--pubkey', pubkey!]
          : ['/usr/local/bin/buzz-admin', 'list-members']

    const { stdout, stderr, exitCode } = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'buzz' },
      null,
      'buzz-admin',
      async (sub) => sub.exec(command, { env }),
    )

    const out = stdout.toString().trim()
    const err = stderr.toString().trim()
    if (exitCode !== 0) {
      throw new Error(err || `buzz-admin exited with code ${exitCode}`)
    }

    return {
      version: '1' as const,
      title: 'Manage Members',
      message: out || err || 'Done.',
      result: null,
    }
  },
)
