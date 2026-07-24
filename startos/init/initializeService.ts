import { utils } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { setOwnerPubkey } from '../actions/setOwnerPubkey'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.write(effects, {
      postgresPassword: utils.getDefaultString({
        charset: 'a-z,A-Z,0-9',
        len: 22,
      }),
      minioRootPassword: utils.getDefaultString({
        charset: 'a-z,A-Z,0-9',
        len: 22,
      }),
      // secp256k1 private key for the relay's stable signing identity
      relayPrivateKey: utils.getDefaultString({
        charset: 'a-f,0-9',
        len: 64,
      }),
      gitHookHmacSecret: utils.getDefaultString({
        charset: 'a-f,0-9',
        len: 64,
      }),
    })
  }

  if (kind !== null) {
    await sdk.action.createOwnTask(effects, setOwnerPubkey, 'important', {
      reason: i18n(
        'Register your Nostr pubkey as the relay owner so you can administer your Buzz community.',
      ),
    })
  }
})
