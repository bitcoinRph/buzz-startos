import { sdk } from '../sdk'
import { getCredentials } from './getCredentials'
import { setOwnerPubkey } from './setOwnerPubkey'
import { setRelayAddress } from './setRelayAddress'
import { setMembershipMode } from './setMembershipMode'
import { createInvite } from './createInvite'
import { manageMembers } from './manageMembers'
import { pairDevice } from './pairDevice'

export const actions = sdk.Actions.of()
  .addAction(getCredentials)
  .addAction(setOwnerPubkey)
  .addAction(setRelayAddress)
  .addAction(setMembershipMode)
  .addAction(createInvite)
  .addAction(manageMembers)
  .addAction(pairDevice)
