import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_0_5_20_0_a3 = VersionInfo.of({
  version: '0.5.20:1-alpha.3',
  releaseNotes: {
    en_US:
      'Restore Buzz iOS compatibility behind StartOS TLS termination by accepting NIP-42 ws/wss scheme aliases only for the same normalized relay authority. Also restrict the desktop-v0.5.20 SQLx repair to the single known legacy migration-5 checksum; unknown migration drift remains untouched so SQLx fails closed.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
