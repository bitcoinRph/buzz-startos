import { matches, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const { object, string } = matches

const shape = object({
  postgresPassword: string.optional().onMismatch(undefined),
  minioRootPassword: string.optional().onMismatch(undefined),
  relayPrivateKey: string.optional().onMismatch(undefined),
  gitHookHmacSecret: string.optional().onMismatch(undefined),
  ownerPubkey: string.optional().onMismatch(undefined),
  relayHostOverride: string.optional().onMismatch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
