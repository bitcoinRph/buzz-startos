import { matches, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const { object, string, boolean } = matches

const shape = object({
  postgresPassword: string.optional().onMismatch(undefined),
  minioRootPassword: string.optional().onMismatch(undefined),
  relayPrivateKey: string.optional().onMismatch(undefined),
  gitHookHmacSecret: string.optional().onMismatch(undefined),
  ownerPubkey: string.optional().onMismatch(undefined),
  relayHostOverride: string.optional().onMismatch(undefined),
  // When true (and an owner pubkey is set), the relay enforces NIP-43 relay
  // membership: only admitted pubkeys may connect. Onboard members via the
  // Create Mobile Invite / Manage Members actions.
  closedMembership: boolean.optional().onMismatch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
