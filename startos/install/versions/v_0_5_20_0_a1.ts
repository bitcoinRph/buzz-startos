import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_20_0_a1 = VersionInfo.of({
 version: '0.5.20:1-alpha.1',
 releaseNotes: {
   en_US:
     'Update packaged Buzz source to desktop-v0.5.20. This release adds KLIPY GIF search to composers, fixes automatic mention preference after send, attributes desktop candidates to the operator, and checks out source in docker.yml merge job.',
 },
 migrations: {
   up: async ({ effects }) => {},
   down: IMPOSSIBLE,
 },
})