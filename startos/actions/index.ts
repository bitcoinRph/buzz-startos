import { sdk } from '../sdk'
import { getCredentials } from './getCredentials'
import { setOwnerPubkey } from './setOwnerPubkey'
import { setRelayAddress } from './setRelayAddress'

export const actions = sdk.Actions.of()
  .addAction(getCredentials)
  .addAction(setOwnerPubkey)
  .addAction(setRelayAddress)
