import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  ownerPubkey: Value.text({
    name: 'Owner Pubkey (hex)',
    description:
      'Your Nostr public key in 64-character hex format (not npub). On startup, the relay bootstraps this pubkey as the community owner.',
    default: null,
    required: true,
    masked: false,
    patterns: [
      {
        regex: '^[0-9a-fA-F]{64}$',
        description: 'Must be exactly 64 hexadecimal characters',
      },
    ],
  }),
})

export const setOwnerPubkey = sdk.Action.withInput(
  'set-owner-pubkey',

  async ({ effects }) => ({
    name: i18n('Set Owner Pubkey'),
    description: i18n(
      'Register your Nostr pubkey as the relay owner. The owner is bootstrapped into the community with the owner role on startup.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    ownerPubkey:
      (await storeJson.read((s) => s.ownerPubkey).once()) || undefined,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      ownerPubkey: input.ownerPubkey.trim().toLowerCase(),
    }),
)
