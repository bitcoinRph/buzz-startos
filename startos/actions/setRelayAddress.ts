import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  relayHostOverride: Value.text({
    name: 'Canonical Address',
    description:
      'The single hostname (or full URL) clients will use to reach this relay, e.g. "buzz.example.com" or "xyz.onion". Leave empty to auto-select (clearnet domain, then LAN .local, then Tor). Buzz binds all data to this host: changing it starts a fresh, empty community on the new host.',
    default: null,
    required: false,
    masked: false,
  }),
})

export const setRelayAddress = sdk.Action.withInput(
  'set-relay-address',

  async ({ effects }) => ({
    name: i18n('Set Canonical Address'),
    description: i18n(
      'Choose which of this server’s addresses is the canonical one for Buzz clients. All data is bound to this host.',
    ),
    warning: i18n(
      'Changing the canonical address creates a fresh community on the new host. Existing channels and messages remain stored, but are only reachable via the previous address.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    relayHostOverride:
      (await storeJson.read((s) => s.relayHostOverride).once()) || null,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      relayHostOverride: input.relayHostOverride?.trim() || undefined,
    }),
)
