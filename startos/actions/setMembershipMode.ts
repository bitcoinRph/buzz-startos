import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  closedMembership: Value.toggle({
    name: 'Closed Membership',
    description:
      'When ON, the relay enforces NIP-43 membership: only pubkeys you admit (via Create Mobile Invite or Manage Members) can connect. When OFF, anyone who reaches the address can join. Requires an owner pubkey to be set first, and takes effect after the service restarts.',
    default: false,
  }),
})

export const setMembershipMode = sdk.Action.withInput(
  'set-membership-mode',

  async ({ effects }) => ({
    name: i18n('Set Membership Mode'),
    description: i18n(
      'Choose whether your community is open (anyone can join) or closed (invite/admit only).',
    ),
    warning: i18n(
      'Closed mode only takes effect once an owner pubkey is set, and applies after the next restart. Make sure you can admit yourself (invite or Manage Members) before locking the relay down.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    closedMembership:
      (await storeJson.read((s) => s.closedMembership).once()) ?? false,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, { closedMembership: input.closedMembership }),
)
